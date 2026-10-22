import { beforeEach, describe, expect, it, vi } from "vitest";
import { registrarAsistencia } from "./actions";
import { AppointmentState } from "@/generated/prisma/enums";

const mocks = vi.hoisted(() => ({
  actor: vi.fn(),
  findDoctor: vi.fn(),
  findAppointment: vi.fn(),
  updateMany: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    doctor: { findUnique: mocks.findDoctor },
    appointment: {
      findUnique: mocks.findAppointment,
      updateMany: mocks.updateMany,
    },
  },
}));

vi.mock("@/lib/actor", () => ({
  getCurrentActor: mocks.actor,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidate,
}));

const MEDICO_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const TURNO_ID = "c7a843bb-5452-4fc8-9f12-0f04e76e5d59";

function formData(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  const values = {
    appointmentId: TURNO_ID,
    estado: "ATENDIDO",
    ...overrides,
  };
  for (const [k, v] of Object.entries(values)) {
    fd.set(k, v);
  }
  return fd;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.actor.mockResolvedValue({ id: MEDICO_ID });
  mocks.findDoctor.mockResolvedValue({ id: MEDICO_ID });
  mocks.findAppointment.mockResolvedValue({
    id: TURNO_ID,
    doctorId: MEDICO_ID,
    startsAt: new Date("2026-10-14T14:00:00Z"),
  });
  mocks.updateMany.mockResolvedValue({ count: 1 });
});

describe("US 2.8: Registro de Asistencia del Paciente (RF-29)", () => {
  it("CA1: actualiza el estado a ATENDIDO, registra attendanceAt y revalida", async () => {
    await registrarAsistencia(formData({ estado: "ATENDIDO" }));
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        id: TURNO_ID,
        doctorId: MEDICO_ID,
      },
      data: {
        status: AppointmentState.ATENDIDO,
        attendanceAt: expect.any(Date),
      },
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/medico/agenda");
  });

  it("CA1: actualiza el estado a AUSENTE correctamente", async () => {
    await registrarAsistencia(formData({ estado: "AUSENTE" }));
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        id: TURNO_ID,
        doctorId: MEDICO_ID,
      },
      data: {
        status: AppointmentState.AUSENTE,
        attendanceAt: expect.any(Date),
      },
    });
  });

  it("CA2: rechaza si el turno pertenece a otro profesional", async () => {
    mocks.findAppointment.mockResolvedValue({
      id: TURNO_ID,
      doctorId: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
      startsAt: new Date("2026-10-14T14:00:00Z"),
    });

    await expect(registrarAsistencia(formData())).rejects.toThrow(
      "No puedes actualizar el turno de otro profesional."
    );
  });

  it("CA2: solo el médico asignado puede registrar asistencia", async () => {
    mocks.findDoctor.mockResolvedValue(null);
    await expect(registrarAsistencia(formData())).rejects.toThrow(
      "Operación denegada. Solo el médico asignado puede registrar asistencia."
    );
  });

  it("rechaza si no hay usuario autenticado", async () => {
    mocks.actor.mockResolvedValue(null);
    await expect(registrarAsistencia(formData())).rejects.toThrow("No autorizado.");
  });

  it("rechaza estado inválido", async () => {
    await expect(registrarAsistencia(formData({ estado: "CANCELADO" }))).rejects.toThrow(
      "Estado de asistencia inválido."
    );
  });

  it("maneja filas demo sin error", async () => {
    await expect(registrarAsistencia(formData({ appointmentId: "demo-1" }))).resolves.toBeUndefined();
  });
});
