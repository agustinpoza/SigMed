import { afterEach, describe, expect, it, vi } from "vitest";
import { EmailError, sendEmail } from "@/lib/email";

const message = {
  to: "paciente@example.com",
  subject: "Turno cancelado",
  html: "<p>Hola</p>",
  text: "Hola",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("RF-10: transporte de email", () => {
  it("escribe en consola cuando no hay RESEND_API_KEY", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    const result = await sendEmail(message);

    expect(result).toEqual({ provider: "console" });
    expect(info).toHaveBeenCalledOnce();
    expect(info.mock.calls[0][0]).toContain("paciente@example.com");
    expect(info.mock.calls[0][0]).toContain("Turno cancelado");
  });

  it("usa la API de Resend cuando hay key", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_123");
    vi.stubEnv("MAIL_FROM", "SigMed <turnos@sigmed.test>");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "email_1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendEmail(message);

    expect(result).toEqual({ provider: "resend", id: "email_1" });
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer re_test_123");

    const body = JSON.parse(init.body);
    expect(body.from).toBe("SigMed <turnos@sigmed.test>");
    expect(body.to).toEqual(["paciente@example.com"]);
    expect(body.subject).toBe("Turno cancelado");
    expect(body.html).toBe("<p>Hola</p>");
    expect(body.text).toBe("Hola");
  });

  it("lanza EmailError cuando Resend responde con error", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_123");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("dominio no verificado", { status: 422 })),
    );

    await expect(sendEmail(message)).rejects.toBeInstanceOf(EmailError);
  });

  it("lanza EmailError si no puede contactar a Resend", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_123");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("sin red")));

    await expect(sendEmail(message)).rejects.toThrow(/sin red/);
  });
});
