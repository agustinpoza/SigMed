import { beforeEach, describe, expect, it, vi } from "vitest";
import { confirmarTurno } from "./actions";
import { AppointmentState } from "@/generated/prisma/client";

const mocks = vi.hoisted(() => ({
  actor: vi.fn(),
  findPatient: vi.fn(),
  updateMany: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    patient: { findUnique: mocks.findPatient },
    appointment: { updateMany: mocks.updateMany },
  },
}));

vi.mock("@/lib/actor", () => ({
  getCurrentActor: mocks.actor,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidate,
}));

const PACIENTE_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const APPOINTMENT_ID = "c7a843bb-5452-4fc8-9f12-0f04e76e5d59";

function formData(appointmentId: string = APPOINTMENT_ID) {
  const fd = new FormData();
  if (appointmentId) fd.set("appointmentId", appointmentId);
  return fd;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.actor.mockResolvedValue({ id: PACIENTE_ID });
  mocks.findPatient.mockResolvedValue({ id: PACIENTE_ID });
  mocks.updateMany.mockResolvedValue({ count: 1 });
});

describe("US 2.2: Confirmación del Turno (RF-06)", () => {
  it("CA1: cambia el estado del turno a CONFIRMADO y revalida la ruta", async () => {
    const res = await confirmarTurno(formData());
    expect(res).toEqual({ success: true });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        id: APPOINTMENT_ID,
        patientId: PACIENTE_ID,
        status: AppointmentState.RESERVADO,
      },
      data: {
        status: AppointmentState.CONFIRMADO,
      },
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/paciente/turnos");
  });

  it("CA2: previene confirmaciones sobre turnos ajenos o no disponibles (count === 0)", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    await expect(confirmarTurno(formData())).rejects.toThrow(
      "El turno no se encuentra disponible o pertenece a otro usuario."
    );
  });

  it("rechaza si no hay usuario autenticado", async () => {
    mocks.actor.mockResolvedValue(null);
    await expect(confirmarTurno(formData())).rejects.toThrow("No autorizado.");
  });

  it("rechaza si no se envía appointmentId", async () => {
    const emptyFd = new FormData();
    await expect(confirmarTurno(emptyFd)).rejects.toThrow("Identificador de turno inválido.");
  });

  it("rechaza si el usuario no tiene perfil de paciente", async () => {
    mocks.findPatient.mockResolvedValue(null);
    await expect(confirmarTurno(formData())).rejects.toThrow("Solo los pacientes pueden confirmar reservas.");
  });
});
