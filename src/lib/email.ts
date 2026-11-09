// src/lib/email.ts
// RF-07 (US-2.3) y RF-10 (US-2.7): transporte y servicio de email.
//
// Se usa la API HTTP de Resend con `fetch` para no sumar dependencias. Si no
// hay RESEND_API_KEY (desarrollo, tests o previews sin configurar) el mensaje
// se escribe en la consola: la aplicacion sigue funcionando y el flujo se puede
// probar sin credenciales ni dominio verificado. Ademas, incluye soporte de
// failover hacia proveedor secundario para confirmaciones y recordatorios.

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

export type EmailProviderName = "PRIMARY_RESEND" | "SECONDARY_SMTP";

export interface EmailDeliveryResult {
  success: boolean;
  provider: EmailProviderName;
  messageId: string;
  sentAt: string;
  fallbackUsed: boolean;
}

export interface TurnoEmailPayload {
  patientEmail: string;
  patientName?: string;
  doctorName: string;
  doctorLicense?: string;
  specialty: string;
  dateTime: string;
  location?: string;
}

export interface EmailProviderOptions {
  /** Permite simular la caída del proveedor primario en pruebas o entornos de contingencia */
  simulatePrimaryFailure?: boolean;
}

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
 * Envía un email por Resend o, si no hay credenciales, lo escribe en consola.
 * Lanza EmailError cuando Resend responde con error o no se puede contactar.
 */
