import { beforeEach, describe, expect, it, vi } from "vitest";
import { buscarTurnosDisponibles } from "./turnos";
import { AppointmentState, Specialty } from "@/generated/prisma/client";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    appointment: { findMany: mocks.findMany },
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.findMany.mockResolvedValue([]);
});

describe("US 2.1: Búsqueda de Turnos Disponibles (RF-05)", () => {
  it("CA1: filtra por profesional específico (doctorId)", async () => {
    await buscarTurnosDisponibles({ doctorId: "doc-1" });
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        doctorId: "doc-1",
        status: AppointmentState.RESERVADO,
      }),
      include: {
        doctor: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        startsAt: "asc",
      },
    });
  });

  it("CA1: filtra por especialidad", async () => {
    await buscarTurnosDisponibles({ specialty: Specialty.PEDIATRA });
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        doctor: { specialty: Specialty.PEDIATRA },
        status: AppointmentState.RESERVADO,
      }),
      include: {
        doctor: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        startsAt: "asc",
      },
    });
  });

  it("CA1: filtra por fecha (inicio y fin del día)", async () => {
    await buscarTurnosDisponibles({ date: "2026-10-25" });
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        status: AppointmentState.RESERVADO,
        startsAt: {
          gte: new Date("2026-10-25T00:00:00.000Z"),
          lte: new Date("2026-10-25T23:59:59.999Z"),
        },
      }),
      include: {
        doctor: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        startsAt: "asc",
      },
    });
  });

  it("CA1: combina filtros de profesional, especialidad y fecha estrictamente", async () => {
    await buscarTurnosDisponibles({
      doctorId: "doc-2",
      specialty: Specialty.CLINICO,
      date: "2026-10-26",
    });
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: {
        status: AppointmentState.RESERVADO,
        doctorId: "doc-2",
        doctor: { specialty: Specialty.CLINICO },
        startsAt: {
          gte: new Date("2026-10-26T00:00:00.000Z"),
          lte: new Date("2026-10-26T23:59:59.999Z"),
        },
      },
      include: {
        doctor: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        startsAt: "asc",
      },
    });
  });
});
