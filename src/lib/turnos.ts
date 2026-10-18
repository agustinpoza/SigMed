// app/lib/turnos.ts
import { prisma } from "@/lib/db";
import type { AppointmentState, Prisma } from "@/generated/prisma/client";
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
  };

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