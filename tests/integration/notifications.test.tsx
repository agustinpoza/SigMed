//RF-10 / US-2.7: notificación de cancelación con PostgreSQL real.
//Solo se simulan la identidad y la invalidación de Next. Prisma, el trigger de turnos,
//las acciones, el armado del email y el transporte de consola son reales.
import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import type { UserProfile } from "@/generated/prisma/client";
import { AppointmentState, Speciality, UserRole } from "@/generated/prisma/enums";
import {
  cancelarTurno,
  cancelarTurnoPaciente,
  reprogramarTurno,
} from "@/app/(portal)/paciente/turnos/actions";

const boundary = vi.hoisted(() => ({
  actor: null as UserProfile | null,
  revalidate: vi.fn(),
}));
vi.mock("@/lib/actor", () => ({
  getCurrentActor: async () => boundary.actor,
  getActorContext: async () =>
    boundary.actor
      ? { real: boundary.actor, effective: boundary.actor, acting: null }
      : null,
}));
vi.mock("next/cache", () => ({ revalidatePath: boundary.revalidate }));

let patient: UserProfile;
let doctorId: string;
let consultDuration: number;
let doctorCreatedHere = false;
let slot = 0;
let consoleInfo: ReturnType<typeof vi.spyOn>;
let previousResendKey: string | undefined;

function futureStart() {
  slot += 1;
  return new Date(Date.UTC(2040, 4, 14 + slot, 15, 0, 0));
}

async function confirmedAppointment() {
  const startsAt = futureStart();
  return prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId,
      startsAt,
      endsAt: new Date(startsAt.getTime() + consultDuration * 60_000),
      status: AppointmentState.CONFIRMADO,
      reservedById: patient.id,
    },
  });
}

function formData(appointmentId: string) {
  const data = new FormData();
  data.set("appointmentId", appointmentId);
  return data;
}

function sentMails(): string[] {
  return consoleInfo.mock.calls.map((args: unknown[]) => String(args[0]));
}
function cancellationMails(): string[] {
  return sentMails().filter((message) => message.includes("Turno cancelado"));
}

beforeAll(async () => {
  previousResendKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY; // fuerza el transporte de consola, determinista

  const suffix = randomUUID().slice(0, 8);
  patient = await prisma.userProfile.create({
    data: {
      firstName: "Ana",
      lastName: "Paciente",
      dni: `9${suffix.slice(0, 7)}`,
      email: `paciente-${suffix}@example.invalid`,
      clerkUserId: `clerk-paciente-${suffix}`,
      role: UserRole.PACIENTE,
    },
  });
  await prisma.patient.create({ data: { id: patient.id } });

  // El cluster es compartido por los archivos de integración y "especialidad" es única.
  // Se reutiliza cualquier médico ya creado; si no hay, se crea uno y se limpia al terminar.
  const existing = await prisma.doctor.findFirst({
    select: { id: true, consultDuration: true },
  });
  if (existing) {
    doctorId = existing.id;
    consultDuration = existing.consultDuration;
  } else {
    const suffixDoctor = randomUUID().slice(0, 8);
    const profile = await prisma.userProfile.create({
      data: {
        firstName: "Juan",
        lastName: "Médico",
        dni: `8${suffixDoctor.slice(0, 7)}`,
        email: `medico-${suffixDoctor}@example.invalid`,
        clerkUserId: `clerk-medico-${suffixDoctor}`,
        role: UserRole.MEDICO,
      },
    });
    doctorId = profile.id;
    consultDuration = 30;
    doctorCreatedHere = true;
    await prisma.doctor.create({
      data: {
        id: doctorId,
        licenseNumber: `MP-${suffixDoctor}`,
        speciality: Speciality.CLINICO,
        consultDuration,
        consultFee: 100,
      },
    });
  }
});

