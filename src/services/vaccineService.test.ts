import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
  insertAudit: vi.fn(),
  buildExerciseAudit: vi.fn(() => null),
  requireGuard: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    vaccine: { findUnique: mocks.findUnique, update: mocks.update },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/lib/audit", () => ({
  buildExerciseAudit: mocks.buildExerciseAudit,
  insertAudit: mocks.insertAudit,
}));

vi.mock("@/lib/actor-guard", () => ({
  requireEnfermeraOAdministrador: mocks.requireGuard,
}));

import {
  getCriticalLevel,
  parseCriticalLevelInput,
  setCriticalLevel,
  VaccineServiceError,
} from "./vaccineService";
import { UserRole } from "@/generated/prisma/enums";

const vid = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
    fn({ vaccine: { update: mocks.update } }),
  );
  mocks.requireGuard.mockResolvedValue({
    actor: { id: "u1", role: UserRole.ENFERMERA },
    context: { real: { id: "u1" }, effective: { role: UserRole.ENFERMERA }, acting: null },
  });
});

describe("US 3.3: vaccineService", () => {
  it("parseCriticalLevelInput acepta null/vacío/enteros >= 0 y rechaza inválidos", () => {
    expect(parseCriticalLevelInput(null)).toBeNull();
    expect(parseCriticalLevelInput("")).toBeNull();
    expect(parseCriticalLevelInput(0)).toBe(0);
    expect(parseCriticalLevelInput("15")).toBe(15);
    expect(() => parseCriticalLevelInput(-1)).toThrow(VaccineServiceError);
    expect(() => parseCriticalLevelInput("-2")).toThrow(VaccineServiceError);
    expect(() => parseCriticalLevelInput("abc")).toThrow(VaccineServiceError);
  });

  it("getCriticalLevel devuelve el umbral o 404", async () => {
    mocks.findUnique.mockResolvedValue({ criticalLevel: 10 });
    await expect(getCriticalLevel(vid)).resolves.toBe(10);
    mocks.findUnique.mockResolvedValue(null);
    await expect(getCriticalLevel(vid)).rejects.toMatchObject({ status: 404 });
  });

  it("setCriticalLevel valida y persiste", async () => {
    mocks.findUnique.mockResolvedValue({ id: vid });
    await expect(setCriticalLevel(vid, 5)).resolves.toBe(5);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: vid },
      data: { criticalLevel: 5 },
    });
  });
});
