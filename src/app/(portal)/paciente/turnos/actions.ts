'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getCurrentActor } from '@/lib/dev-actor';
import { AppointmentState } from '@/generated/prisma/client';
import { eliminarTurnosVencidos } from '@/lib/turnos';
import {
  AgendaRuleError,
  AGENDA_SPECIALTY_LABELS,
  cancelarTurnoDominio,
  formatearFechaHoraTurno,
  obtenerHorariosAlternativosProfesional,
  reprogramarTurnoDominio,
  type HorarioAlternativo,
} from '@/lib/agenda';
import { enviarConfirmacionTurnoEmail } from '@/lib/email';

const SPECIALTY_LABELS: Record<string, string> = AGENDA_SPECIALTY_LABELS;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getSafeCookieStore() {
  try {
    const { cookies } = await import('next/headers');
    return await cookies();
  } catch {
    return null;
  }
}

export async function confirmarTurno(input: FormData | string) {
  const actor = await getCurrentActor();
  if (!actor) throw new Error('No autorizado.');

  const appointmentId =
    typeof input === 'string'
      ? input.trim()
      : ((input.get('appointmentId') as string | null)?.trim() ?? '');

  if (!appointmentId) throw new Error('Identificador de turno inválido.');

  // Obtener perfil del paciente
  const paciente = await prisma.patient.findUnique({
    where: { id: actor.id },
  });

  if (!paciente) {
    throw new Error('Solo los pacientes pueden confirmar reservas.');
  }

  // Si el turno está en la cookie de recientes, actualizar su estado y recuperar metadatos
  const cookieStore = await getSafeCookieStore();
  let updatedInCookie = false;
  type CookieTurnoMeta = {
    doctorName?: string;
    doctorLicense?: string;
    specialty?: string;
    dateTime?: string;
  };
  let cookieTurnoMeta: CookieTurnoMeta | null = null;

  if (cookieStore) {
    try {
      const recentCookie = cookieStore.get('sigmed_recent_turnos')?.value;
      if (recentCookie) {
        let list = JSON.parse(recentCookie);
        for (const item of list) {
          if (item.id === appointmentId) {
            updatedInCookie = true;
            cookieTurnoMeta = {
              doctorName: item.doctorName,
              doctorLicense: item.doctorLicense,
              specialty: item.specialty,
              dateTime: item.dateTime,
            };
          }
        }
        if (updatedInCookie) {
          list = list.map((item: any) =>
            item.id === appointmentId
              ? { ...item, status: AppointmentState.CONFIRMADO }
              : item,
          );
          cookieStore.set('sigmed_recent_turnos', JSON.stringify(list), {
            path: '/',
            maxAge: 86400 * 7,
          });
        }
      }
    } catch {}
  }

  // Solo invocar la base de datos si appointmentId es un UUID válido de PostgreSQL
  if (UUID_REGEX.test(appointmentId)) {
    const updated = await prisma.appointment.updateMany({
      where: {
        id: appointmentId,
        patientId: paciente.id,
        status: AppointmentState.RESERVADO,
      },
      data: {
        status: AppointmentState.CONFIRMADO,
      },
    });

    if (updated.count === 0 && !updatedInCookie) {
      throw new Error('El turno no se encuentra disponible o pertenece a otro usuario.');
    }
  }

  // US-2.3: Disparar correo electrónico de confirmación con Profesional, Especialidad, Fecha y Hora
  try {
    let doctorName = cookieTurnoMeta?.doctorName ?? 'Profesional SigMed';
    let doctorLicense = cookieTurnoMeta?.doctorLicense;
    let specialty = cookieTurnoMeta?.specialty ?? 'Clínica médica';
    let dateTime = cookieTurnoMeta?.dateTime ?? '';
    let patientEmail = (actor as { email?: string }).email ?? 'paciente@sigmed.local';
    let patientName =
      actor.firstName || actor.lastName
        ? `${actor.firstName ?? ''} ${actor.lastName ?? ''}`.trim()
        : undefined;

    if (UUID_REGEX.test(appointmentId) && typeof prisma.appointment.findFirst === 'function') {
      const turnoDB = await prisma.appointment.findFirst({
        where: { id: appointmentId, patientId: paciente.id },
        include: {
          doctor: { include: { profile: true } },
          patient: { include: { profile: true } },
        },
      });

      if (turnoDB?.doctor?.profile) {
        doctorName = `${turnoDB.doctor.profile.firstName} ${turnoDB.doctor.profile.lastName}`.trim();
        doctorLicense = turnoDB.doctor.licenseNumber;
        specialty = SPECIALTY_LABELS[turnoDB.doctor.specialty] ?? turnoDB.doctor.specialty;
      }
      if (turnoDB?.startsAt) {
        dateTime = formatearFechaHoraTurno(turnoDB.startsAt);
      }
      if (turnoDB?.patient?.profile?.email) {
        patientEmail = turnoDB.patient.profile.email;
        patientName = `${turnoDB.patient.profile.firstName} ${turnoDB.patient.profile.lastName}`.trim();
      }
    }

    await enviarConfirmacionTurnoEmail({
      patientEmail,
      patientName,
      doctorName,
      doctorLicense,
      specialty,
      dateTime: dateTime || 'Horario confirmado',
    });
  } catch (emailError) {
    console.error('[confirmarTurno] Error al enviar email de confirmación:', emailError);
  }

  revalidatePath('/paciente/turnos');
  revalidatePath('/paciente/mis-turnos');
  return { success: true };
}

