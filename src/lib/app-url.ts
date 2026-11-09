// src/lib/app-url.ts
// RF-10 (US-2.7): URLs absolutas para los enlaces que salen por email.
// Sin dependencias de Next, igual que doctor-agenda.ts, para poder testearse
// como logica pura.

const DEFAULT_APP_URL = "http://localhost:3000";

/**
 * Base publica de la app. Prioridad:
 *   1. APP_URL (explicita, sirve para produccion y para tests)
 *   2. VERCEL_URL (la define Vercel en cada deploy; no incluye protocolo)
 *   3. localhost (desarrollo)
 */
export function appBaseUrl(): string {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const withProtocol = /^https?:\/\//i.test(vercel) ? vercel : `https://${vercel}`;
    return withProtocol.replace(/\/+$/, "");
  }

  return DEFAULT_APP_URL;
}

/** Link que lleva al paciente a buscar otro horario para el turno cancelado. */
export function reprogramUrl(appointmentId: string): string {
  return `${appBaseUrl()}/paciente/turnos?reprogramar=${encodeURIComponent(appointmentId)}`;
}
