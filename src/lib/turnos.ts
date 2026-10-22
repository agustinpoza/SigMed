// app/lib/turnos.ts
import { prisma } from "@/lib/db";
import { Specialty, AppointmentState, type Prisma } from "@/generated/prisma/client";
import { ESTADOS } from "@/lib/turnos-estados";
import { createHistorySearchMatcher } from "@/lib/clinical-history-search";

function esAppointmentState(value: string): value is AppointmentState {
  return ESTADOS.some((estado) => estado === value);
}

export async function obtenerTurnos(opts: {
  doctorId: string;
  fecha: string;
  estado?: string;
  busqueda?: string;
}) {
  const where: Prisma.AppointmentWhereInput = {
    doctorId: opts.doctorId,
    startsAt: {
      gte: new Date(`${opts.fecha}T00:00:00-03:00`),
      lte: new Date(`${opts.fecha}T23:59:59.999-03:00`),
    },
  };

  if (opts.estado) {
    if (!esAppointmentState(opts.estado)) {
      throw new Error(`Estado de turno invalido: ${opts.estado}`);
    }
    where.status = opts.estado;
  }

  const turnos = await prisma.appointment.findMany({
    where,
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      startsAt: true,
      status: true,
      patientId: true,
      clinicalRecord: { select: { id: true } },
      patient: {
        select: { profile: { select: { firstName: true, lastName: true, dni: true } } },
      },
    },
  });

  // La agenda de un día es chica: se filtra en memoria para que la búsqueda
  // ignore acentos ("perez" encuentra "Pérez") y acepte el DNI.
  const q = opts.busqueda?.trim();
  if (!q) return turnos;

  const coincide = createHistorySearchMatcher(q);
  return turnos.filter(({ patient: { profile } }) =>
    coincide([profile.lastName, profile.firstName, profile.dni]),
  );
}

export interface FiltrosTurnos {
  specialty?: string;
  doctorId?: string;
  date?: string; // Formato YYYY-MM-DD
}

export async function buscarTurnosDisponibles(filtros: FiltrosTurnos) {
  const whereClause: any = {
    status: AppointmentState.RESERVADO, // O filtrado según la lógica de espacios libres creados
  };

  // 1. Filtrar por Médico específico o por Especialidad
  if (filtros.doctorId) {
    whereClause.doctorId = filtros.doctorId;
  }
  if (filtros.specialty) {
    whereClause.doctor = {
      specialty: filtros.specialty as Specialty,
    };
  }

  // 2. Filtrar por rango de Fecha (inicio y fin del día)
  if (filtros.date) {
    const startOfDay = new Date(`${filtros.date}T00:00:00.000Z`);
    const endOfDay = new Date(`${filtros.date}T23:59:59.999Z`);
    whereClause.startsAt = {
      gte: startOfDay,
      lte: endOfDay,
    };
  }

  const turnos = await prisma.appointment.findMany({
    where: whereClause,
    include: {
      doctor: {
        include: {
          profile: true,
        },
      },
    },
    orderBy: {
      startsAt: "asc",
    },
  });

  return turnos;
}

/**
 * Elimina de la base de datos los turnos cuya fecha y hora de inicio ya han pasado
 * y que se encontraban en estado RESERVADO o CONFIRMADO (turnos vencidos sin haber sido atendidos).
 */
export async function eliminarTurnosVencidos() {
  try {
    const ahora = new Date();
    return await prisma.appointment.deleteMany({
      where: {
        startsAt: { lt: ahora },
        status: { in: [AppointmentState.RESERVADO, AppointmentState.CONFIRMADO] },
      },
    });
  } catch (error) {
    console.error("Error al eliminar turnos vencidos:", error);
    return { count: 0 };
  }
}