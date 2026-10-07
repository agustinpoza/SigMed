// app/lib/turnos.ts
import { prisma } from "@/lib/db";
import type { AppointmentStatus, Prisma } from "@/generated/prisma/client";

export const ESTADOS: AppointmentStatus[] = [ "Reservado", "Atendido", "Ausente", "Cancelado"];

export const ETIQUETAS_ESTADO: Record<AppointmentStatus, string> = {
    RESERVADO: "Reservado",
    ATENDIDO: "Atendido",
    AUSENTE: "Ausente",
    CANCELADO: "Cancelado",
};

export async function obtenerTurnos(opts: {
  doctorId: string;
  fecha: string;
  estado?: string;
  busqueda?: string;
}) {
  const where: Prisma.AppointmentWhereInput = {
    doctorId: opts.doctorId,
    startAt: {
      gte: new Date(`${opts.fecha}T00:00:00-03:00`),
      lte: new Date(`${opts.fecha}T23:59:59.999-03:00`),
    },
  };

  if (opts.estado) where.status = opts.estado;

  const q = opts.busqueda?.trim();
  if (q) {
    where.patient = {
      profile: {
        OR: [
          { lastName: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
          { dni: { contains: q } },
        ],
      },
    };
  }

  return prisma.appointment.findMany({
    where,
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      startAt: true,
      status: true,
      patient: {
        select: { profile: { select: { firstName: true, lastName: true, dni: true } } },
      },
    },
  });
}