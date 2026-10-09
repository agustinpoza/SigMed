// app/lib/turnos.ts
import { prisma } from "@/lib/db";
import type { AppointmentState, Prisma } from "@/generated/prisma/client";
import { ESTADOS } from "@/lib/turnos-estados";

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
  };

  const q = opts.busqueda?.trim();
  if (q) {
    where.patient = {
      profile: {
        OR: [
          { lastName: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
        ],
      },
    };
  }

  return prisma.appointment.findMany({
    where,
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      startsAt: true,
      status: true,
      patient: {
        select: { profile: { select: { firstName: true, lastName: true, dni: true } } },
      },
    },
  });
}