import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  confirmarTurno,
  reservarTurno,
  cancelarTurno,
  cancelarTurnoPaciente,
  reprogramarTurno,
} from "./actions";
import { AppointmentState, Specialty } from "@/generated/prisma/client";
import { eliminarTurnosVencidos } from "@/lib/turnos";
import {
  AgendaRuleError,
  limpiarCacheRecordatoriosEnviados,
  procesarRecordatoriosTurnos,
} from "@/lib/agenda";
import { enviarConfirmacionTurnoEmail, sendEmail } from "@/lib/email";

const mocks = vi.hoisted(() => ({
  actor: vi.fn(),
  findPatient: vi.fn(),
  findDoctor: vi.fn(),
  findUniqueAppointment: vi.fn(),
  findFirstAppointment: vi.fn(),
  findManyAppointments: vi.fn(),
  createAppointment: vi.fn(),
  updateAppointment: vi.fn(),
  updateMany: vi.fn(),
  deleteMany: vi.fn(),
  findFirstBlock: vi.fn(),
  deleteManyBlocks: vi.fn(),
  transaction: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("@/lib/db", () => {
  const prismaMock: Record<string, any> = {
    patient: { findUnique: mocks.findPatient },
    doctor: { findUnique: mocks.findDoctor },
    appointment: {
      findUnique: mocks.findUniqueAppointment,
      findFirst: mocks.findFirstAppointment,
      findMany: mocks.findManyAppointments,
      create: mocks.createAppointment,
      update: mocks.updateAppointment,
      updateMany: mocks.updateMany,
      deleteMany: mocks.deleteMany,
    },
    scheduleBlock: {
      findFirst: mocks.findFirstBlock,
      deleteMany: mocks.deleteManyBlocks,
    },
    $transaction: (cb: (tx: any) => Promise<any>) => mocks.transaction(cb, prismaMock),
  };
  return { prisma: prismaMock };
});

vi.mock("@/lib/actor", () => ({
  getCurrentActor: mocks.actor,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidate,
}));

const PACIENTE_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const DOCTOR_ID = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e";
const APPOINTMENT_ID = "c7a843bb-5452-4fc8-9f12-0f04e76e5d59";
const NEW_APPOINTMENT_ID = "d8b954cc-6563-4ad9-8a23-1a15f87f6e60";

function formData(appointmentId: string = APPOINTMENT_ID) {
  const fd = new FormData();
  if (appointmentId) fd.set("appointmentId", appointmentId);
  return fd;
}

beforeEach(() => {
  vi.resetAllMocks();
  limpiarCacheRecordatoriosEnviados();
  mocks.actor.mockResolvedValue({
    id: PACIENTE_ID,
    firstName: "Lucía",
    lastName: "Gómez",
    email: "lucia.gomez@example.com",
  });
  mocks.findPatient.mockResolvedValue({ id: PACIENTE_ID });
  mocks.findDoctor.mockResolvedValue({
    id: DOCTOR_ID,
    consultDuration: 30,
    specialty: Specialty.CLINICO,
    licenseNumber: "MP-12345",
    profile: { firstName: "Juan", lastName: "Pérez" },
  });
  mocks.findUniqueAppointment.mockResolvedValue(null);
  mocks.findFirstAppointment.mockResolvedValue(null);
  mocks.findManyAppointments.mockResolvedValue([]);
  mocks.createAppointment.mockResolvedValue({ id: APPOINTMENT_ID });
  mocks.updateAppointment.mockResolvedValue({ id: APPOINTMENT_ID });
  mocks.updateMany.mockResolvedValue({ count: 1 });
  mocks.deleteMany.mockResolvedValue({ count: 1 });
  mocks.findFirstBlock.mockResolvedValue(null);
  mocks.deleteManyBlocks.mockResolvedValue({ count: 0 });
  mocks.transaction.mockImplementation(async (cb, txClient) => cb(txClient));
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
    await expect(confirmarTurno(formData())).rejects.toThrow(
      "Solo los pacientes pueden confirmar reservas."
    );
  });
});

describe("US 2.3: Confirmación y recordatorios por email (RF-07)", () => {
  it("conmuta automáticamente al proveedor secundario si falla el primario", async () => {
    const result = await sendEmail(
      {
        to: "paciente@sigmed.com",
        subject: "Prueba failover",
        text: "Contenido",
        html: "<p>Contenido</p>",
      },
      { simulatePrimaryFailure: true },
    );

    expect(result.success).toBe(true);
    expect(result.provider).toBe("SECONDARY_SMTP");
    expect(result.fallbackUsed).toBe(true);
  });

  it("envía correo de confirmación con Profesional, Especialidad, Fecha y Hora", async () => {
    const res = await enviarConfirmacionTurnoEmail({
      patientEmail: "lucia.gomez@example.com",
      patientName: "Lucía Gómez",
      doctorName: "Sofía Duarte",
      doctorLicense: "MP-1002",
      specialty: "Pediatría",
      dateTime: "30/10/2026 - 15:00",
    });

    expect(res.success).toBe(true);
    expect(res.provider).toBe("PRIMARY_RESEND");
  });

  it("procesarRecordatoriosTurnos envía recordatorios y evita duplicados verificando recordatorio_enviado", async () => {
    const proximoTurno = new Date(Date.now() + 3600_000 * 4);
    mocks.findManyAppointments.mockResolvedValue([
      {
        id: APPOINTMENT_ID,
        patientId: PACIENTE_ID,
        doctorId: DOCTOR_ID,
        startsAt: proximoTurno,
        endsAt: new Date(proximoTurno.getTime() + 30 * 60_000),
        status: AppointmentState.CONFIRMADO,
        recordatorio_enviado: false,
        doctor: {
          specialty: Specialty.PEDIATRA,
          licenseNumber: "MP-1002",
          profile: { firstName: "Sofía", lastName: "Duarte" },
        },
        patient: {
          profile: {
            firstName: "Lucía",
            lastName: "Gómez",
            email: "lucia.gomez@example.com",
          },
        },
      },
      {
        id: "already-sent-id",
        patientId: PACIENTE_ID,
        doctorId: DOCTOR_ID,
        startsAt: proximoTurno,
        endsAt: new Date(proximoTurno.getTime() + 30 * 60_000),
        status: AppointmentState.CONFIRMADO,
        recordatorio_enviado: true,
        doctor: {
          specialty: Specialty.PEDIATRA,
          licenseNumber: "MP-1002",
          profile: { firstName: "Sofía", lastName: "Duarte" },
        },
        patient: {
          profile: {
            firstName: "Lucía",
            lastName: "Gómez",
            email: "lucia.gomez@example.com",
          },
        },
      },
    ]);

    const res = await procesarRecordatoriosTurnos(24);
    expect(res.procesados).toBe(2);
    expect(res.enviados).toBe(1);
    expect(res.omitidosPorDuplicado).toBe(1);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: APPOINTMENT_ID },
      data: { recordatorio_enviado: true },
    });
  });
});

