import { beforeEach, describe, expect, it, vi } from "vitest";
import { registrarAsistencia } from "./actions";
import { AppointmentState } from "@/generated/prisma/enums";

const mocks = vi.hoisted(() => ({
  actor: vi.fn(),
  findDoctor: vi.fn(),
  findAppointment: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  transaction: vi.fn(),
  generarCargo: vi.fn(),
  anularCargo: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    doctor: { findUnique: mocks.findDoctor },
    appointment: {
      findUnique: mocks.findAppointment,
      updateMany: mocks.updateMany,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/lib/payments", () => ({
  generarCargoInasistencia: mocks.generarCargo,
  anularCargoInasistencia: mocks.anularCargo,
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
  mocks.update.mockResolvedValue({});
  mocks.transaction.mockImplementation(async (callback) =>
    callback({ appointment: { update: mocks.update } }),
  );
  mocks.generarCargo.mockResolvedValue({ created: true });
  mocks.anularCargo.mockResolvedValue(null);
});

describe("US 2.8: Registro de Asistencia del Paciente (RF-29)", () => {
  it("CA1: actualiza el estado a ATENDIDO, registra attendanceAt y revalida", async () => {
    await registrarAsistencia(formData({ estado: "ATENDIDO" }));
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: TURNO_ID },
      data: {
        status: AppointmentState.ATENDIDO,
        attendanceAt: expect.any(Date),
      },
    });
    expect(mocks.generarCargo).not.toHaveBeenCalled();
    expect(mocks.revalidate).toHaveBeenCalledWith("/medico/agenda");
  });

  it("CA1: actualiza el estado a AUSENTE y genera la deuda por inasistencia", async () => {
    await registrarAsistencia(formData({ estado: "AUSENTE" }));
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: TURNO_ID },
      data: {
        status: AppointmentState.AUSENTE,
        attendanceAt: expect.any(Date),
      },
    });
    expect(mocks.generarCargo).toHaveBeenCalledWith(
      expect.objectContaining({ appointment: expect.anything() }),
      TURNO_ID,
      MEDICO_ID,
    );
  });

  it("al corregir una ausencia a atendido anula la deuda impaga", async () => {
    mocks.findAppointment.mockResolvedValue({
      id: TURNO_ID,
      doctorId: MEDICO_ID,
      status: AppointmentState.AUSENTE,
      startsAt: new Date("2026-10-14T14:00:00Z"),
    });

    await registrarAsistencia(formData({ estado: "ATENDIDO" }));
    expect(mocks.anularCargo).toHaveBeenCalledWith(
      expect.objectContaining({ appointment: expect.anything() }),
      TURNO_ID,
    );
    expect(mocks.generarCargo).not.toHaveBeenCalled();
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