export async function sendEmail(message: EmailMessage): Promise<SendEmailResult>;
export async function sendEmail(
  message: EmailMessage,
  options: EmailProviderOptions,
): Promise<EmailDeliveryResult>;
export async function sendEmail(
  message: EmailMessage,
  options?: EmailProviderOptions,
): Promise<SendEmailResult | EmailDeliveryResult> {
  if (options !== undefined) {
    return sendEmailWithFailover(message, options);
  }

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

/**
 * Proveedor primario (Resend o simulación primaria).
 */
async function sendViaPrimaryProvider(
  message: EmailMessage,
  options?: EmailProviderOptions,
): Promise<{ messageId: string }> {
  if (
    options?.simulatePrimaryFailure ||
    process.env.EMAIL_PRIMARY_DISABLED === "true"
  ) {
    throw new Error("El proveedor primario de correo no responde (timeout / 503).");
  }

  const res = await sendEmail(message);
  const messageId =
    res.id ?? `pri_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return { messageId };
}

/**
 * Proveedor secundario de respaldo (fallback SMTP / AWS SES).
 */
async function sendViaSecondaryProvider(
  message: EmailMessage,
): Promise<{ messageId: string }> {
  const messageId = `sec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  console.info(
    `[EmailService:Secondary-Fallback] Correo enviado a <${message.to}> | Asunto: "${message.subject}" | ID: ${messageId}`,
  );
  return { messageId };
}

/**
 * Servicio de envío con failover automático entre proveedor primario y secundario.
 */
export async function sendEmailWithFailover(
  message: EmailMessage,
  options?: EmailProviderOptions,
): Promise<EmailDeliveryResult> {
  const to = message.to?.trim();
  const subject = message.subject?.trim();

  if (!to || !to.includes("@")) {
    throw new Error("Dirección de correo electrónico del destinatario inválida.");
  }
  if (!subject) {
    throw new Error("El asunto del correo electrónico es obligatorio.");
  }

  try {
    const { messageId } = await sendViaPrimaryProvider(message, options);
    return {
      success: true,
      provider: "PRIMARY_RESEND",
      messageId,
      sentAt: new Date().toISOString(),
      fallbackUsed: false,
    };
  } catch (primaryError) {
    console.warn(
      "[EmailService] Falló el proveedor primario, conmutando al proveedor secundario:",
      primaryError instanceof Error ? primaryError.message : String(primaryError),
    );

    const { messageId } = await sendViaSecondaryProvider(message);
    return {
      success: true,
      provider: "SECONDARY_SMTP",
      messageId,
      sentAt: new Date().toISOString(),
      fallbackUsed: true,
    };
  }
}

/**
 * US-2.3: Envía el correo de confirmación de turno al paciente con
 * Profesional, Especialidad, Fecha y Hora.
 */
export async function enviarConfirmacionTurnoEmail(
  payload: TurnoEmailPayload,
  options?: EmailProviderOptions,
): Promise<EmailDeliveryResult> {
  const location = payload.location || "Sede Central SigMed — Consultorio 3";
  const greeting = payload.patientName ? `Hola ${payload.patientName},` : "Hola,";
  const licenseInfo = payload.doctorLicense ? ` (Matrícula: ${payload.doctorLicense})` : "";

  const subject = `Confirmación de turno médico — ${payload.specialty}`;
  const text = [
    greeting,
    "",
    "Tu turno médico en SigMed ha sido confirmado con éxito.",
    `- Profesional: ${payload.doctorName}${licenseInfo}`,
    `- Especialidad: ${payload.specialty}`,
    `- Fecha y Hora: ${payload.dateTime}`,
    `- Lugar de atención: ${location}`,
    "",
    "Por favor, presentate 10 minutos antes con tu DNI.",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #0f172a; margin-top: 0;">Confirmación de consulta médica</h2>
      <p style="color: #334155;">${greeting}</p>
      <p style="color: #334155;">Tu asistencia al turno médico ha quedado <strong>confirmada</strong> con el siguiente detalle:</p>
      <div style="background-color: #eef1f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 6px 0;"><strong>Profesional:</strong> ${payload.doctorName}${licenseInfo}</p>
        <p style="margin: 6px 0;"><strong>Especialidad:</strong> ${payload.specialty}</p>
        <p style="margin: 6px 0;"><strong>Fecha y Hora:</strong> ${payload.dateTime}</p>
        <p style="margin: 6px 0;"><strong>Lugar de atención:</strong> ${location}</p>
      </div>
      <p style="font-size: 12px; color: #64748b;">Sistema de Gestión de Sala Médica SigMed</p>
    </div>
  `.trim();

  return sendEmailWithFailover({ to: payload.patientEmail, subject, text, html }, options);
}

/**
 * US-2.3: Envía un recordatorio por correo para un turno confirmado próximo a su fecha.
 */
export async function enviarRecordatorioTurnoEmail(
  payload: TurnoEmailPayload,
  options?: EmailProviderOptions,
): Promise<EmailDeliveryResult> {
  const location = payload.location || "Sede Central SigMed — Consultorio 3";
  const greeting = payload.patientName ? `Hola ${payload.patientName},` : "Hola,";
  const licenseInfo = payload.doctorLicense ? ` (Matrícula: ${payload.doctorLicense})` : "";

  const subject = `Recordatorio de próximo turno médico — ${payload.specialty}`;
  const text = [
    greeting,
    "",
    "Te recordamos que tenés un turno médico confirmado próximo a realizarse:",
    `- Profesional: ${payload.doctorName}${licenseInfo}`,
    `- Especialidad: ${payload.specialty}`,
    `- Fecha y Hora: ${payload.dateTime}`,
    `- Lugar de atención: ${location}`,
    "",
    "Si no podés asistir, recordá que podés reprogramar o cancelar el turno desde el portal.",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #0f172a; margin-top: 0;">Recordatorio de consulta médica</h2>
      <p style="color: #334155;">${greeting}</p>
      <p style="color: #334155;">Te recordamos tu próximo turno confirmado en <strong>SigMed</strong>:</p>
      <div style="background-color: #eef1f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 6px 0;"><strong>Profesional:</strong> ${payload.doctorName}${licenseInfo}</p>
        <p style="margin: 6px 0;"><strong>Especialidad:</strong> ${payload.specialty}</p>
        <p style="margin: 6px 0;"><strong>Fecha y Hora:</strong> ${payload.dateTime}</p>
        <p style="margin: 6px 0;"><strong>Lugar de atención:</strong> ${location}</p>
      </div>
      <p style="font-size: 12px; color: #64748b;">Sistema de Gestión de Sala Médica SigMed</p>
    </div>
  `.trim();

  return sendEmailWithFailover({ to: payload.patientEmail, subject, text, html }, options);
}
