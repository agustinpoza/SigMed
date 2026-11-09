import { afterEach, describe, expect, it, vi } from "vitest";
import { appBaseUrl, reprogramUrl } from "@/lib/app-url";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("RF-10: URLs de reprogramacion", () => {
  it("usa APP_URL cuando esta configurada y le saca la barra final", () => {
    vi.stubEnv("APP_URL", "https://sigmed.example/");
    expect(appBaseUrl()).toBe("https://sigmed.example");
  });

  it("usa VERCEL_URL con https cuando no hay APP_URL", () => {
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("VERCEL_URL", "sigmed.vercel.app");
    expect(appBaseUrl()).toBe("https://sigmed.vercel.app");
  });

  it("cae a localhost en desarrollo", () => {
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(appBaseUrl()).toBe("http://localhost:3000");
  });

  it("arma el link de reprogramacion con el id codificado", () => {
    vi.stubEnv("APP_URL", "https://sigmed.example");
    expect(reprogramUrl("turno 1")).toBe(
      "https://sigmed.example/paciente/turnos?reprogramar=turno%201",
    );
  });
});