afterAll(async () => {
  if (previousResendKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = previousResendKey;

  if (doctorCreatedHere) {
    await prisma.appointment.deleteMany({ where: { doctorId } });
    await prisma.doctor.delete({ where: { id: doctorId } });
    await prisma.userProfile.delete({ where: { id: doctorId } });
  }
  await prisma.appointment.deleteMany({ where: { patientId: patient.id } });
  await prisma.patient.delete({ where: { id: patient.id } });
  await prisma.userProfile.delete({ where: { id: patient.id } });
});

beforeEach(() => {
  boundary.actor = patient;
  boundary.revalidate.mockClear();
  consoleInfo = vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.RESEND_API_KEY;
});

describe("US-2.7 / RF-10: cancelación con aviso por email (PostgreSQL real)", () => {
  it("CA1: cancelarTurno persiste CANCELADO y envía el mail al paciente titular", async () => {
    const turno = await confirmedAppointment();

    const result = await cancelarTurno(turno.id);

    expect(result).toEqual({
      success: true,
      notification: {
        sent: true,
        provider: "console",
        preview: {
          to: patient.email,
          subject: expect.stringContaining("Turno cancelado"),
          text: expect.stringContaining("Cancelado por el paciente"),
        },
      },
    });
    const stored = await prisma.appointment.findUniqueOrThrow({
      where: { id: turno.id },
    });
    expect(stored).toMatchObject({
      status: AppointmentState.CANCELADO,
      cancelledById: patient.id,
      cancellationReason: "Cancelado por el paciente",
      cancelledAt: expect.any(Date),
    });
    expect(cancellationMails()).toHaveLength(1);
    const mail = cancellationMails()[0];
    expect(mail).toContain(`to: ${patient.email}`);
    expect(mail).toContain("Turno cancelado");
    expect(mail).toContain("Cancelado por el paciente");
    expect(mail).toContain(`/paciente/turnos?reprogramar=${turno.id}`);
    expect(boundary.revalidate).toHaveBeenCalledWith("/paciente/mis-turnos");
  });

  it("CA2: cancelarTurnoPaciente ya no borra el turno y también avisa", async () => {
    const turno = await confirmedAppointment();

    const result = await cancelarTurnoPaciente(formData(turno.id));

    expect(result).toEqual({
      success: true,
      notification: expect.objectContaining({ sent: true, provider: "console" }),
    });
    const stored = await prisma.appointment.findUnique({
      where: { id: turno.id },
    });
    expect(stored).toMatchObject({
      status: AppointmentState.CANCELADO,
      cancelledById: patient.id,
    });
    expect(cancellationMails()).toHaveLength(1);
    expect(cancellationMails()[0]).toContain(`to: ${patient.email}`);
  });

  it("la reprogramación cancela el turno original sin enviar aviso de cancelación", async () => {
    const turno = await confirmedAppointment();
    const nuevoInicio = new Date(Date.UTC(2041, 0, 15, 10, 0, 0)).toISOString();

    const result = await reprogramarTurno(turno.id, nuevoInicio);

    expect(result.success).toBe(true);
    expect(result.newAppointment.id).not.toBe(turno.id);
    const original = await prisma.appointment.findUniqueOrThrow({
      where: { id: turno.id },
    });
    expect(original).toMatchObject({
      status: AppointmentState.CANCELADO,
      cancellationReason: "Reprogramado por el paciente",
    });
    expect(cancellationMails()).toHaveLength(0);
    expect(sentMails().some((mail) => mail.includes("Confirmación de turno médico"))).toBe(true);
  });

  it("un fallo del transporte no revierte la cancelación ya persistida", async () => {
    const turno = await confirmedAppointment();
    process.env.RESEND_API_KEY = "clave-invalida-de-prueba";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Resend caído"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(cancelarTurno(turno.id)).resolves.toEqual({
      success: true,
      notification: expect.objectContaining({ sent: false }),
    });

    const stored = await prisma.appointment.findUniqueOrThrow({
      where: { id: turno.id },
    });
    expect(stored.status).toBe(AppointmentState.CANCELADO);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("[RF-10] No se pudo enviar el email de cancelacion"),
    );
    delete process.env.RESEND_API_KEY;
  });
});
