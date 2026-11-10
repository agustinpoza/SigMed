// US-6.1 / RF-19: reporte de turnos atendidos y cancelados por especialidad.
// Prisma, SQL y triggers son reales sobre una base aislada.
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { AppointmentState, Speciality, UserRole } from "@/generated/prisma/enums";
import {
  reporteTurnosPorEspecialidad,
  reporteTurnosPorEspecialidadCsv,
} from "@/lib/reports";

// Período lejano y propio de esta suite: no se cruza con turnos de otras pruebas.
const PERIODO = { desde: "2031-03-01", hasta: "2031-03-31" };
const PERIODO_VACIO = { desde: "2032-07-01", hasta: "2032-07-31" };

type DoctorRef = { id: string; consultDuration: number };
const doctors = {} as Record<Speciality, DoctorRef>;
let patientId: string;

async function profile(role: UserRole, firstName: string) {
  const dni = String(Math.floor(60_000_000 + Math.random() * 9_000_000));
  return prisma.userProfile.create({
    data: {
      firstName,
      lastName: "Reporte",
      dni,
      role,
      email: `${dni}-${randomUUID()}@example.invalid`,
      clerkUserId: `fixture-${randomUUID()}`,
    },
  });
}

/** La especialidad es única por médico: se reutiliza el que ya exista en la base. */
async function ensureDoctor(speciality: Speciality): Promise<DoctorRef> {
  const existing = await prisma.doctor.findUnique({ where: { speciality } });
  if (existing) return existing;

  const user = await profile(UserRole.MEDICO, `Medico ${speciality}`);
  return prisma.doctor.create({
    data: {
      id: user.id,
      licenseNumber: `MAT-${randomUUID()}`,
      speciality,
      consultDuration: 30,
      consultFee: 100,
    },
  });
}

async function turno(speciality: Speciality, status: AppointmentState, startsAtIso: string) {
  const doctor = doctors[speciality];
  const startsAt = new Date(startsAtIso);
  return prisma.appointment.create({
    data: {
      patientId,
      doctorId: doctor.id,
      startsAt,
      endsAt: new Date(startsAt.getTime() + doctor.consultDuration * 60_000),
      status,
      reservedById: patientId,
      ...(status === AppointmentState.CANCELADO
        ? { cancelledById: patientId, cancelledAt: new Date() }
        : {}),
      ...(status === AppointmentState.ATENDIDO || status === AppointmentState.AUSENTE
        ? { attendanceAt: startsAt }
        : {}),
    },
  });
}

beforeAll(async () => {
  for (const speciality of Object.values(Speciality)) {
    doctors[speciality] = await ensureDoctor(speciality);
  }
  const patient = await profile(UserRole.PACIENTE, "Paciente");
  await prisma.patient.create({ data: { id: patient.id } });
  patientId = patient.id;

  const { ATENDIDO, CANCELADO, RESERVADO, AUSENTE } = AppointmentState;

  // Clínica médica: 3 atendidos y 1 cancelado dentro del período.
  await turno(Speciality.CLINICO, ATENDIDO, "2031-03-01T00:00:00-03:00"); // primer instante
  await turno(Speciality.CLINICO, ATENDIDO, "2031-03-10T09:00:00-03:00");
  await turno(Speciality.CLINICO, ATENDIDO, "2031-03-31T22:00:00-03:00"); // último día, ya 1/4 en UTC
  await turno(Speciality.CLINICO, CANCELADO, "2031-03-12T09:00:00-03:00");
  // No cuentan: otros estados y fechas fuera del período.
  await turno(Speciality.CLINICO, RESERVADO, "2031-03-13T09:00:00-03:00");
  await turno(Speciality.CLINICO, AUSENTE, "2031-03-14T09:00:00-03:00");
  await turno(Speciality.CLINICO, ATENDIDO, "2031-02-28T22:00:00-03:00");
  await turno(Speciality.CLINICO, CANCELADO, "2031-04-01T00:00:00-03:00");

  // Pediatría: 1 atendido y 2 cancelados.
  await turno(Speciality.PEDIATRA, ATENDIDO, "2031-03-05T10:00:00-03:00");
  await turno(Speciality.PEDIATRA, CANCELADO, "2031-03-06T10:00:00-03:00");
  await turno(Speciality.PEDIATRA, CANCELADO, "2031-03-07T10:00:00-03:00");

  // Traumatología: sin turnos atendidos ni cancelados en el período.
  await turno(Speciality.TRAUMATOLOGO, RESERVADO, "2031-03-08T11:00:00-03:00");
});

describe("US-6.1: reporte de turnos atendidos y cancelados por especialidad", () => {
  it("CA1: agrupa atendidos y cancelados del período por especialidad", async () => {
    const report = await reporteTurnosPorEspecialidad(PERIODO);
    const porEspecialidad = Object.fromEntries(
      report.rows.map((row) => [row.speciality, row]),
    );

    expect(porEspecialidad.CLINICO).toMatchObject({
      label: "Clínica médica",
      atendidos: 3,
      cancelados: 1,
      total: 4,
    });
    expect(porEspecialidad.PEDIATRA).toMatchObject({ atendidos: 1, cancelados: 2, total: 3 });
    expect(porEspecialidad.TRAUMATOLOGO).toMatchObject({ atendidos: 0, cancelados: 0, total: 0 });
    expect(report.totals).toEqual({ atendidos: 4, cancelados: 3, total: 7 });
  });

  it("CA1: respeta los límites del rango de fechas", async () => {
    const report = await reporteTurnosPorEspecialidad({
      desde: "2031-03-10",
      hasta: "2031-03-12",
    });

    expect(report.totals).toEqual({ atendidos: 1, cancelados: 1, total: 2 });
  });

  it("CA2: sin registros en el período devuelve todas las especialidades en cero", async () => {
    const report = await reporteTurnosPorEspecialidad(PERIODO_VACIO);

    expect(report.rows).toHaveLength(Object.values(Speciality).length);
    for (const row of report.rows) {
      expect(row).toMatchObject({ atendidos: 0, cancelados: 0, total: 0 });
    }
    expect(report.totals).toEqual({ atendidos: 0, cancelados: 0, total: 0 });
  });

  it("exporta el mismo detalle en CSV", async () => {
    const csv = reporteTurnosPorEspecialidadCsv(await reporteTurnosPorEspecialidad(PERIODO));

    expect(csv.split("\r\n")).toEqual([
      "Especialidad;Turnos atendidos;Turnos cancelados;Total de turnos",
      "Clínica médica;3;1;4",
      "Pediatría;1;2;3",
      "Traumatología;0;0;0",
      "Totales;4;3;7",
      "",
    ]);
  });
});
