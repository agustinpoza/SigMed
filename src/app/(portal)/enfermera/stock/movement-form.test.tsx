// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StockRuleError } from "@/lib/stock";
import { MovementForm } from "./movement-form";

// Acción real; se simulan identidad, mutación, lectura de disponibilidad y caché.
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

const vaccineId = "11111111-1111-4111-8111-111111111111";
const otherVaccineId = "22222222-2222-4222-8222-222222222222";
function setup() {
  return render(<MovementForm vaccines={[{ id: vaccineId, name: "Vacuna de prueba" }, { id: otherVaccineId, name: "Otra vacuna" }]} />);
}
function input(label: string) { return screen.getByLabelText(label) as HTMLInputElement; }
function selectType(type: string) {
  fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: type } });
}
function fillAdjustment(operation?: string) {
  fireEvent.change(screen.getByLabelText("Seleccionar Vacuna del Catálogo"), { target: { value: vaccineId } });
  selectType("AJUSTE");
  fireEvent.change(input("Lote"), { target: { value: "LOTE-PRUEBA" } });
  fireEvent.change(input("Cantidad"), { target: { value: "5" } });
  fireEvent.change(input("Motivo"), { target: { value: "Corrección de conteo" } });
  if (operation) fireEvent.click(screen.getByRole("radio", { name: operation }));
}
function submit() { fireEvent.click(screen.getByRole("button", { name: "Registrar Movimiento" })); }

beforeEach(() => {
  vi.resetAllMocks();
  mocks.guard.mockResolvedValue({ actor: { id: "operador-identificado" } });
  mocks.register.mockResolvedValue(undefined);
  mocks.lot.mockResolvedValue({ quantityAvailable: 37 });
});

