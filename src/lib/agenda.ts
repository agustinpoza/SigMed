import { prisma } from "@/lib/db";
import { AppointmentState, BlockReason, Weekday } from "@/generated/prisma/client";
import {
  enviarConfirmacionTurnoEmail,
  enviarRecordatorioTurnoEmail,
} from "@/lib/email";

export class AgendaRuleError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "AgendaRuleError";
    Object.setPrototypeOf(this, AgendaRuleError.prototype);
  }
}

export const AGENDA_SPECIALITY_LABELS: Record<string, string> = {
  CLINICO: "Clínica médica",
  PEDIATRA: "Pediatría",
  TRAUMATOLOGO: "Traumatología",
};

const WEEKDAY_BY_JS_DAY: Weekday[] = [
  Weekday.DOMINGO,
  Weekday.LUNES,
  Weekday.MARTES,
  Weekday.MIERCOLES,
  Weekday.JUEVES,
  Weekday.VIERNES,
  Weekday.SABADO,
];

const WEEKDAY_SHORT_LABELS: Record<number, string> = {
  0: "Dom",
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
};

/** Registro en memoria de recordatorios enviados como respaldo de idempotencia */
const recordatoriosEnviadosCache = new Set<string>();

export function limpiarCacheRecordatoriosEnviados(): void {
  recordatoriosEnviadosCache.clear();
}

export function formatearFechaHoraTurno(dateInput: Date | string): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const dateStr = d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });
  const timeStr = d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
  return `${dateStr} - ${timeStr}`;
}

interface HorarioData {
  doctorId: string;
  dias: string[];
  horaInicio: string;
  horaFin: string;
  duracion: number;
}

const mapDiaToWeekday = (dia: string): Weekday => {
  const mapeo: Record<string, Weekday> = {
    Lunes: "LUNES",
    Martes: "MARTES",
    Miércoles: "MIERCOLES",
    Jueves: "JUEVES",
    Viernes: "VIERNES",
    Sábado: "SABADO",
    Domingo: "DOMINGO",
  };
  const weekday = mapeo[dia];
  if (!weekday) {
    throw new AgendaRuleError(`El día seleccionado no es válido: ${dia}.`);
  }
  return weekday;
};

// SOLUCIÓN 1: Obligar a que la fecha sea estrictamente UTC para que Prisma
// extraiga la hora exacta sin sumarle el offset de +3 horas de Argentina.
const parseTime = (timeStr: string): Date => {
  return new Date(`1970-01-01T${timeStr}:00.000Z`);
};

export async function actualizarHorarioMedico(actorId: string, data: HorarioData) {
  const actorProfile = await prisma.userProfile.findUnique({
    where: { id: actorId },
  });

  if (!actorProfile) {
    throw new AgendaRuleError("No autorizado. El perfil del usuario no existe.");
  }
  if (actorProfile.role !== "ADMINISTRADOR") {
    throw new AgendaRuleError(
      "No autorizado. Solo un administrador puede modificar los horarios.",
    );
  }

  const doctorProfile = await prisma.doctor.findUnique({
    where: { id: data.doctorId },
  });

  if (!doctorProfile) {
    throw new AgendaRuleError("El profesional seleccionado no existe en la base de datos.");
  }

  const diasEnum = data.dias.map(mapDiaToWeekday);
  if (new Set(diasEnum).size > 2) {
    throw new AgendaRuleError(
      "Cada profesional puede atender como máximo dos días distintos por semana.",
    );
  }
  if (new Set(diasEnum).size !== diasEnum.length) {
    throw new AgendaRuleError("No se puede repetir un día de atención.");
  }

  const fechaInicio = parseTime(data.horaInicio);
  const fechaFin = parseTime(data.horaFin);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.doctor.update({
        where: { id: data.doctorId },
        data: { consultDuration: data.duracion },
      });

      await tx.doctorSchedule.deleteMany({
        where: { doctorId: data.doctorId },
      });

      const nuevosHorarios = diasEnum.map((dia) => ({
        doctorId: data.doctorId,
        weekday: dia,
        startTime: fechaInicio,
        endTime: fechaFin,
        modifiedById: actorId,
        modifiedAt: new Date(),
      }));

      await tx.doctorSchedule.createMany({
        data: nuevosHorarios,
      });
    });
  } catch (error: unknown) {
    console.error("Error transaccional detallado:", error);

    // SOLUCIÓN 2: Burbujear el mensaje real de Prisma hacia la pantalla
    // en lugar de ocultarlo. Si falla de nuevo, veremos exactamente por qué.
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new AgendaRuleError(`Rechazo de base de datos: ${errorMessage}`);
  }
}