/**
 * US-2.4: Acción para cancelar un turno por parte del paciente (CONFIRMADO o RESERVADO).
 * Cambia el estado del turno a CANCELADO y libera inmediatamente el horario original
 * mediante `prisma.$transaction`.
 */
export async function cancelarTurno(input: string | FormData) {
  const actor = await getCurrentActor();
  if (!actor) throw new AgendaRuleError('No autorizado.');

  const appointmentId =
    typeof input === 'string'
      ? input.trim()
      : ((input.get('appointmentId') as string | null)?.trim() ?? '');

  if (!appointmentId) {
    throw new AgendaRuleError('Identificador de turno inválido.');
  }

  const paciente = await prisma.patient.findUnique({
    where: { id: actor.id },
  });

  if (!paciente) {
    throw new AgendaRuleError('Solo los pacientes pueden cancelar sus turnos.');
  }

  // Si el turno estaba en la cookie de recientes, removerlo
  const cookieStore = await getSafeCookieStore();
  let removedFromCookie = false;
  if (cookieStore) {
    try {
      const recentCookie = cookieStore.get('sigmed_recent_turnos')?.value;
      if (recentCookie) {
        let list = JSON.parse(recentCookie);
        const prevLength = list.length;
        list = list.filter((item: any) => item.id !== appointmentId);
        if (list.length < prevLength) {
          removedFromCookie = true;
          cookieStore.set('sigmed_recent_turnos', JSON.stringify(list), {
            path: '/',
            maxAge: 86400 * 7,
          });
        }
      }
    } catch {}
  }

  if (UUID_REGEX.test(appointmentId)) {
    await cancelarTurnoDominio(paciente.id, appointmentId);
  } else if (!removedFromCookie) {
    throw new AgendaRuleError('El turno no se encuentra disponible o pertenece a otro usuario.');
  }

  revalidatePath('/paciente/turnos');
  revalidatePath('/paciente/mis-turnos');
  return { success: true };
}

/**
 * US-2.5: Reprograma un turno existente hacia un nuevo horario disponible para el profesional.
 * Ejecuta `prisma.$transaction` verificando disponibilidad, cancelando el turno original
 * y reservando/confirmando el nuevo turno para el paciente actual.
 */
