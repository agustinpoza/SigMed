// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { LowStockVaccine } from "@/lib/stock-alerts";
import { StockAlertsPanel } from "./stock-alerts-panel";

const alerts: LowStockVaccine[] = [
  {
    vaccineId: "11111111-1111-4111-8111-111111111111",
    vaccineName: "Vacuna con alerta",
    stock: 1,
    criticalLevel: 3,
    alertGeneratedAt: new Date("2026-11-10T12:00:00Z"),
  },
  {
    vaccineId: "22222222-2222-4222-8222-222222222222",
    vaccineName: "Vacuna sin alerta emitida",
    stock: 0,
    criticalLevel: 2,
    alertGeneratedAt: null,
  },
];

afterEach(cleanup);

describe("US-3.4: panel de stock crítico", () => {
  it("muestra stock, umbral y la fecha de la alerta activa", () => {
    render(<StockAlertsPanel alerts={alerts} />);

    expect(
      screen.getByRole("heading", { name: "Vacunas con stock crítico" }),
    ).toBeTruthy();
    expect(screen.getByText("2 vacunas")).toBeTruthy();

    const withAlert = screen.getByRole("row", { name: /Vacuna con alerta/ });
    expect(within(withAlert).getByText("1")).toBeTruthy();
    expect(within(withAlert).getByText("3")).toBeTruthy();
    expect(within(withAlert).getByText(/Activa desde/)).toBeTruthy();

    const withoutAlert = screen.getByRole("row", {
      name: /Vacuna sin alerta emitida/,
    });
    expect(within(withoutAlert).getByText("Sin alerta activa")).toBeTruthy();
  });

  it("indica cuando no hay vacunas por debajo del umbral", () => {
    render(<StockAlertsPanel alerts={[]} />);

    expect(screen.getByText("Sin alertas")).toBeTruthy();
    expect(
      screen.getByText("No hay vacunas por debajo de su umbral crítico."),
    ).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });
});