describe("DU-07: indicador de disponibilidad", () => {
  it("oculta el indicador mientras falta vacuna o lote", () => {
    setup();
    expect(screen.queryByText("Stock disponible del lote")).toBeNull();
    fireEvent.change(input("Lote"), { target: { value: "LOTE-PRUEBA" } });
    expect(screen.queryByText("Stock disponible del lote")).toBeNull();
    expect(mocks.lot).not.toHaveBeenCalled();
  });
  it("muestra la cantidad consultada y diferencia el cero real del lote no encontrado", async () => {
    mocks.lot.mockResolvedValueOnce({ quantityAvailable: 0 }).mockResolvedValueOnce(null);
    setup(); fillAdjustment("Descontar dosis");
    expect(await screen.findByText("0 dosis")).toBeTruthy();
    fireEvent.change(input("Lote"), { target: { value: "NO-EXISTE" } });
    expect(screen.queryByText("0 dosis")).toBeNull();
    expect(await screen.findByText("No se encontró ese lote para la vacuna seleccionada.")).toBeTruthy();
  });
  it("un error de consulta no muestra cero y permite reintentar", async () => {
    mocks.lot.mockRejectedValueOnce(new Error("Sin conexión")).mockResolvedValueOnce({ quantityAvailable: 9 });
    setup(); fillAdjustment("Descontar dosis");
    expect((await screen.findByRole("alert")).textContent).toBe("No se pudo consultar la disponibilidad del lote. Intentá nuevamente.");
    expect(screen.queryByText("0 dosis")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar consulta de stock" }));
    expect(await screen.findByText("9 dosis")).toBeTruthy();
  });
  it("cambiar vacuna relee el mismo número de lote sin conservar la cantidad anterior", async () => {
    mocks.lot.mockResolvedValueOnce({ quantityAvailable: 37 }).mockResolvedValueOnce({ quantityAvailable: 12 });
    setup(); fillAdjustment("Sumar dosis");
    await screen.findByText("37 dosis");
    fireEvent.change(screen.getByLabelText("Seleccionar Vacuna del Catálogo"), { target: { value: otherVaccineId } });
    expect(screen.queryByText("37 dosis")).toBeNull();
    expect(await screen.findByText("12 dosis")).toBeTruthy();
    expect(mocks.lot.mock.calls[1][0].where.vaccineId_lotNumber).toEqual({ vaccineId: otherVaccineId, lotNumber: "LOTE-PRUEBA" });
  });
  it.each(["respuesta", "rechazo"])("descarta la consulta tardía del lote anterior (%s)", async (outcome) => {
    let resolve!: (value: { quantityAvailable: number }) => void;
    let reject!: (error: Error) => void;
    const old = new Promise<{ quantityAvailable: number }>((res, rej) => { resolve = res; reject = rej; });
    mocks.lot.mockReturnValueOnce(old).mockResolvedValueOnce({ quantityAvailable: 12 });
    setup(); fillAdjustment("Sumar dosis");
    await waitFor(() => expect(mocks.lot).toHaveBeenCalledTimes(1));
    fireEvent.change(input("Lote"), { target: { value: "LOTE-NUEVO" } });
    await screen.findByText("12 dosis");
    await act(async () => { if (outcome === "respuesta") resolve({ quantityAvailable: 99 }); else reject(new Error("Consulta anterior")); });
    expect(screen.getByText("12 dosis")).toBeTruthy();
    expect(screen.queryByText("99 dosis")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
  it("relee tras un descuento rechazado conservando el formulario y su operación", async () => {
    mocks.lot.mockResolvedValueOnce({ quantityAvailable: 3 }).mockResolvedValueOnce({ quantityAvailable: 1 });
    mocks.register.mockRejectedValue(new StockRuleError({ quantity: "No hay suficientes dosis disponibles en este lote." }));
    setup(); fillAdjustment("Descontar dosis");
    await screen.findByText("3 dosis"); submit();
    await screen.findByText("No hay suficientes dosis disponibles en este lote.");
    expect(screen.queryByText("3 dosis")).toBeNull();
    expect(await screen.findByText("1 dosis")).toBeTruthy();
    expect(input("Cantidad").value).toBe("5");
    expect((screen.getByRole("radio", { name: "Descontar dosis" }) as HTMLInputElement).checked).toBe(true);
  });
  it("el éxito limpia el indicador y volver a identificar el lote obtiene su saldo actualizado", async () => {
    mocks.lot.mockResolvedValueOnce({ quantityAvailable: 37 }).mockResolvedValueOnce({ quantityAvailable: 32 });
    setup(); fillAdjustment("Descontar dosis");
    await screen.findByText("37 dosis"); submit();
    await screen.findByText("Se descontaron 5 dosis del lote.");
    expect(screen.queryByText("Stock disponible del lote")).toBeNull();
    fillAdjustment("Descontar dosis");
    expect(await screen.findByText("32 dosis")).toBeTruthy();
  });
  it("cancelar retira el indicador e ignora una consulta todavía pendiente", async () => {
    let resolve!: (value: { quantityAvailable: number }) => void;
    mocks.lot.mockReturnValue(new Promise<{ quantityAvailable: number }>((done) => { resolve = done; }));
    setup(); fillAdjustment("Sumar dosis");
    await waitFor(() => expect(mocks.lot).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await act(async () => resolve({ quantityAvailable: 37 }));
    expect(screen.queryByText("Stock disponible del lote")).toBeNull();
    expect(screen.queryByText("37 dosis")).toBeNull();
  });
});
afterEach(cleanup);

describe("SIG-MEJ-03.1/03.2: formulario integrado con la acción", () => {
  it("mantiene INGRESO y una cantidad positiva sin controles de descuento", () => {
    setup();
    expect((screen.getByLabelText("Tipo de movimiento") as HTMLSelectElement).value).toBe("INGRESO");
    expect(screen.queryByRole("radio")).toBeNull();
    expect(input("Cantidad").min).toBe("1");
    expect(input("Cantidad").step).toBe("1");
    expect(input("Cantidad").max).toBe("2147483647");
    expect(input("Cantidad").getAttribute("aria-describedby")).toBe("quantity-hint");
  });

  it("ofrece Sumar/Descontar sin imponer una operación preseleccionada", () => {
    setup();
    selectType("AJUSTE");
    expect((screen.getByRole("radio", { name: "Sumar dosis" }) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole("radio", { name: "Descontar dosis" }) as HTMLInputElement).checked).toBe(false);
    expect(input("Fecha de vencimiento").disabled).toBe(true);
    expect(screen.queryByText(/usa negativo|Puede ser negativa/)).toBeNull();
  });

  it("exige elegir operación y anuncia su error sin perder los datos", async () => {
    setup();
    fillAdjustment();
    submit();
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Seleccioná Sumar dosis o Descontar dosis.");
    expect(input("Lote").value).toBe("LOTE-PRUEBA");
    expect(input("Cantidad").value).toBe("5");
    expect(mocks.register).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("radio", { name: "Sumar dosis" }));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it.each([
    ["Sumar dosis", 5, "Se sumaron 5 dosis al lote."],
    ["Descontar dosis", -5, "Se descontaron 5 dosis del lote."],
  ])("envía cantidad positiva con %s y la acción produce el delta correcto", async (operation, signedQuantity, message) => {
    setup();
    fillAdjustment(operation);
    expect(input("Cantidad").value).toBe("5");
    submit();
    await screen.findByText(message);
    expect(mocks.register).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ quantity: signedQuantity, movementType: "AJUSTE", lotNumber: "LOTE-PRUEBA" }));
    expect(input("Cantidad").value).toBe("");
    expect((screen.getByLabelText("Tipo de movimiento") as HTMLSelectElement).value).toBe("INGRESO");
  });

  it("mantiene vacuna, lote, motivo, magnitud y operación tras error y reintento", async () => {
    mocks.register.mockRejectedValueOnce(new StockRuleError({ lotNumber: "El lote no existe." })).mockResolvedValueOnce(undefined);
    setup();
    fillAdjustment("Descontar dosis");
    submit();
    await screen.findByText("El lote no existe.");
    expect((screen.getByLabelText("Seleccionar Vacuna del Catálogo") as HTMLSelectElement).value).toBe(vaccineId);
    expect(input("Lote").value).toBe("LOTE-PRUEBA");
    expect(input("Motivo").value).toBe("Corrección de conteo");
    expect(input("Cantidad").value).toBe("5");
    expect((screen.getByRole("radio", { name: "Descontar dosis" }) as HTMLInputElement).checked).toBe(true);
    fireEvent.change(input("Lote"), { target: { value: "LOTE-CORREGIDO" } });
    submit();
    await screen.findByText("Se descontaron 5 dosis del lote.");
    expect(mocks.register.mock.calls.map(([movement]) => movement.quantity)).toEqual([-5, -5]);
    expect(mocks.register.mock.calls[1][0].lotNumber).toBe("LOTE-CORREGIDO");
  });

  it("al cambiar a ingreso no envía una operación de descuento oculta", async () => {
    setup();
    fillAdjustment("Descontar dosis");
    selectType("INGRESO");
    expect(screen.queryByRole("radio")).toBeNull();
    fireEvent.change(input("Fecha de vencimiento"), { target: { value: "2040-12-31" } });
    submit();
    await screen.findByText("Se registró un ingreso de 5 unidades.");
    expect(mocks.register).toHaveBeenCalledWith(expect.objectContaining({ movementType: "INGRESO", quantity: 5 }));
  });

  it("volver a ajuste después de un cambio de tipo requiere elegir otra vez", async () => {
    setup();
    fillAdjustment("Descontar dosis");
    selectType("INGRESO");
    selectType("AJUSTE");
    expect((screen.getByRole("radio", { name: "Descontar dosis" }) as HTMLInputElement).checked).toBe(false);
    submit();
    await screen.findByText("Seleccioná Sumar dosis o Descontar dosis.");
    expect(mocks.register).not.toHaveBeenCalled();
  });

  it("rechaza una cantidad negativa manipulada sin convertirla a suma", async () => {
    setup();
    fillAdjustment("Descontar dosis");
    fireEvent.change(input("Cantidad"), { target: { value: "-5" } });
    submit();
    await screen.findByText("La cantidad debe ser mayor o igual a 1.");
    expect(input("Cantidad").value).toBe("-5");
    expect(mocks.register).not.toHaveBeenCalled();
  });

  it("cancelar limpia valores, operación y errores de un envío anterior", async () => {
    setup();
    fillAdjustment();
    submit();
    await screen.findByText("Seleccioná Sumar dosis o Descontar dosis.");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(input("Lote").value).toBe("");
    expect(input("Cantidad").value).toBe("");
    expect(input("Motivo").value).toBe("");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
  });

  it("bloquea dobles envíos mientras espera el resultado", async () => {
    let resolve!: () => void;
    mocks.register.mockReturnValue(new Promise<void>((done) => { resolve = done; }));
    setup();
    fillAdjustment("Sumar dosis");
    submit();
    await screen.findByRole("button", { name: "Registrando..." });
    expect(input("Cantidad").matches(":disabled")).toBe(true);
    expect((screen.getByRole("button", { name: "Cancelar" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.submit(input("Cantidad").closest("form")!);
    expect(mocks.register).toHaveBeenCalledTimes(1);
    await act(async () => resolve());
    await screen.findByText("Se sumaron 5 dosis al lote.");
  });
});
