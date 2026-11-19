import type { NotifyCancellationResult } from "@/lib/appointment-notifications";

/**
 * RF-10: el Server Action corre en el servidor, así que su `console.info` no
 * llega a DevTools. Replicamos acá el mail simulado para poder verlo al cancelar
 * desde el navegador, también en preview/despliegue (decisión del equipo).
 * Ojo: expone el correo del paciente en la consola del navegador.
 */
export function logCancelEmailInBrowser(
  notification: NotifyCancellationResult | undefined,
  appointmentId?: string,
): void {
  // Huella diagnóstica: permite distinguir "el handler no corrió" (no aparece
  // nada), de "la acción no devolvió notification" (build/action stale), de un
  // problema del transporte. Se imprime siempre, también en despliegue.
  console.info(
    `[email:console] cancelarTurno${appointmentId ? ` (${appointmentId})` : ""} →`,
    notification ?? "sin notification (reiniciá next dev y recargá)",
  );

  if (!notification || !notification.sent) {
    if (!notification) return;
    if ("skipped" in notification) {
      console.warn(`[email:console] Aviso de cancelación omitido: ${notification.skipped}`);
    } else {
      console.warn(`[email:console] No se pudo enviar el aviso: ${notification.error}`);
    }
    return;
  }

  if (!notification.preview) return; // se envió por Resend: no hay nada simulado
  const { to, subject, text } = notification.preview;
  console.info(
    [
      "[email:console] Envio simulado (sin RESEND_API_KEY) — copia del navegador",
      `  to: ${to}`,
      `  subject: ${subject}`,
      "  text:",
      text.replace(/^/gm, "    "),
    ].join("\n"),
  );
}
