import { beforeEach, describe, expect, it, vi } from "vitest";
import { confirmarTurno, reservarTurno, cancelarTurnoPaciente } from "./actions";
import { AppointmentState, Specialty } from "@/generated/prisma/client";
import { eliminarTurnosVencidos } from "@/lib/turnos";

const mocks = vi.hoisted(() => ({
  actor: vi.fn(),
  findPatient: vi.fn(),
  findDoctor: vi.fn(),
  findFirstAppointment: vi.fn(),
  createAppointment: vi.fn(),
  updateMany: vi.fn(),
  deleteMany: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    patient: { findUnique: mocks.findPatient },
    doctor: { findUnique: mocks.findDoctor },
    appointment: {
      findFirst: mocks.findFirstAppointment,
      create: mocks.createAppointment,
      updateMany: mocks.updateMany,
      deleteMany: mocks.deleteMany,
    },
  },
}));

vi.mock("@/lib/actor", () => ({
  getCurrentActor: mocks.actor,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidate,
}));

const PACIENTE_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const DOCTOR_ID = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e";
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
  mocks.findDoctor.mockResolvedValue({
    id: DOCTOR_ID,
    consultDuration: 30,
    specialty: Specialty.CLINICO,
    licenseNumber: "MP-12345",
    profile: { firstName: "Juan", lastName: "Pérez" },
  });
  mocks.findFirstAppointment.mockResolvedValue(null);
  mocks.createAppointment.mockResolvedValue({ id: APPOINTMENT_ID });
  mocks.updateMany.mockResolvedValue({ count: 1 });
  mocks.deleteMany.mockResolvedValue({ count: 1 });
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

describe("Cancelación / Baja del Turno por Paciente", () => {
  it("elimina el turno de la base de datos y revalida las rutas", async () => {
    const res = await cancelarTurnoPaciente(formData());
    expect(res).toEqual({ success: true });
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: {
        id: APPOINTMENT_ID,
        patientId: PACIENTE_ID,
      },
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/paciente/mis-turnos");
  });

  it("rechaza si el turno no pertenece al paciente o no existe", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 0 });
    await expect(cancelarTurnoPaciente(formData())).rejects.toThrow(
      "El turno no se encuentra disponible o pertenece a otro usuario."
    );
  });
});

describe("Reserva de Turnos: Validación de turnos vencidos y no re-selección", () => {
  it("rechaza la selección de turnos previos a la fecha y hora actual", async () => {
    const fd = new FormData();
    fd.set("doctorId", DOCTOR_ID);
    fd.set("startsAt", "2020-01-01T10:00:00-03:00"); // Fecha pasada

    await expect(reservarTurno(fd)).rejects.toThrow(
      "No se pueden seleccionar turnos previos a la fecha y hora actual."
    );
  });

  it("rechaza la selección si el turno ya fue reservado / ocupado por otro usuario", async () => {
    const futureDate = new Date(Date.now() + 86400000 * 2).toISOString();
    const fd = new FormData();
    fd.set("doctorId", DOCTOR_ID);
    fd.set("startsAt", futureDate);

    // Simular que el turno ya está reservado en DB
    mocks.findFirstAppointment.mockResolvedValue({
      id: "occupied-id",
      status: AppointmentState.RESERVADO,
    });

    await expect(reservarTurno(fd)).rejects.toThrow(
      "El turno seleccionado ya fue reservado por otro usuario."
    );
    expect(mocks.createAppointment).not.toHaveBeenCalled();
  });

  it("crea un nuevo turno si está libre y es fecha futura", async () => {
    const futureDate = new Date(Date.now() + 86400000 * 2).toISOString();
    const fd = new FormData();
    fd.set("doctorId", DOCTOR_ID);
    fd.set("startsAt", futureDate);

    const res = await reservarTurno(fd);
    expect(res).toEqual({ success: true, appointmentId: APPOINTMENT_ID });
    expect(mocks.createAppointment).toHaveBeenCalledWith({
      data: expect.objectContaining({
        patientId: PACIENTE_ID,
        doctorId: DOCTOR_ID,
        status: AppointmentState.RESERVADO,
      }),
    });
  });

  it("elimina turnos vencidos pasados de fecha u hora en estado RESERVADO o CONFIRMADO", async () => {
    await eliminarTurnosVencidos();
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: {
        startsAt: { lt: expect.any(Date) },
        status: { in: [AppointmentState.RESERVADO, AppointmentState.CONFIRMADO] },
      },
    });
  });
});