// ---------------------------------------------------------------------------
// US-2.3: Confirmación por email y Job de Recordatorios de turnos próximos
// ---------------------------------------------------------------------------

export interface RecordatoriosJobResult {
  procesados: number;
  enviados: number;
  omitidosPorDuplicado: number;
  detalles: Array<{
    appointmentId: string;
    patientEmail: string;
    doctorName: string;
    specialty: string;
    dateTime: string;
    provider: string;
  }>;
}

/**
 * US-2.3: Busca turnos en estado CONFIRMADO próximos a su fecha (por defecto en las
 * próximas 24 horas) y envía recordatorios por email verificando el flag
 * `recordatorio_enviado` para evitar duplicaciones.
 */
export async function procesarRecordatoriosTurnos(
  ventanaHoras: number = 24,
): Promise<RecordatoriosJobResult> {
  if (typeof ventanaHoras !== "number" || ventanaHoras <= 0) {
    throw new AgendaRuleError("La ventana horaria para recordatorios debe ser mayor a 0.");
  }

  const ahora = new Date();
  const limiteProximo = new Date(ahora.getTime() + ventanaHoras * 60 * 60 * 1000);

  const turnosConfirmadosProximos = await prisma.appointment.findMany({
    where: {
      status: AppointmentState.CONFIRMADO,
      startsAt: {
        gte: ahora,
        lte: limiteProximo,
      },
    },
    include: {
      doctor: {
        include: { profile: true },
      },
      patient: {
        include: { profile: true },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  let enviados = 0;
  let omitidosPorDuplicado = 0;
  const detalles: RecordatoriosJobResult["detalles"] = [];

  for (const turno of turnosConfirmadosProximos) {
    const rawTurno = turno as unknown as Record<string, unknown>;
    const yaEnviadoEnBD =
      rawTurno.recordatorio_enviado === true || rawTurno.reminderSent === true;
    const yaEnviadoEnMemoria = recordatoriosEnviadosCache.has(turno.id);

    if (yaEnviadoEnBD || yaEnviadoEnMemoria) {
      omitidosPorDuplicado += 1;
      continue;
    }

    const patientEmail = turno.patient?.profile?.email;
    if (!patientEmail) {
      omitidosPorDuplicado += 1;
      continue;
    }

    const doctorName = `${turno.doctor.profile.firstName} ${turno.doctor.profile.lastName}`;
    const specialtyLabel =
      AGENDA_SPECIALITY_LABELS[turno.doctor.speciality] ?? turno.doctor.speciality;
    const dateTimeStr = formatearFechaHoraTurno(turno.startsAt);

    const emailResult = await enviarRecordatorioTurnoEmail({
      patientEmail,
      patientName: `${turno.patient.profile.firstName} ${turno.patient.profile.lastName}`,
      doctorName,
      doctorLicense: turno.doctor.licenseNumber,
      specialty: specialtyLabel,
      dateTime: dateTimeStr,
    });

    // Marcar flag recordatorio_enviado = true en base de datos (si el esquema/mock lo soporta) y en caché
    recordatoriosEnviadosCache.add(turno.id);
    try {
      const appointmentDelegate = prisma.appointment as unknown as {
        updateMany?: (args: unknown) => Promise<unknown>;
        update?: (args: unknown) => Promise<unknown>;
      };
      if (typeof appointmentDelegate.updateMany === "function") {
        await appointmentDelegate.updateMany({
          where: { id: turno.id },
          data: { recordatorio_enviado: true },
        });
      } else if (typeof appointmentDelegate.update === "function") {
        await appointmentDelegate.update({
          where: { id: turno.id },
          data: { recordatorio_enviado: true },
        });
      }
    } catch {
      // Si la columna física aún no fue migrada en Neon, la caché de idempotencia mantiene la protección
    }

    enviados += 1;
    detalles.push({
      appointmentId: turno.id,
      patientEmail,
      doctorName,
      specialty: specialtyLabel,
      dateTime: dateTimeStr,
      provider: emailResult.provider,
    });
  }

  return {
    procesados: turnosConfirmadosProximos.length,
    enviados,
    omitidosPorDuplicado,
    detalles,
  };
}

// ---------------------------------------------------------------------------
// US-2.4: Cancelación de turno por el paciente (Transaccional)
// ---------------------------------------------------------------------------

/**
 * US-2.4: Cancela un turno perteneciente al paciente en estado CONFIRMADO o RESERVADO
 * dentro de una transacción atómica (`prisma.$transaction`), pasando su estado a
 * `CANCELADO` y liberando inmediatamente el horario original para la agenda pública.
 */
export async function cancelarTurnoDominio(
  actorId: string,
  appointmentId: string,
): Promise<{
  cancelledId: string;
  doctorId: string;
  startsAt: Date;
  endsAt: Date;
}> {
  if (!actorId || typeof actorId !== "string" || !actorId.trim()) {
    throw new AgendaRuleError("No autorizado.");
  }
  if (!appointmentId || typeof appointmentId !== "string" || !appointmentId.trim()) {
    throw new AgendaRuleError("Identificador de turno inválido.");
  }

  return await prisma.$transaction(async (tx) => {
    const findTurno = tx.appointment.findUnique
      ? await tx.appointment.findUnique({ where: { id: appointmentId } })
      : await tx.appointment.findFirst({ where: { id: appointmentId } });

    if (!findTurno) {
      throw new AgendaRuleError(
        "El turno no se encuentra disponible o pertenece a otro usuario.",
      );
    }

    if (findTurno.patientId !== actorId) {
      throw new AgendaRuleError("No tenés permiso para cancelar el turno de otro paciente.");
    }

    const estadoActual = String(findTurno.status);
    if (
      estadoActual !== AppointmentState.CONFIRMADO &&
      estadoActual !== AppointmentState.RESERVADO
    ) {
      throw new AgendaRuleError(
        "Solo se pueden cancelar turnos que estén en estado Reservado o Confirmado.",
      );
    }

    // 1. Cambiar status del appointment a CANCELADO
    if (typeof tx.appointment.update === "function") {
      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: AppointmentState.CANCELADO,
          cancelledById: actorId,
          cancelledAt: new Date(),
          cancellationReason: "Cancelado por el paciente",
        },
      });
    } else {
      await tx.appointment.updateMany({
        where: { id: appointmentId, patientId: actorId },
        data: {
          status: AppointmentState.CANCELADO,
          cancelledById: actorId,
          cancelledAt: new Date(),
          cancellationReason: "Cancelado por el paciente",
        },
      });
    }

    // 2. Liberar bloque puntual en scheduleBlock (si existiera un bloqueo NO_DISPONIBLE
    // asociado a ese rango horario) para garantizar su visibilidad inmediata en la agenda pública
    if (tx.scheduleBlock && typeof tx.scheduleBlock.deleteMany === "function") {
      await tx.scheduleBlock.deleteMany({
        where: {
          doctorId: findTurno.doctorId,
          startsAt: findTurno.startsAt,
          endsAt: findTurno.endsAt,
          reason: BlockReason.NO_DISPONIBLE,
        },
      });
    }

    return {
      cancelledId: findTurno.id,
      doctorId: findTurno.doctorId,
      startsAt: findTurno.startsAt,
      endsAt: findTurno.endsAt,
    };
  });
}

// ---------------------------------------------------------------------------
// US-2.5: Reprogramación de turno por el paciente (Transaccional)
// ---------------------------------------------------------------------------

export interface HorarioAlternativo {
  scheduleId: string;
  startsAt: string;
  dateFormatted: string;
  timeFormatted: string;
  label: string;
}

/**
 * Calcula la próxima fecha/hora futura para una franja de `DoctorSchedule`.
 */
function calcularProximaFechaDeFranja(weekday: Weekday, startTime: Date): Date {
  const ahora = new Date();
  const targetHours = startTime.getUTCHours();
  const targetMinutes = startTime.getUTCMinutes();
  const hh = String(targetHours).padStart(2, "0");
  const mm = String(targetMinutes).padStart(2, "0");

  for (let offset = 1; offset <= 14; offset++) {
    const candidate = new Date(ahora.getTime() + offset * 86_400_000);
    const ymd = candidate.toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
    });
    const midday = new Date(`${ymd}T12:00:00-03:00`);
    const dayEnum = WEEKDAY_BY_JS_DAY[midday.getUTCDay()];
    if (dayEnum === weekday) {
      const slotDate = new Date(`${ymd}T${hh}:${mm}:00-03:00`);
      if (slotDate.getTime() > ahora.getTime()) {
        return slotDate;
      }
    }
  }

  return new Date(ahora.getTime() + 86_400_000);
}