describe("US 2.4: Cancelación de turno por el paciente (RF-08)", () => {
  it("cambia el status a CANCELADO en una transacción, libera el bloque y revalida las rutas", async () => {
    const startsAt = new Date(Date.now() + 86400_000 * 3);
    const endsAt = new Date(startsAt.getTime() + 30 * 60_000);

    mocks.findUniqueAppointment.mockResolvedValue({
      id: APPOINTMENT_ID,
      patientId: PACIENTE_ID,
      doctorId: DOCTOR_ID,
      startsAt,
      endsAt,
      status: AppointmentState.CONFIRMADO,
    });

    const res = await cancelarTurno(APPOINTMENT_ID);
    expect(res).toEqual({ success: true });
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.updateAppointment).toHaveBeenCalledWith({
      where: { id: APPOINTMENT_ID },
      data: expect.objectContaining({
        status: AppointmentState.CANCELADO,
        cancelledById: PACIENTE_ID,
      }),
    });
    expect(mocks.deleteManyBlocks).toHaveBeenCalledWith({
      where: expect.objectContaining({
        doctorId: DOCTOR_ID,
        startsAt,
        endsAt,
      }),
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/paciente/turnos");
    expect(mocks.revalidate).toHaveBeenCalledWith("/paciente/mis-turnos");
  });

  it("elimina el turno mediante cancelarTurnoPaciente (compatibilidad baja directa)", async () => {
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
});

describe("US 2.5: Reprogramación de turno por el paciente (RF-08)", () => {
  it("reprograma en una transacción: verifica disponibilidad, cancela el original y confirma el nuevo", async () => {
    const oldStartsAt = new Date(Date.now() + 86400_000 * 2);
    const oldEndsAt = new Date(oldStartsAt.getTime() + 30 * 60_000);
    const newScheduleIso = new Date(Date.now() + 86400_000 * 5).toISOString();

    mocks.findUniqueAppointment.mockResolvedValue({
      id: APPOINTMENT_ID,
      patientId: PACIENTE_ID,
      doctorId: DOCTOR_ID,
      startsAt: oldStartsAt,
      endsAt: oldEndsAt,
      status: AppointmentState.CONFIRMADO,
      doctor: {
        id: DOCTOR_ID,
        consultDuration: 30,
        specialty: Specialty.PEDIATRA,
        licenseNumber: "MP-1002",
        profile: { firstName: "Sofía", lastName: "Duarte" },
      },
      patient: {
        id: PACIENTE_ID,
        profile: {
          firstName: "Lucía",
          lastName: "Gómez",
          email: "lucia.gomez@example.com",
        },
      },
    });
    mocks.findFirstAppointment.mockResolvedValue(null);
    mocks.createAppointment.mockResolvedValue({ id: NEW_APPOINTMENT_ID });

    const res = await reprogramarTurno(APPOINTMENT_ID, newScheduleIso);

    expect(res.success).toBe(true);
    expect(res.oldAppointmentId).toBe(APPOINTMENT_ID);
    expect(res.newAppointment.id).toBe(NEW_APPOINTMENT_ID);
    expect(res.newAppointment.status).toBe(AppointmentState.CONFIRMADO);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.updateAppointment).toHaveBeenCalledWith({
      where: { id: APPOINTMENT_ID },
      data: expect.objectContaining({
        status: AppointmentState.CANCELADO,
        cancelledById: PACIENTE_ID,
      }),
    });
    expect(mocks.createAppointment).toHaveBeenCalledWith({
      data: expect.objectContaining({
        patientId: PACIENTE_ID,
        doctorId: DOCTOR_ID,
        status: AppointmentState.CONFIRMADO,
        reservedById: PACIENTE_ID,
      }),
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/paciente/turnos");
    expect(mocks.revalidate).toHaveBeenCalledWith("/paciente/mis-turnos");
  });

  it("lanza AgendaRuleError si el nuevo horario no está DISPONIBLE", async () => {
    const oldStartsAt = new Date(Date.now() + 86400_000 * 2);
    const oldEndsAt = new Date(oldStartsAt.getTime() + 30 * 60_000);
    const occupiedIso = new Date(Date.now() + 86400_000 * 5).toISOString();

    mocks.findUniqueAppointment.mockResolvedValue({
      id: APPOINTMENT_ID,
      patientId: PACIENTE_ID,
      doctorId: DOCTOR_ID,
      startsAt: oldStartsAt,
      endsAt: oldEndsAt,
      status: AppointmentState.CONFIRMADO,
      doctor: {
        id: DOCTOR_ID,
        consultDuration: 30,
        specialty: Specialty.PEDIATRA,
        licenseNumber: "MP-1002",
        profile: { firstName: "Sofía", lastName: "Duarte" },
      },
    });

    // Simular que el nuevo horario ya está ocupado
    mocks.findFirstAppointment.mockResolvedValue({
      id: "otro-turno-id",
      status: AppointmentState.CONFIRMADO,
    });

    await expect(reprogramarTurno(APPOINTMENT_ID, occupiedIso)).rejects.toThrow(
      AgendaRuleError,
    );
    expect(mocks.updateAppointment).not.toHaveBeenCalled();
    expect(mocks.createAppointment).not.toHaveBeenCalled();
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
