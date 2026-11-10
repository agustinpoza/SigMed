import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppointmentState, BlockReason, UserRole } from "@/generated/prisma/enums";
import { guardarBloqueosAgenda, obtenerDiasBloqueados } from "./bloqueos-actions";

const mocks = vi.hoisted(() => ({
  actor: vi.fn(),
  findDoctor: vi.fn(),
  findBlocks: vi.fn(),
  createBlocks: vi.fn(),
  updateAppointments: vi.fn(),
  lockDoctor: vi.fn(),
  transaction: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    doctor: { findUnique: mocks.findDoctor },
    scheduleBlock: {
      findMany: mocks.findBlocks,
      createMany: mocks.createBlocks,
    },
    appointment: { updateMany: mocks.updateAppointments },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/lib/actor", () => ({
  getActorContext: mocks.actor,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidate,
}));

const DOCTOR_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const REAL_ACTOR_ID = "d1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const BLOCKED_DAY = "2099-12-24";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.actor.mockResolvedValue({
    real: { id: REAL_ACTOR_ID },
    effective: { id: DOCTOR_ID, role: UserRole.MEDICO },
  });
  mocks.findDoctor.mockResolvedValue({ id: DOCTOR_ID });
  mocks.findBlocks.mockResolvedValue([]);
  mocks.createBlocks.mockResolvedValue({ count: 1 });
  mocks.updateAppointments.mockResolvedValue({ count: 0 });
  mocks.transaction.mockImplementation(async (callback) =>
    callback({
      $queryRaw: mocks.lockDoctor,
      scheduleBlock: {
        findMany: mocks.findBlocks,
        createMany: mocks.createBlocks,
      },
      appointment: { updateMany: mocks.updateAppointments },
    })
  );
});

describe("bloqueos de agenda médica", () => {
  it("guarda los días completos con motivo y registra al actor real", async () => {
    const result = await guardarBloqueosAgenda({
      dias: [BLOCKED_DAY],
      motivo: BlockReason.LICENCIA,
      descripcion: "Licencia programada",
    });

    expect(result).toEqual({ status: "success", message: "Se bloquearon 1 día." });
    expect(mocks.createBlocks).toHaveBeenCalledWith({
      data: [
        {
          doctorId: DOCTOR_ID,
          startsAt: new Date(`${BLOCKED_DAY}T00:00:00-03:00`),
          endsAt: new Date("2099-12-25T00:00:00-03:00"),
          reason: BlockReason.LICENCIA,
          description: "Licencia programada",
          registeredById: REAL_ACTOR_ID,
        },
      ],
    });
    expect(mocks.updateAppointments).toHaveBeenCalledWith({
      where: {
        doctorId: DOCTOR_ID,
        status: { in: [AppointmentState.RESERVADO, AppointmentState.CONFIRMADO] },
        OR: [
          {
            startsAt: { lt: new Date("2099-12-25T00:00:00-03:00") },
            endsAt: { gt: new Date(`${BLOCKED_DAY}T00:00:00-03:00`) },
          },
        ],
      },
      data: {
        status: AppointmentState.CANCELADO,
        cancelledById: REAL_ACTOR_ID,
        cancellationReason: "Agenda suspendida por licencia: Licencia programada",
        cancelledAt: expect.any(Date),
      },
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/paciente/turnos");
    expect(mocks.revalidate).toHaveBeenCalledWith("/paciente/mis-turnos");
  });

  it("informa cuántos turnos existentes fueron cancelados por el bloqueo", async () => {
    mocks.updateAppointments.mockResolvedValue({ count: 2 });
    const result = await guardarBloqueosAgenda({
      dias: [BLOCKED_DAY],
      motivo: BlockReason.FERIADO,
    });

    expect(result).toEqual({
      status: "success",
      message: "Se bloquearon 1 día. Se cancelaron 2 turnos previamente registrados.",
    });
  });

  it("no duplica días que ya tienen un bloqueo", async () => {
    mocks.findBlocks.mockResolvedValue([
      {
        startsAt: new Date(`${BLOCKED_DAY}T00:00:00-03:00`),
        endsAt: new Date("2099-12-25T00:00:00-03:00"),
      },
    ]);

    const result = await guardarBloqueosAgenda({
      dias: [BLOCKED_DAY],
      motivo: BlockReason.FERIADO,
    });

    expect(result.status).toBe("error");
    expect(result.message).toContain("ya están bloqueados");
    expect(mocks.createBlocks).not.toHaveBeenCalled();
  });

  it("rechaza fechas inexistentes antes de acceder a la base", async () => {
    const result = await guardarBloqueosAgenda({
      dias: ["2099-02-30"],
      motivo: BlockReason.IMPREVISTO,
    });

    expect(result.status).toBe("error");
    expect(mocks.findDoctor).not.toHaveBeenCalled();
  });

  it("no permite bloquear si el rol efectivo no es médico", async () => {
    mocks.actor.mockResolvedValue({
      real: { id: REAL_ACTOR_ID },
      effective: { id: DOCTOR_ID, role: UserRole.PACIENTE },
    });

    const result = await guardarBloqueosAgenda({
      dias: [BLOCKED_DAY],
      motivo: BlockReason.FERIADO,
    });

    expect(result.status).toBe("error");
    expect(mocks.findDoctor).not.toHaveBeenCalled();
  });

  it("devuelve los días ocupados por bloqueos vigentes", async () => {
    mocks.findBlocks.mockResolvedValue([
      {
        startsAt: new Date(`${BLOCKED_DAY}T00:00:00-03:00`),
        endsAt: new Date("2099-12-26T00:00:00-03:00"),
      },
    ]);

    expect(await obtenerDiasBloqueados()).toEqual({
      dias: ["2099-12-24", "2099-12-25"],
    });
  });
});
