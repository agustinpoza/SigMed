"use server";
import { revalidatePath } from "next/cache";
import { AppointmentState, BlockReason, UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { getActorContext } from "@/lib/actor";

const NO_ACTOR = "No hay actor definido. Selecciona uno en la barra superior.";
const NO_MEDICO = "Solo un médico puede modificar su agenda.";
const CLINIC_OFFSET_MS = -3 * 60 * 60 * 1000;

const MOTIVOS_PERMITIDOS = [
  BlockReason.FERIADO,
  BlockReason.LICENCIA,
  BlockReason.IMPREVISTO,
] as const;

type MotivoBloqueo = (typeof MOTIVOS_PERMITIDOS)[number];
type BloqueoExistente = { startsAt: Date; endsAt: Date };

function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function clinicDateKey(date: Date): string {
  return new Date(date.getTime() + CLINIC_OFFSET_MS).toISOString().slice(0, 10);
}

function clinicDayStart(date: string): Date {
  return new Date(`${date}T00:00:00-03:00`);
}

function nextDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

function blockedDays(blocks: BloqueoExistente[]): string[] {
  const days = new Set<string>();

  for (const block of blocks) {
    const lastIncluded = clinicDateKey(new Date(block.endsAt.getTime() - 1));
    for (let date = clinicDateKey(block.startsAt); date <= lastIncluded; date = nextDate(date)) {
      days.add(date);
    }
  }

  return [...days].sort();
}

function isMotivoBloqueo(value: unknown): value is MotivoBloqueo {
  return MOTIVOS_PERMITIDOS.some((motivo) => motivo === value);
}

export async function obtenerDiasBloqueados(): Promise<{
  dias: string[];
  message?: string;
}> {
  const context = await getActorContext();
  if (!context) return { dias: [], message: NO_ACTOR };
  if (context.effective.role !== UserRole.MEDICO) {
    return { dias: [], message: NO_MEDICO };
  }

  try {
    const hoy = clinicDateKey(new Date());
    const blocks = await prisma.scheduleBlock.findMany({
      where: {
        doctorId: context.effective.id,
        endsAt: { gt: clinicDayStart(hoy) },
      },
      select: { startsAt: true, endsAt: true },
    });

    return { dias: blockedDays(blocks) };
  } catch (error: unknown) {
    console.error("Error al consultar los bloqueos de agenda:", error);
    return {
      dias: [],
      message: "No se pudieron consultar los días bloqueados.",
    };
  }
}

export async function guardarBloqueosAgenda(input: unknown): Promise<{
  status: "success" | "error";
  message: string;
}> {
  const context = await getActorContext();
  if (!context) return { status: "error", message: NO_ACTOR };
  if (context.effective.role !== UserRole.MEDICO) {
    return { status: "error", message: NO_MEDICO };
  }

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { status: "error", message: "Los datos del bloqueo no son válidos." };
  }

  const data = input as Record<string, unknown>;
  if (
    !Array.isArray(data.dias) ||
    !data.dias.every((day): day is string => typeof day === "string") ||
    !isMotivoBloqueo(data.motivo) ||
    (data.descripcion !== undefined && typeof data.descripcion !== "string")
  ) {
    return { status: "error", message: "Los datos del bloqueo no son válidos." };
  }

  if (data.dias.length === 0) {
    return { status: "error", message: "Selecciona al menos un día para bloquear." };
  }
  if (!data.dias.every(isDateOnly) || new Set(data.dias).size !== data.dias.length) {
    return { status: "error", message: "Las fechas seleccionadas no son válidas o están repetidas." };
  }

  const descripcion = (data.descripcion as string | undefined)?.trim() ?? "";
  if (descripcion.length > 200) {
    return { status: "error", message: "El detalle no puede superar los 200 caracteres." };
  }

  const hoy = clinicDateKey(new Date());
  if (data.dias.some((day) => day < hoy)) {
    return { status: "error", message: "No se pueden bloquear fechas pasadas." };
  }

  try {
    const medico = await prisma.doctor.findUnique({
      where: { id: context.effective.id },
      select: { id: true },
    });
    if (!medico) {
      return { status: "error", message: "No se encontró el perfil médico." };
    }

    const diasOrdenados = [...data.dias].sort();
    const resultado = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id_usuario" FROM "medico" WHERE "id_usuario" = ${medico.id}::uuid FOR UPDATE`;

      const inicio = clinicDayStart(diasOrdenados[0]);
      const fin = clinicDayStart(nextDate(diasOrdenados[diasOrdenados.length - 1]));
      const existing = await tx.scheduleBlock.findMany({
        where: {
          doctorId: medico.id,
          startsAt: { lt: fin },
          endsAt: { gt: inicio },
        },
        select: { startsAt: true, endsAt: true },
      });

      const diasNuevos = diasOrdenados.filter((day) => {
        const dayStart = clinicDayStart(day);
        const dayEnd = clinicDayStart(nextDate(day));
        return !existing.some(
          (block) => block.startsAt < dayEnd && block.endsAt > dayStart,
        );
      });

      if (diasNuevos.length === 0) return null;

      const rangosBloqueados = diasNuevos.map((day) => ({
        startsAt: { lt: clinicDayStart(nextDate(day)) },
        endsAt: { gt: clinicDayStart(day) },
      }));
      const motivoLabel: Record<MotivoBloqueo, string> = {
        [BlockReason.FERIADO]: "feriado",
        [BlockReason.LICENCIA]: "licencia",
        [BlockReason.IMPREVISTO]: "imprevisto",
      };
      const motivoCancelacion =
        `Agenda suspendida por ${motivoLabel[data.motivo as MotivoBloqueo]}` +
        (descripcion ? `: ${descripcion}` : ".");

      await tx.scheduleBlock.createMany({
        data: diasNuevos.map((day) => ({
          doctorId: medico.id,
          startsAt: clinicDayStart(day),
          endsAt: clinicDayStart(nextDate(day)),
          reason: data.motivo as MotivoBloqueo,
          description: descripcion || null,
          registeredById: context.real.id,
        })),
      });

      const turnosCancelados = await tx.appointment.updateMany({
        where: {
          doctorId: medico.id,
          status: { in: [AppointmentState.RESERVADO, AppointmentState.CONFIRMADO] },
          OR: rangosBloqueados,
        },
        data: {
          status: AppointmentState.CANCELADO,
          cancelledById: context.real.id,
          cancellationReason: motivoCancelacion,
          cancelledAt: new Date(),
        },
      });

      return { diasNuevos, turnosCancelados: turnosCancelados.count };
    });

    if (!resultado) {
      return { status: "error", message: "Todos los días seleccionados ya están bloqueados." };
    }

    revalidatePath("/medico/disponibilidad");
    revalidatePath("/medico/agenda");
    revalidatePath("/paciente/turnos");
    revalidatePath("/paciente/mis-turnos");

    const alreadyBlocked = diasOrdenados.length - resultado.diasNuevos.length;
    const resultMessage = `Se bloquearon ${resultado.diasNuevos.length} ${resultado.diasNuevos.length === 1 ? "día" : "días"}.`;
    const cancellationMessage = resultado.turnosCancelados
      ? ` Se cancelaron ${resultado.turnosCancelados} ${resultado.turnosCancelados === 1 ? "turno" : "turnos"} previamente registrados.`
      : "";
    return {
      status: "success",
      message: alreadyBlocked
        ? `${resultMessage} ${alreadyBlocked} ya estaba${alreadyBlocked === 1 ? "" : "n"} bloqueado${alreadyBlocked === 1 ? "" : "s"}.${cancellationMessage}`
        : `${resultMessage}${cancellationMessage}`,
    };
  } catch (error: unknown) {
    console.error("Error al guardar los bloqueos de agenda:", error);
    return { status: "error", message: "No se pudieron guardar los bloqueos de agenda." };
  }
}
