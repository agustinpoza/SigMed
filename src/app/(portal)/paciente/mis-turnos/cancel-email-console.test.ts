import { afterEach, describe, expect, it, vi } from "vitest";
import { logCancelEmailInBrowser } from "./cancel-email-console";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("RF-10: copia del mail simulado en la consola del navegador", () => {
  it("muestra destinatario, asunto y cuerpo con el prefijo [email:console]", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    logCancelEmailInBrowser({
      sent: true,
      provider: "console",
      preview: {
        to: "ana@example.com",
        subject: "Turno cancelado: Lunes, 12 de octubre",
        text: "Hola Ana,\nTu turno fue cancelado.",
      },
    });

    expect(info).toHaveBeenCalledTimes(2);
    const output = info.mock.calls
      .map((args: unknown[]) => String(args[0]))
      .find((line) => line.includes("Envio simulado"));
    expect(output).toBeDefined();
    expect(output).toContain("[email:console] Envio simulado");
    expect(output).toContain("to: ana@example.com");
    expect(output).toContain("subject: Turno cancelado: Lunes, 12 de octubre");
    expect(output).toContain("    Hola Ana,");
    expect(output).toContain("    Tu turno fue cancelado.");
  });

  it("no expone el correo del paciente en producción", () => {
    vi.stubEnv("NODE_ENV", "production");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    logCancelEmailInBrowser({
      sent: true,
      provider: "console",
      preview: {
        to: "ana@example.com",
        subject: "Turno cancelado",
        text: "Hola Ana",
      },
    });

    expect(info).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it("aviso en consola cuando el aviso se omite o falla", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    logCancelEmailInBrowser({ sent: false, skipped: "not-found" });
    logCancelEmailInBrowser({ sent: false, error: "Resend caído" });

    expect(warn).toHaveBeenCalledTimes(2);
    expect(String(warn.mock.calls[0][0])).toContain("not-found");
    expect(String(warn.mock.calls[1][0])).toContain("Resend caído");
  });

  it("deja la huella diagnóstica pero no expone el mail si se envió por Resend o no hay notificación", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    logCancelEmailInBrowser({ sent: true, provider: "resend" }, "turno-1");
    logCancelEmailInBrowser(undefined, "turno-2");

    expect(info).toHaveBeenCalledTimes(2);
    expect(String(info.mock.calls[0][0])).toContain("cancelarTurno (turno-1)");
    expect(String(info.mock.calls[1][1])).toContain("sin notification");
    expect(info.mock.calls.some((args: unknown[]) => String(args[0]).includes("Envio simulado"))).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });
});