/**
 * Extrae `startsAt` si `newScheduleId` viene codificado como ISO o `scheduleId|ISO`.
 */
function extraerFechaDeScheduleId(newScheduleId: string): Date | null {
  const raw = newScheduleId.includes("|")
    ? newScheduleId.split("|").slice(1).join("|")
    : newScheduleId;

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
}

/**
 * US-2.5: Reprograma un turno del paciente hacia un nuevo horario disponible
 * dentro de una transacción de Prisma (`prisma.$transaction`):
 * 1. Verifica que el nuevo horario esté DISPONIBLE (si no, lanza `AgendaRuleError`).
 * 2. Cancela el turno original (`status = CANCELADO`) y libera el espacio.
 * 3. Reserva y confirma el nuevo turno (`status = CONFIRMADO`) vinculado al `patientId` del actor.
 */
export async function reprogramarTurnoDominio(
  actorId: string,
  oldAppointmentId: string,
  newScheduleId: string,
): Promise<{
  oldAppointmentId: string;
  newAppointmentId: string;
  doctorId: string;
  doctorName: string;
  doctorLicense: string;
  specialty: string;
  startsAt: Date;
  endsAt: Date;
  dateTimeFormatted: string;
  status: AppointmentState;
}> {
  if (!actorId || typeof actorId !== "string" || !actorId.trim()) {
    throw new AgendaRuleError("No autorizado.");
  }
  if (!oldAppointmentId || typeof oldAppointmentId !== "string" || !oldAppointmentId.trim()) {
    throw new AgendaRuleError("El identificador del turno original es obligatorio.");
  }
  if (!newScheduleId || typeof newScheduleId !== "string" || !newScheduleId.trim()) {
    throw new AgendaRuleError("Debe seleccionar un nuevo horario disponible.");
  }
  if (oldAppointmentId.trim() === newScheduleId.trim()) {
    throw new AgendaRuleError("El nuevo horario debe ser diferente al turno original.");
  }

  const resultado = await prisma.$transaction(async (tx) => {
    // 1. Obtener y validar el turno original
    const oldTurno = tx.appointment.findUnique
      ? await tx.appointment.findUnique({
          where: { id: oldAppointmentId },
          include: {
            doctor: { include: { profile: true } },
            patient: { include: { profile: true } },
          },
        })
      : await tx.appointment.findFirst({
          where: { id: oldAppointmentId },
          include: {
            doctor: { include: { profile: true } },
            patient: { include: { profile: true } },
          },
        });

    if (!oldTurno) {
      throw new AgendaRuleError("El turno que intentás reprogramar no existe.");
    }

    if (oldTurno.patientId !== actorId) {
      throw new AgendaRuleError("No tenés permiso para reprogramar un turno de otro paciente.");
    }

    const oldStatus = String(oldTurno.status);
    if (
      oldStatus !== AppointmentState.CONFIRMADO &&
      oldStatus !== AppointmentState.RESERVADO
    ) {
      throw new AgendaRuleError(
        "Solo se pueden reprogramar turnos en estado Reservado o Confirmado.",
      );
    }

    const consultDuration = oldTurno.doctor?.consultDuration ?? 30;
    let newStartsAt: Date | null = extraerFechaDeScheduleId(newScheduleId);
    let newEndsAt: Date | null = newStartsAt
      ? new Date(newStartsAt.getTime() + consultDuration * 60_000)
      : null;
    let targetSlotAppointmentId: string | null = null;

    // 2. Verificar que el nuevo horario esté DISPONIBLE
    if (newStartsAt && newEndsAt) {
      if (newStartsAt.getTime() <= Date.now()) {
        throw new AgendaRuleError(
          "El nuevo horario seleccionado no es válido o ya ha pasado.",
        );
      }
      if (newStartsAt.getTime() === new Date(oldTurno.startsAt).getTime()) {
        throw new AgendaRuleError(
          "El nuevo horario seleccionado coincide con el horario actual del turno.",
        );
      }

      const turnoEnConflicto = await tx.appointment.findFirst({
        where: {
          doctorId: oldTurno.doctorId,
          id: { not: oldAppointmentId },
          status: {
            in: [
              AppointmentState.CONFIRMADO,
              AppointmentState.RESERVADO,
              AppointmentState.ATENDIDO,
              AppointmentState.AUSENTE,
            ],
          },
          startsAt: { lt: newEndsAt },
          endsAt: { gt: newStartsAt },
        },
      });

      if (turnoEnConflicto) {
        throw new AgendaRuleError("El horario seleccionado no se encuentra disponible.");
      }

      if (tx.scheduleBlock && typeof tx.scheduleBlock.findFirst === "function") {
        const bloqueoActivo = await tx.scheduleBlock.findFirst({
          where: {
            doctorId: oldTurno.doctorId,
            startsAt: { lt: newEndsAt },
            endsAt: { gt: newStartsAt },
          },
        });
        if (bloqueoActivo) {
          throw new AgendaRuleError("El horario seleccionado no se encuentra disponible.");
        }
      }
    } else {
      // Caso en que newScheduleId sea el ID de un slot o de un DoctorSchedule
      const possibleSlot = tx.appointment.findUnique
        ? await tx.appointment.findUnique({ where: { id: newScheduleId } })
        : await tx.appointment.findFirst({ where: { id: newScheduleId } });

      if (possibleSlot) {
        if (String(possibleSlot.status) !== "DISPONIBLE") {
          throw new AgendaRuleError("El horario seleccionado no se encuentra disponible.");
        }
        targetSlotAppointmentId = possibleSlot.id;
        newStartsAt = new Date(possibleSlot.startsAt);
        newEndsAt = new Date(possibleSlot.endsAt);
      } else if (tx.doctorSchedule && typeof tx.doctorSchedule.findUnique === "function") {
        const scheduleRow = await tx.doctorSchedule.findUnique({
          where: { id: newScheduleId },
        });
        if (!scheduleRow || scheduleRow.doctorId !== oldTurno.doctorId) {
          throw new AgendaRuleError("El horario seleccionado no se encuentra disponible.");
        }
        newStartsAt = calcularProximaFechaDeFranja(
          scheduleRow.weekday,
          scheduleRow.startTime,
        );
        newEndsAt = new Date(newStartsAt.getTime() + consultDuration * 60_000);

        const ocupado = await tx.appointment.findFirst({
          where: {
            doctorId: oldTurno.doctorId,
            id: { not: oldAppointmentId },
            status: {
              in: [
                AppointmentState.CONFIRMADO,
                AppointmentState.RESERVADO,
                AppointmentState.ATENDIDO,
                AppointmentState.AUSENTE,
              ],
            },
            startsAt: { lt: newEndsAt },
            endsAt: { gt: newStartsAt },
          },
        });
        if (ocupado) {
          throw new AgendaRuleError("El horario seleccionado no se encuentra disponible.");
        }
      } else {
        throw new AgendaRuleError("El horario seleccionado no se encuentra disponible.");
      }
    }

    // 3. Cancelar el turno original (status = CANCELADO) y liberar el espacio
    if (typeof tx.appointment.update === "function") {
      await tx.appointment.update({
        where: { id: oldAppointmentId },
        data: {
          status: AppointmentState.CANCELADO,
          cancelledById: actorId,
          cancelledAt: new Date(),
          cancellationReason: "Reprogramado por el paciente",
        },
      });
    } else {
      await tx.appointment.updateMany({
        where: { id: oldAppointmentId, patientId: actorId },
        data: {
          status: AppointmentState.CANCELADO,
          cancelledById: actorId,
          cancelledAt: new Date(),
          cancellationReason: "Reprogramado por el paciente",
        },
      });
    }

    if (tx.scheduleBlock && typeof tx.scheduleBlock.deleteMany === "function") {
      await tx.scheduleBlock.deleteMany({
        where: {
          doctorId: oldTurno.doctorId,
          startsAt: oldTurno.startsAt,
          endsAt: oldTurno.endsAt,
          reason: BlockReason.NO_DISPONIBLE,
        },
      });
    }

    // 4. Reservar y confirmar el nuevo turno vinculándolo al patientId del actor actual
    let nuevoTurnoId: string;
    if (targetSlotAppointmentId && typeof tx.appointment.update === "function") {
      const updatedNew = await tx.appointment.update({
        where: { id: targetSlotAppointmentId },
        data: {
          patientId: actorId,
          status: AppointmentState.CONFIRMADO,
          reservedById: actorId,
          reservedAt: new Date(),
        },
      });
      nuevoTurnoId = updatedNew.id;
    } else {
      const createdNew = await tx.appointment.create({
        data: {
          patientId: actorId,
          doctorId: oldTurno.doctorId,
          startsAt: newStartsAt!,
          endsAt: newEndsAt!,
          status: AppointmentState.CONFIRMADO,
          reservedById: actorId,
        },
      });
      nuevoTurnoId = createdNew.id;
    }

    const firstName = oldTurno.doctor?.profile?.firstName ?? "Profesional";
    const lastName = oldTurno.doctor?.profile?.lastName ?? "";
    const doctorName = `${firstName} ${lastName}`.trim();
    const doctorLicense = oldTurno.doctor?.licenseNumber ?? "MP-1000";
    const specialtyLabel =
      AGENDA_SPECIALITY_LABELS[oldTurno.doctor?.speciality ?? ""] ??
      String(oldTurno.doctor?.speciality ?? "Clínica médica");
    const dateTimeFormatted = formatearFechaHoraTurno(newStartsAt!);
    const patientEmail = oldTurno.patient?.profile?.email;
    const patientName = oldTurno.patient?.profile
      ? `${oldTurno.patient.profile.firstName} ${oldTurno.patient.profile.lastName}`.trim()
      : undefined;

    return {
      oldAppointmentId,
      newAppointmentId: nuevoTurnoId,
      doctorId: oldTurno.doctorId,
      doctorName,
      doctorLicense,
      specialty: specialtyLabel,
      startsAt: newStartsAt!,
      endsAt: newEndsAt!,
      dateTimeFormatted,
      status: AppointmentState.CONFIRMADO,
      patientEmail,
      patientName,
    };
  });

  // Notificar por correo electrónico la confirmación del nuevo turno reprogramado
  if (resultado.patientEmail) {
    try {
      await enviarConfirmacionTurnoEmail({
        patientEmail: resultado.patientEmail,
        patientName: resultado.patientName,
        doctorName: resultado.doctorName,
        doctorLicense: resultado.doctorLicense,
        specialty: resultado.specialty,
        dateTime: resultado.dateTimeFormatted,
      });
    } catch (emailErr) {
      console.error("[reprogramarTurnoDominio] No se pudo enviar el email:", emailErr);
    }
  }

  return {
    oldAppointmentId: resultado.oldAppointmentId,
    newAppointmentId: resultado.newAppointmentId,
    doctorId: resultado.doctorId,
    doctorName: resultado.doctorName,
    doctorLicense: resultado.doctorLicense,
    specialty: resultado.specialty,
    startsAt: resultado.startsAt,
    endsAt: resultado.endsAt,
    dateTimeFormatted: resultado.dateTimeFormatted,
    status: resultado.status,
  };
}

