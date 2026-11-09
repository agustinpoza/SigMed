// src/lib/email-templates.ts
// RF-10 (US-2.7): plantilla de email de cancelacion de turno.
// Logica pura: recibe los datos y devuelve asunto, HTML y texto plano. No toca
// la base ni depende de Next, asi se puede testear sin infraestructura.

import type { Specialty } from "@/generated/prisma/enums";

const SPECIALTY_LABELS: Record<string, string> = {
  CLINICO: "Clínica médica",
  PEDIATRA: "Pediatría",
  TRAUMATOLOGO: "Traumatología",
};

const AR_LOCALE = "es-AR";
const AR_TIME_ZONE = "America/Argentina/Buenos_Aires";

export type CancellationEmailInput = {
  patientName: string;
  doctorName: string;
  specialty: Specialty | string;
  startsAt: Date;
  endsAt?: Date;
  reason: string | null;
  reprogramUrl: string;
};

export type BuiltEmail = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(date: Date): string {
  const formatted = new Intl.DateTimeFormat(AR_LOCALE, {
    timeZone: AR_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(AR_LOCALE, {
    timeZone: AR_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function specialtyLabel(specialty: Specialty | string): string {
  return SPECIALTY_LABELS[specialty] ?? specialty;
}

/** "Lunes, 12 de octubre de 2026 de 15:30 a 16:00" (hora de Argentina). */
function scheduleLine(input: CancellationEmailInput): string {
  const day = formatDate(input.startsAt);
  const start = formatTime(input.startsAt);

  if (!input.endsAt) return `${day} a las ${start}`;
  return `${day} de ${start} a ${formatTime(input.endsAt)}`;
}

export function buildCancellationEmail(input: CancellationEmailInput): BuiltEmail {
  const patient = input.patientName.trim() || "paciente";
  const doctor = input.doctorName.trim() || "el profesional";
  const specialty = specialtyLabel(input.specialty);
  const when = scheduleLine(input);
  const reason = input.reason?.trim() || null;

  const subject = `Turno cancelado: ${when}`;
  const reasonText = reason ?? "Sin motivo informado.";
  const reasonHtml = reason ? escapeHtml(reason) : "Sin motivo informado.";

  const text = [
    `Hola ${patient},`,
    "",
    `Tu turno con ${doctor} (${specialty}) fue cancelado.`,
    "",
    `Fecha y hora: ${when}`,
    `Motivo: ${reasonText}`,
    "",
    "Podés buscar otro horario desde el siguiente enlace:",
    input.reprogramUrl,
    "",
    "Si ya reprogramaste el turno, ignorá este mensaje.",
    "",
    "Sala Médica - SigMed",
  ].join("\n");

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:24px;">
      <tr>
        <td>
          <h1 style="margin:0 0 16px;font-size:20px;">Turno cancelado</h1>
          <p style="margin:0 0 12px;">Hola ${escapeHtml(patient)},</p>
          <p style="margin:0 0 16px;">
            Tu turno con <strong>${escapeHtml(doctor)}</strong> (${escapeHtml(specialty)}) fue cancelado.
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 16px;font-size:14px;">
            <tr>
              <td style="padding:4px 12px 4px 0;color:#52525b;">Fecha y hora</td>
              <td>${escapeHtml(when)}</td>
            </tr>
            <tr>
              <td style="padding:4px 12px 4px 0;color:#52525b;">Motivo</td>
              <td>${reasonHtml}</td>
            </tr>
          </table>
          <p style="margin:0 0 16px;">Podés buscar otro horario desde el siguiente enlace:</p>
          <p style="margin:0 0 24px;">
            <a href="${escapeHtml(input.reprogramUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none;">
              Reprogramar turno
            </a>
          </p>
          <p style="margin:0;font-size:12px;color:#71717a;">
            Si ya reprogramaste el turno, ignorá este mensaje.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