export async function reprogramarTurno(
  oldInput: string | FormData,
  newScheduleIdArg?: string,
) {
  const actor = await getCurrentActor();
  if (!actor) throw new AgendaRuleError('No autorizado.');

  const oldAppointmentId =
    typeof oldInput === 'string'
      ? oldInput.trim()
      : ((oldInput.get('oldAppointmentId') as string | null)?.trim() ?? '');

  const newScheduleId =
    typeof oldInput === 'string'
      ? (newScheduleIdArg?.trim() ?? '')
      : ((oldInput.get('newScheduleId') as string | null)?.trim() ?? '');

  if (!oldAppointmentId) {
    throw new AgendaRuleError('El identificador del turno original es obligatorio.');
  }
  if (!newScheduleId) {
    throw new AgendaRuleError('Debe seleccionar un nuevo horario disponible.');
  }

  const paciente = await prisma.patient.findUnique({
    where: { id: actor.id },
  });

  if (!paciente) {
    throw new AgendaRuleError('Solo los pacientes pueden reprogramar sus turnos.');
  }

  const resultado = await reprogramarTurnoDominio(
    paciente.id,
    oldAppointmentId,
    newScheduleId,
  );

  // Actualizar la cookie de turnos recientes reemplazando el turno anterior por el nuevo confirmado
  const cookieStore = await getSafeCookieStore();
  if (cookieStore) {
    try {
      const recentCookie = cookieStore.get('sigmed_recent_turnos')?.value;
      let list: any[] = recentCookie ? JSON.parse(recentCookie) : [];
      list = list.filter((item: any) => item.id !== oldAppointmentId);
      list.unshift({
        id: resultado.newAppointmentId,
        doctorId: resultado.doctorId,
        doctorName: resultado.doctorName,
        doctorLicense: resultado.doctorLicense,
        specialty: resultado.specialty,
        dateTime: resultado.dateTimeFormatted,
        startsAtISO: resultado.startsAt.toISOString(),
        status: AppointmentState.CONFIRMADO,
      });
      cookieStore.set('sigmed_recent_turnos', JSON.stringify(list), {
        path: '/',
        maxAge: 86400 * 7,
      });
    } catch {}
  }

  revalidatePath('/paciente/turnos');
  revalidatePath('/paciente/mis-turnos');

  return {
    success: true,
    oldAppointmentId: resultado.oldAppointmentId,
    newAppointment: {
      id: resultado.newAppointmentId,
      doctorId: resultado.doctorId,
      doctorName: resultado.doctorName,
      doctorLicense: resultado.doctorLicense,
      specialty: resultado.specialty,
      dateTime: resultado.dateTimeFormatted,
      startsAtISO: resultado.startsAt.toISOString(),
      status: resultado.status,
    },
  };
}

/**
 * Obtiene los horarios alternativos disponibles de un profesional para la vista de reprogramación.
 */
export async function obtenerHorariosAlternativosAction(
  doctorId: string,
  excludeAppointmentId?: string,
): Promise<HorarioAlternativo[]> {
  const actor = await getCurrentActor();
  if (!actor) throw new AgendaRuleError('No autorizado.');

  if (!doctorId || typeof doctorId !== 'string') {
    throw new AgendaRuleError('Identificador de profesional inválido.');
  }

  return obtenerHorariosAlternativosProfesional(doctorId, excludeAppointmentId);
}

export async function cancelarTurnoPaciente(formData: FormData) {
  const actor = await getCurrentActor();
  if (!actor) throw new Error('No autorizado.');

  const appointmentId = formData.get('appointmentId') as string;
  if (!appointmentId) throw new Error('Identificador de turno inválido.');

  const paciente = await prisma.patient.findUnique({
    where: { id: actor.id },
  });

  if (!paciente) {
    throw new Error('Solo los pacientes pueden cancelar sus turnos.');
  }

  // Si el turno está en la cookie de recientes, eliminarlo
  const cookieStore = await getSafeCookieStore();
  let removedFromCookie = false;
  if (cookieStore) {
    try {
      const recentCookie = cookieStore.get('sigmed_recent_turnos')?.value;
      if (recentCookie) {
        let list = JSON.parse(recentCookie);
        const prevLength = list.length;
        list = list.filter((item: any) => item.id !== appointmentId);
        if (list.length < prevLength) {
          removedFromCookie = true;
          cookieStore.set('sigmed_recent_turnos', JSON.stringify(list), {
            path: '/',
            maxAge: 86400 * 7,
          });
        }
      }
    } catch {}
  }

  // Eliminar el turno físicamente de la base de datos (dar de baja)
  if (UUID_REGEX.test(appointmentId)) {
    const deleted = await prisma.appointment.deleteMany({
      where: {
        id: appointmentId,
        patientId: paciente.id,
      },
    });

    if (deleted.count === 0 && !removedFromCookie) {
      throw new Error('El turno no se encuentra disponible o pertenece a otro usuario.');
    }
  }

  revalidatePath('/paciente/turnos');
  revalidatePath('/paciente/mis-turnos');
  return { success: true };
}

