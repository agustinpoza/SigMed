'use server';
import { revalidatePath } from "next/cache";
import { Weekday } from "@/generated/prisma/client";
import { AuditAction, AuditEntity, UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { FieldErrors } from "@/lib/forms";
import { getActorContext, getCurrentActor } from "@/lib/actor";
import { buildExerciseAudit, insertAudit } from "@/lib/audit";

export type DisponibilidadState = {
  status: "success" | "error";
  errors?: FieldErrors;
  message?: string;
  values?: Record<string, string>;
};

export type DisponibilidadGuardada = {
  weekday: Weekday;
  horaInicio: string;
  horaFin: string;
  duracion: number;
};

const NO_ACTOR = "No hay actor definido, asi que no se puede consultar la disponibilidad. Selecciona uno en la barra superior.";
const NO_MEDICO = "Usted no es un médico. No puede ingresar a este sitio.";

type DatosDisponibilidad = {
    dias: string[];
    horaInicio: string;
    horaFin: string;
    //duracion: number;
};

const WEEKDAYS = Object.values(Weekday);
const WEEKDAY_VALUES = new Set<string>(WEEKDAYS);

export async function guardarDisponibilidad(datos: DatosDisponibilidad): Promise<DisponibilidadState> {
    const context = await getActorContext();
    if (!context) {
        return { status: "error", message: NO_ACTOR };
    }
    // El rol efectivo define sobre que profesional se guarda; el autor real es
    // quien lo modifico (el administrador no se reencarna en el profesional).
    const actor = context.effective;
    if (actor.role !== UserRole.MEDICO) {
        return { status: "error", message: NO_MEDICO };
    }

    if (
        !datos || !Array.isArray(datos.dias) ||
        !datos.dias.every((dia): dia is string => typeof dia === "string") ||
        typeof datos.horaInicio !== "string" || typeof datos.horaFin !== "string"
    ) {
        return { status: "error", message: "Los datos de disponibilidad no son válidos." };
    }

    if (datos.dias.length === 0) {
        return { status: "error", message: "Selecciona al menos un día." };
    }

    const dias = datos.dias.filter((dia): dia is Weekday => WEEKDAY_VALUES.has(dia));
    if (dias.length !== datos.dias.length) {
        return { status: "error", message: "Uno o más días seleccionados no son válidos." };
    }
    if (new Set(dias).size !== dias.length) {
        return { status: "error", message: "No se puede repetir un día de atención." };
    }
    if (dias.length > 2) {
        return { status: "error", message: "Cada profesional puede atender como máximo dos días distintos por semana." };
    }

    const formatoHoraValido = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!formatoHoraValido.test(datos.horaInicio) || !formatoHoraValido.test(datos.horaFin)) {
        return { status: "error", message: "La franja horaria no es válida." };
    }
    if (datos.horaInicio >= datos.horaFin) {
        return { status: "error", message: "La hora de inicio debe ser anterior a la hora de fin." };
    }

    const horaInicio = new Date(`1970-01-01T${datos.horaInicio}:00.000Z`);
    const horaFin = new Date(`1970-01-01T${datos.horaFin}:00.000Z`);
    const fechaModificacion = new Date();

    try {
        const medico = await prisma.doctor.findUnique({
            where: { id: actor.id },
            select: { id: true },
        });
        if (!medico) {
            return { status: "error", message: "No se encontró el perfil médico para guardar la disponibilidad." };
        }

        const audit = buildExerciseAudit(context, {
            action: AuditAction.GUARDAR_DISPONIBILIDAD,
            entity: AuditEntity.HORARIO_ATENCION,
            entityId: medico.id,
            details: { dias, horaInicio: datos.horaInicio, horaFin: datos.horaFin },
        });

        await prisma.$transaction(async (tx) => {
            await tx.doctorSchedule.deleteMany({
                where: { doctorId: medico.id },
            });

            await tx.doctorSchedule.createMany({
                data: dias.map((weekday) => ({
                    doctorId: medico.id,
                    weekday,
                    startTime: horaInicio,
                    endTime: horaFin,
                    modifiedById: context.real.id,
                    modifiedAt: fechaModificacion,
                })),
            });

            if (audit) {
                await insertAudit(tx, audit);
            }
        });

        revalidatePath("/medico/agenda");
        revalidatePath("/medico/disponibilidad");
        return { status: "success", message: "La disponibilidad se guardó correctamente." };
    } catch (error: unknown) {
        console.error("Error al guardar la disponibilidad médica:", error);
        return { status: "error", message: "No se pudo guardar la disponibilidad por un error inesperado." };
    }
}

export async function obtenerDisponibilidad(): Promise<{
    filas: DisponibilidadGuardada[];
    message?: string;
}> {
    const actor = await getCurrentActor();
    if (!actor) {
        return { filas: [], message: NO_ACTOR };
    }
    if (actor.role !== UserRole.MEDICO) {
        return { filas: [], message: NO_MEDICO };
    }

    try {
        const medico = await prisma.doctor.findUnique({
            where: { id: actor.id },
            select: {
                consultDuration: true,
                schedules: {
                    select: {
                        weekday: true,
                        startTime: true,
                        endTime: true,
                    },
                },
            },
        });
        if (!medico) {
            return {
                filas: [],
                message: "No se encontró el perfil médico para consultar la disponibilidad.",
            };
        }

        return {
            filas: medico.schedules.map((horario) => ({
                weekday: horario.weekday,
                horaInicio: horario.startTime.toISOString().slice(11, 16),
                horaFin: horario.endTime.toISOString().slice(11, 16),
                duracion: medico.consultDuration,
            })),
        };
    } catch (error: unknown) {
        console.error("Error al consultar la disponibilidad médica:", error);
        return {
            filas: [],
            message: "No se pudo consultar la disponibilidad por un error inesperado.",
        };
    }
}