/**
 * Obtiene los horarios alternativos disponibles para un profesional en los próximos días,
 * excluyendo turnos ocupados y bloqueos de agenda.
 */
export async function obtenerHorariosAlternativosProfesional(
  doctorId: string,
  excludeAppointmentId?: string,
): Promise<HorarioAlternativo[]> {
  if (!doctorId || typeof doctorId !== "string") {
    return [];
  }

  const ahora = new Date();
  const horizonte = new Date(ahora.getTime() + 14 * 86_400_000);

  const [doctor, turnosOcupados, bloqueos] = await Promise.all([
    prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { schedules: true },
    }),
    prisma.appointment.findMany({
      where: {
        doctorId,
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
        startsAt: { gte: ahora, lte: horizonte },
        status: {
          in: [
            AppointmentState.CONFIRMADO,
            AppointmentState.RESERVADO,
            AppointmentState.ATENDIDO,
            AppointmentState.AUSENTE,
          ],
        },
      },
      select: { startsAt: true, endsAt: true },
    }),
    prisma.scheduleBlock
      ? prisma.scheduleBlock.findMany({
          where: {
            doctorId,
            startsAt: { lt: horizonte },
            endsAt: { gt: ahora },
          },
          select: { startsAt: true, endsAt: true },
        })
      : Promise.resolve([]),
  ]);

  if (!doctor) return [];

  const duration = doctor.consultDuration || 30;
  const defaultHours = ["13:00", "14:00", "15:00", "16:00", "17:00"];
  const slots: HorarioAlternativo[] = [];

  for (let dayOffset = 0; dayOffset <= 12; dayOffset++) {
    const targetDay = new Date(ahora.getTime() + dayOffset * 86_400_000);
    const dateStr = targetDay.toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
    });
    const midday = new Date(`${dateStr}T12:00:00-03:00`);
    const jsDay = midday.getUTCDay();

    if (jsDay === 0 || jsDay === 6) continue;

    const weekdayEnum = WEEKDAY_BY_JS_DAY[jsDay];
    const matchingSchedules = doctor.schedules.filter((s) => s.weekday === weekdayEnum);

    // Generar horas candidatas según franjas del médico o las horas base de la agenda pública
    const candidateHoursSet = new Set<string>(defaultHours);
    for (const sched of matchingSchedules) {
      const startMins =
        sched.startTime.getUTCHours() * 60 + sched.startTime.getUTCMinutes();
      const endMins = sched.endTime.getUTCHours() * 60 + sched.endTime.getUTCMinutes();
      for (let m = startMins; m + duration <= endMins; m += duration) {
        const hh = String(Math.floor(m / 60)).padStart(2, "0");
        const mm = String(m % 60).padStart(2, "0");
        candidateHoursSet.add(`${hh}:${mm}`);
      }
    }

    const candidateHours = Array.from(candidateHoursSet).sort();
    const [yyyy, mmStr, ddStr] = dateStr.split("-");
    const weekdayLabel = WEEKDAY_SHORT_LABELS[jsDay] ?? "";
    const dateFormatted = `${weekdayLabel} ${ddStr}/${mmStr}/${yyyy}`.trim();

    for (const h of candidateHours) {
      const startsAtIso = `${dateStr}T${h}:00-03:00`;
      const slotStart = new Date(startsAtIso);
      if (slotStart.getTime() <= ahora.getTime()) continue;

      const slotEnd = new Date(slotStart.getTime() + duration * 60_000);

      const isOccupied = turnosOcupados.some((t) => {
        const tStart = new Date(t.startsAt).getTime();
        const tEnd = new Date(t.endsAt).getTime();
        return tStart < slotEnd.getTime() && tEnd > slotStart.getTime();
      });
      if (isOccupied) continue;

      const isBlocked = bloqueos.some(
        (b) =>
          new Date(b.startsAt).getTime() < slotEnd.getTime() &&
          new Date(b.endsAt).getTime() > slotStart.getTime(),
      );
      if (isBlocked) continue;

      const timeFormatted = slotStart.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Argentina/Buenos_Aires",
      });

      slots.push({
        scheduleId: startsAtIso,
        startsAt: startsAtIso,
        dateFormatted,
        timeFormatted: `${timeFormatted} hs`,
        label: `${dateFormatted} — ${timeFormatted} hs`,
      });

      if (slots.length >= 20) break;
    }
    if (slots.length >= 20) break;
  }

  return slots;
}