export async function reservarTurno(formData: FormData) {
  const actor = await getCurrentActor();
  if (!actor) throw new Error('No autorizado.');

  const doctorId = formData.get('doctorId') as string | null;
  const startsAtStr = formData.get('startsAt') as string | null;

  if (!doctorId || !startsAtStr) {
    throw new Error('Información de turno incompleta.');
  }

  const paciente = await prisma.patient.findUnique({
    where: { id: actor.id },
  });
  if (!paciente) {
    throw new Error('Solo los pacientes pueden reservar turnos.');
  }

  // Eliminar turnos vencidos antes de operar
  await eliminarTurnosVencidos();

  const startsAt = new Date(startsAtStr);
  if (Number.isNaN(startsAt.getTime())) {
    throw new Error('Fecha u hora inválida.');
  }

  // RF: Turnos previos a la fecha actual no se pueden seleccionar
  if (startsAt.getTime() <= Date.now()) {
    throw new Error('No se pueden seleccionar turnos previos a la fecha y hora actual.');
  }

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: { profile: true },
  });
  if (!doctor) {
    throw new Error('El profesional seleccionado no existe.');
  }

  const duration = doctor?.consultDuration ?? 30;
  const endsAt = new Date(startsAt.getTime() + duration * 60_000);

  // RF: Una vez que se selecciona un turno, este no puede volver a seleccionarse
  const occupied = await prisma.appointment.findFirst({
    where: {
      doctorId,
      startsAt,
      status: {
        in: [
          AppointmentState.CONFIRMADO,
          AppointmentState.RESERVADO,
          AppointmentState.ATENDIDO,
          AppointmentState.AUSENTE,
        ],
      },
    },
  });
  if (occupied) {
    throw new Error('El turno seleccionado ya fue reservado por otro usuario.');
  }

  const created = await prisma.appointment.create({
    data: {
      patientId: paciente.id,
      doctorId,
      startsAt,
      endsAt,
      status: AppointmentState.RESERVADO,
      reservedById: actor.id,
    },
  });

  const datePart = startsAtStr.slice(0, 10);
  const [y, m, d] = datePart.split('-');
  const timePart = startsAtStr.slice(11, 16);
  const formattedDateTime = `${d}/${m}/${y} - ${timePart}`;
  const docName = `${doctor.profile.firstName} ${doctor.profile.lastName}`;
  const specName = SPECIALTY_LABELS[doctor.specialty] ?? doctor.specialty;
  const docLicense = doctor.licenseNumber || 'MP-54210';

  // Guardar en la sesión/cookie para que aparezca reflejado inmediatamente en "Mis turnos"
  const cookieStore = await getSafeCookieStore();
  if (cookieStore) {
    try {
      const existingCookie = cookieStore.get('sigmed_recent_turnos')?.value;
      let recentList: any[] = [];
      if (existingCookie) recentList = JSON.parse(existingCookie);
      const newEntry = {
        id: created.id,
        doctorId,
        doctorName: docName,
        doctorLicense: docLicense,
        specialty: specName,
        dateTime: formattedDateTime,
        startsAtISO: startsAt.toISOString(),
        status: AppointmentState.RESERVADO,
      };
      recentList = [newEntry, ...recentList.filter((item) => item.id !== created.id)];
      cookieStore.set('sigmed_recent_turnos', JSON.stringify(recentList), {
        path: '/',
        maxAge: 86400 * 7,
      });
    } catch {}
  }

  revalidatePath('/paciente/turnos');
  revalidatePath('/paciente/mis-turnos');
  return { success: true, appointmentId: created.id };
}
