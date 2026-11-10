import { describe, expect, it } from "vitest";
import {
  defaultReportPeriod,
  formatReportDate,
  parseIsoDate,
  reportPeriodBounds,
  resolveReportPeriod,
} from "./report-period";

const NOW = new Date("2026-10-15T15:00:00-03:00");

describe("período de reportes", () => {
  it("acepta solo fechas calendario reales", () => {
    expect(parseIsoDate("2026-10-31")).toBe("2026-10-31");
    expect(parseIsoDate("2026-02-30")).toBeNull();
    expect(parseIsoDate("31/10/2026")).toBeNull();
    expect(parseIsoDate(undefined)).toBeNull();
  });

  it("por defecto va del primer día del mes hasta hoy, en hora de Argentina", () => {
    expect(defaultReportPeriod(NOW)).toEqual({ desde: "2026-10-01", hasta: "2026-10-15" });
    // 01:00 UTC del 1/11 todavía es 31/10 en Argentina.
    expect(defaultReportPeriod(new Date("2026-11-01T01:00:00Z"))).toEqual({
      desde: "2026-10-01",
      hasta: "2026-10-31",
    });
  });

  it("sin parámetros usa el período por defecto", () => {
    expect(resolveReportPeriod(undefined, undefined, NOW)).toEqual({
      ok: true,
      period: { desde: "2026-10-01", hasta: "2026-10-15" },
    });
  });

  it("rechaza fechas inválidas o incompletas", () => {
    expect(resolveReportPeriod("2026-13-01", "2026-10-31", NOW).ok).toBe(false);
    expect(resolveReportPeriod("2026-10-01", undefined, NOW).ok).toBe(false);
  });

  it("rechaza un rango invertido y acepta un único día", () => {
    expect(resolveReportPeriod("2026-10-31", "2026-10-01", NOW).ok).toBe(false);
    expect(resolveReportPeriod("2026-10-05", "2026-10-05", NOW).ok).toBe(true);
  });

  it("los límites cubren los días completos en hora de Argentina", () => {
    const { start, end } = reportPeriodBounds({ desde: "2026-10-01", hasta: "2026-10-31" });
    expect(start.toISOString()).toBe("2026-10-01T03:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-01T03:00:00.000Z");
  });

  it("formatea la fecha como DD/MM/YYYY", () => {
    expect(formatReportDate("2026-10-01")).toBe("01/10/2026");
  });
});
