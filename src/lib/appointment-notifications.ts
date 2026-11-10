// src/lib/appointment-notifications.ts
// RF-10 (US-2.7): notificacion al paciente cuando se cancela un turno.
//
// Esta pieza NO implementa la cancelacion: queda lista para que el flujo que la
// implemente (paciente, medico o administrador) la invoque despues de persistir
// el estado CANCELADO. Es agnostica al rol que cancela: siempre avisa al
// paciente titular del turno.
//
// Uso previsto desde la futura accion de cancelacion:
//
//   await notifyAppointmentCancelled(appointmentId);
//
// El envio es best-effort: nunca lanza, para que un problema de email no
// revierta ni rompa la cancelacion ya confirmada.

import { AppointmentState } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { reprogramUrl } from "@/lib/app-url";
import { buildCancellationEmail } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";

export type NotifyCancellationResult =
  | { sent: true; provider: "resend" | "console" }
  | { sent: false; skipped: "not-found" | "not-cancelled" }
  | { sent: false; error: string };

function errorDetail(error: unknown): string {
  return error instanceof Error ? error.message : "error desconocido";
}

export async function notifyAppointmentCancelled(
  appointmentId: string,
): Promise<NotifyCancellationResult> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { include: { profile: true } },
        doctor: { include: { profile: true } },
      },
    });

    if (!appointment) {
      return { sent: false, skipped: "not-found" };
    }

    if (appointment.status !== AppointmentState.CANCELADO) {
      // Evita mandar un aviso de cancelacion por un turno que sigue activo.
      return { sent: false, skipped: "not-cancelled" };
    }

    const patient = appointment.patient.profile;
    const doctor = appointment.doctor.profile;

    const email = buildCancellationEmail({
      patientName: patient.firstName,
      doctorName: `Dr. ${doctor.lastName}, ${doctor.firstName}`,
      specialty: appointment.doctor.speciality,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      reason: appointment.cancellationReason,
      reprogramUrl: reprogramUrl(appointment.id),
    });

    const result = await sendEmail({
      to: patient.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    return { sent: true, provider: result.provider };
  } catch (error) {
    const detail = errorDetail(error);
    console.error(
      `[RF-10] No se pudo enviar el email de cancelacion del turno ${appointmentId}: ${detail}`,
    );
    return { sent: false, error: detail };
  }
}
