import { beforeEach, describe, expect, it, vi } from "vitest";
import { StockRuleError } from "@/lib/stock";
import { createStockMovement, getLotAvailability } from "./actions";
import { LOT_AVAILABILITY_ERROR } from "@/lib/stock-messages";

const mocks = vi.hoisted(() => ({ register: vi.fn(), guard: vi.fn(), revalidate: vi.fn(), lot: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { vaccineLot: { findUnique: mocks.lot } } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/actor-guard", () => ({ requireEnfermeraOAdministrador: mocks.guard }));
vi.mock("@/lib/stock", () => ({
  registerStockMovement: mocks.register,
  StockRuleError: class extends Error {
    constructor(readonly fields: Record<string, string>) { super("Regla de stock"); }
  },
}));

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    vaccineId: "11111111-1111-4111-8111-111111111111",
    movementType: "AJUSTE",
    operation: "SUMAR",
    lotNumber: "LOTE-PRUEBA",
    expiresAt: "",
    quantity: "5",
    reason: "Corrección de conteo",
    ...overrides,
  })) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.guard.mockResolvedValue({ actor: { id: "operador-identificado" } });
  mocks.register.mockResolvedValue(undefined);
  mocks.lot.mockResolvedValue({ quantityAvailable: 37 });
});

describe("DU-07: disponibilidad del lote", () => {
  it("consulta la clave vacuna + número de lote y devuelve únicamente quantityAvailable", async () => {
    const vaccineId = String(form().get("vaccineId"));
    expect(await getLotAvailability(vaccineId, "  LOTE-PRUEBA  ")).toEqual({ status: "available", quantityAvailable: 37 });
    expect(mocks.lot).toHaveBeenCalledExactlyOnceWith({
      where: { vaccineId_lotNumber: { vaccineId, lotNumber: "LOTE-PRUEBA" } },
      select: { quantityAvailable: true },
    });
  });
  it("distingue un lote existente con cero dosis de un lote no encontrado", async () => {
    mocks.lot.mockResolvedValueOnce({ quantityAvailable: 0 }).mockResolvedValueOnce(null);
    const vaccineId = String(form().get("vaccineId"));
    expect(await getLotAvailability(vaccineId, "LOTE-PRUEBA")).toEqual({ status: "available", quantityAvailable: 0 });
    expect(await getLotAvailability(vaccineId, "OTRO-LOTE")).toEqual({ status: "not-found" });
  });
  it("un fallo de consulta devuelve un error, sin cantidad y sin exponer el error SQL", async () => {
    mocks.lot.mockRejectedValue(new Error("Detalle interno de la base"));
    expect(await getLotAvailability(String(form().get("vaccineId")), "LOTE-PRUEBA"))
      .toEqual({ status: "error", message: LOT_AVAILABILITY_ERROR });
  });
  it("aplica el guard existente antes de consultar", async () => {
    mocks.guard.mockResolvedValue({ error: "Operación no autorizada." });
    expect(await getLotAvailability(String(form().get("vaccineId")), "LOTE-PRUEBA"))
      .toEqual({ status: "error", message: "Operación no autorizada." });
    expect(mocks.lot).not.toHaveBeenCalled();
  });
  it.each([["inválida", "LOTE"], ["11111111-1111-4111-8111-111111111111", "   "]])(
    "una clave incompleta o inválida no consulta ni informa cero (%s, %s)", async (vaccineId, lotNumber) => {
      expect((await getLotAvailability(vaccineId, lotNumber)).status).toBe("error");
      expect(mocks.lot).not.toHaveBeenCalled();
      expect(mocks.guard).not.toHaveBeenCalled();
    },
  );
});

