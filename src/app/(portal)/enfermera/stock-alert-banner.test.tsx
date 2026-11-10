// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { LowStockVaccine } from "@/lib/stock-alerts";
import { StockAlertBanner } from "./stock-alert-banner";

const alert: LowStockVaccine = {
  vaccineId: "11111111-1111-4111-8111-111111111111",
  vaccineName: "Vacuna con alerta",
  stock: 1,
  criticalLevel: 3,
  alertGeneratedAt: new Date("2026-11-10T12:00:00Z"),
};

afterEach(cleanup);

describe("US-3.4: banner de stock crítico del inicio", () => {
  it("resume las vacunas comprometidas y enlaza al panel de inventario", () => {
    render(<StockAlertBanner alerts={[alert]} />);

    expect(
      screen.getByRole("heading", { name: "Alerta de stock crítico" }),
    ).toBeTruthy();
    expect(
      screen.getByText("1 vacuna está por debajo de su umbral crítico."),
    ).toBeTruthy();
    expect(
      screen.getByText("Vacuna con alerta: 1 en stock, umbral 3."),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Ver detalle de stock" })
        .getAttribute("href"),
    ).toBe("/enfermera/inventario#alertas");
  });

  it("usa el plural cuando hay más de una vacuna", () => {
    render(
      <StockAlertBanner
        alerts={[
          alert,
          {
            ...alert,
            vaccineId: "22222222-2222-4222-8222-222222222222",
            vaccineName: "Otra vacuna",
            stock: 0,
            criticalLevel: 2,
          },
        ]}
      />,
    );

    expect(
      screen.getByText("2 vacunas están por debajo de su umbral crítico."),
    ).toBeTruthy();
  });

  it("no se muestra cuando no hay alertas activas", () => {
    const { container } = render(<StockAlertBanner alerts={[]} />);

    expect(container.firstChild).toBeNull();
  });
});
