// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StockRuleError } from "@/lib/stock";
import { MovementForm } from "./movement-form";

// Se usa la acción real; solo se simulan identidad, mutación del dominio y caché.
const mocks = vi.hoisted(() => ({ register: vi.fn(), guard: vi.fn(), revalidate: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/actor-guard", () => ({ requireEnfermeraOAdministrador: mocks.guard }));
vi.mock("@/lib/stock", () => ({
  registerStockMovement: mocks.register,
  StockRuleError: class extends Error {
    constructor(readonly fields: Record<string, string>) { super("Regla de stock"); }
  },
}));

const vaccineId = "11111111-1111-4111-8111-111111111111";
function setup() {
  render(<MovementForm vaccines={[{ id: vaccineId, name: "Vacuna de prueba" }]} />);
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