describe("SIG-MEJ-03.2: entrada positiva y signo interno", () => {
  it.each([
    ["SUMAR", 5, "Se sumaron 5 dosis al lote."],
    ["DESCONTAR", -5, "Se descontaron 5 dosis del lote."],
  ])("convierte %s una sola vez y mantiene tipo AJUSTE", async (operation, quantity, message) => {
    const data = form({ operation });
    const result = await createStockMovement({}, data);
    expect(result).toEqual({ message });
    expect(mocks.register).toHaveBeenCalledExactlyOnceWith({
      vaccineId: data.get("vaccineId"),
      movementType: "AJUSTE",
      lotNumber: "LOTE-PRUEBA",
      expiresAt: null,
      quantity,
      reason: "Corrección de conteo",
      actorId: "operador-identificado",
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/enfermera/inventario");
  });

  it("mantiene INGRESO positivo sin exigir motivo u operación", async () => {
    const result = await createStockMovement({}, form({ movementType: "INGRESO", operation: "", reason: "", expiresAt: "2040-12-31" }));
    expect(result.message).toBe("Se registró un ingreso de 5 unidades.");
    expect(mocks.register).toHaveBeenCalledWith(expect.objectContaining({ movementType: "INGRESO", quantity: 5, reason: null, expiresAt: new Date("2040-12-31T00:00:00Z") }));
  });

  it.each(["SUMAR", "DESCONTAR", "INVÁLIDA"])("rechaza operación %s en un ingreso", async (operation) => {
    const result = await createStockMovement({}, form({ movementType: "INGRESO", operation }));
    expect(result.errors?.operation).toBeTruthy();
    expect(mocks.register).not.toHaveBeenCalled();
  });

  it.each(["", "EGRESO", "-1"])("exige operación válida de ajuste (%s)", async (operation) => {
    const result = await createStockMovement({}, form({ operation }));
    expect(result.errors?.operation).toBe("Seleccioná Sumar dosis o Descontar dosis.");
    expect(result.values?.operation).toBe(operation);
    expect(mocks.register).not.toHaveBeenCalled();
  });

  it.each([
    ["AJUSTE", "0"], ["AJUSTE", "-5"], ["AJUSTE", "1.5"],
    ["AJUSTE", ""], ["AJUSTE", "1e3"], ["AJUSTE", "2147483648"],
    ["AJUSTE", "999999999999999999999999"],
    ["INGRESO", "0"], ["INGRESO", "-5"], ["INGRESO", "1.5"],
    ["INGRESO", ""], ["INGRESO", "2147483648"],
  ])("rechaza cantidad inválida de %s (%s) antes de escribir", async (movementType, quantity) => {
    const result = await createStockMovement({}, form({ movementType, quantity, operation: movementType === "AJUSTE" ? "DESCONTAR" : "" }));
    expect(result.errors?.quantity).toBeTruthy();
    expect(result.values?.quantity).toBe(quantity);
    expect(mocks.register).not.toHaveBeenCalled();
    expect(mocks.guard).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("admite el límite técnico del INTEGER sin desbordar el signo", async () => {
    await createStockMovement({}, form({ operation: "DESCONTAR", quantity: "2147483647" }));
    expect(mocks.register).toHaveBeenCalledWith(expect.objectContaining({ quantity: -2147483647 }));
  });

  it("mantiene obligatorio el motivo del ajuste", async () => {
    const result = await createStockMovement({}, form({ reason: "   " }));
    expect(result.errors?.reason).toBeTruthy();
    expect(mocks.register).not.toHaveBeenCalled();
  });

  it("conserva cantidad positiva y operación cuando el dominio rechaza el lote", async () => {
    mocks.register.mockRejectedValue(new StockRuleError({ lotNumber: "El lote no existe." }));
    const result = await createStockMovement({}, form({ operation: "DESCONTAR" }));
    expect(result.errors).toEqual({ lotNumber: "El lote no existe." });
    expect(result.values).toMatchObject({ quantity: "5", operation: "DESCONTAR", reason: "Corrección de conteo", lotNumber: "LOTE-PRUEBA" });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("al reintentar calcula desde la nueva entrada, sin invertir un signo anterior", async () => {
    mocks.register.mockRejectedValueOnce(new StockRuleError({ lotNumber: "Revisá el lote." })).mockResolvedValueOnce(undefined);
    const data = form({ operation: "DESCONTAR" });
    const first = await createStockMovement({}, data);
    await createStockMovement(first, data);
    expect(mocks.register).toHaveBeenCalledTimes(2);
    expect(mocks.register.mock.calls.map(([input]) => input.quantity)).toEqual([-5, -5]);
  });

  it("no escribe cuando el guard existente rechaza al actor", async () => {
    mocks.guard.mockResolvedValue({ error: "Operación no autorizada." });
    const result = await createStockMovement({}, form({ operation: "DESCONTAR" }));
    expect(result.message).toBe("Operación no autorizada.");
    expect(result.values?.quantity).toBe("5");
    expect(mocks.register).not.toHaveBeenCalled();
  });

  it("no incorpora los tipos de salida por turno a este formulario", async () => {
    const result = await createStockMovement({}, form({ movementType: "ASIGNACION_TURNO" }));
    expect(result.errors?.movementType).toBeTruthy();
    expect(mocks.register).not.toHaveBeenCalled();
  });
});
