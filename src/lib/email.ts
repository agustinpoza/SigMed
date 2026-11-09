// src/lib/email.ts
// RF-10 (US-2.7): transporte de email.
//
// Se usa la API HTTP de Resend con `fetch` para no sumar dependencias. Si no
// hay RESEND_API_KEY (desarrollo, tests o previews sin configurar) el mensaje
// se escribe en la consola: la aplicacion sigue funcionando y el flujo se puede
// probar sin credenciales ni dominio verificado.

export class EmailError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "EmailError";
  }
}

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult = {
  provider: "resend" | "console";
  id?: string;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "SigMed <onboarding@resend.dev>";
const TIMEOUT_MS = 10_000;

function sender(): string {
  return process.env.MAIL_FROM?.trim() || DEFAULT_FROM;
}

function resendApiKey(): string | null {
  return process.env.RESEND_API_KEY?.trim() || null;
}

function logToConsole(message: EmailMessage) {
  // En desarrollo/tests el mail queda en el log con el mismo contenido que se
  // habria enviado. No se imprime la API key.
  console.info(
    [
      "[email:console] Envio simulado (sin RESEND_API_KEY)",
      `  to: ${message.to}`,
      `  subject: ${message.subject}`,
      "  text:",
      message.text.replace(/^/gm, "    "),
    ].join("\n"),
  );
}

/**
 * Envia un email por Resend o, si no hay credenciales, lo escribe en consola.
 * Lanza EmailError cuando Resend responde con error o no se puede contactar.
 */
export async function sendEmail(message: EmailMessage): Promise<SendEmailResult> {
  const apiKey = resendApiKey();

  if (!apiKey) {
    logToConsole(message);
    return { provider: "console" };
  }

  let response: Response;
  try {
    response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender(),
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "error desconocido";
    throw new EmailError(`No se pudo contactar a Resend: ${detail}`);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new EmailError(
      `Resend respondio ${response.status}${body ? `: ${body.slice(0, 500)}` : ""}`,
      response.status,
    );
  }

  const data = (await response.json().catch(() => ({}))) as { id?: string };
  return { provider: "resend", id: data.id };
}
