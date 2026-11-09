import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppointmentState } from "@/generated/prisma/enums";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { appointment: { findUnique: mocks.findUnique } },
}));

vi.mock("@/lib/email", () => ({
  sendEmail: mocks.sendEmail,
}));

import { notifyAppointmentCancelled } from "@/lib/appointment-notifications";

const TURNO_ID = "c7a843bb-5452-4fc8-9f12-0f04e76e5d59";

function cancelledAppointment(overrides: Record<string, unknown> = {}) {
  return {
    id: TURNO_ID,
    status: AppointmentState.CANCELADO,
    startsAt: new Date("2026-10-12T18:30:00.000Z"),
    endsAt: new Date("2026-10-12T19:00:00.000Z"),
    cancellationReason: "Urgencia del profesional",
    patient: {
      profile: {
        firstName: "Ana",
        lastName: "Gómez",
        email: "ana@example.com",
      },
    },
    doctor: {
      specialty: "CLINICO",
      profile: { firstName: "Juan", lastName: "Pérez" },
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.sendEmail.mockResolvedValue({ provider: "console" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RF-10: notificacion de cancelacion", () => {
  it("envia el mail al paciente del turno cancelado", async () => {
    mocks.findUnique.mockResolvedValue(cancelledAppointment());

    const result = await notifyAppointmentCancelled(TURNO_ID);

    expect(result).toEqual({ sent: true, provider: "console" });
    expect(mocks.sendEmail).toHaveBeenCalledOnce();

    const message = mocks.sendEmail.mock.calls[0][0];
    expect(message.to).toBe("ana@example.com");
    expect(message.subject).toContain("Turno cancelado");
    expect(message.text).toContain("Dr. Pérez, Juan");
    expect(message.text).toContain("Clínica médica");
    expect(message.text).toContain("Urgencia del profesional");
    expect(message.text).toContain(`/paciente/turnos?reprogramar=${TURNO_ID}`);
  });

  it("no envia nada si el turno no esta cancelado", async () => {
    mocks.findUnique.mockResolvedValue(
      cancelledAppointment({ status: AppointmentState.CONFIRMADO }),
    );

    const result = await notifyAppointmentCancelled(TURNO_ID);

    expect(result).toEqual({ sent: false, skipped: "not-cancelled" });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("no envia nada si el turno no existe", async () => {
    mocks.findUnique.mockResolvedValue(null);

    const result = await notifyAppointmentCancelled(TURNO_ID);

    expect(result).toEqual({ sent: false, skipped: "not-found" });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("no lanza si el transporte falla", async () => {
    mocks.findUnique.mockResolvedValue(cancelledAppointment());
    mocks.sendEmail.mockRejectedValue(new Error("Resend caido"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await notifyAppointmentCancelled(TURNO_ID);

    expect(result).toEqual({ sent: false, error: "Resend caido" });
    expect(error).toHaveBeenCalledOnce();
  });

  it("no lanza si falla la consulta a la base", async () => {
    mocks.findUnique.mockRejectedValue(new Error("db caida"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await notifyAppointmentCancelled(TURNO_ID);

    expect(result).toEqual({ sent: false, error: "db caida" });
    expect(error).toHaveBeenCalledOnce();
  });
});
