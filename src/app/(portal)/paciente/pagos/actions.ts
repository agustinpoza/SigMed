"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePaciente } from "@/lib/actor-guard";
import { isUuid } from "@/lib/forms";
import {
  PAYMENT_RESULTS,
  PaymentRuleError,
  registrarPagoConsulta,
  type PaymentResult,
} from "@/lib/payments";

export type PaymentFormState = {
  error?: string;
};

export async function pagarConsulta(
  _previous: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  const guard = await requirePaciente();

  if ("error" in guard) {
    return { error: guard.error };
  }

  const appointmentId = String(formData.get("appointmentId") ?? "").trim();
  const result = String(formData.get("result") ?? "").trim();

  if (!isUuid(appointmentId)) {
    return { error: "El turno indicado no es válido." };
  }

  if (!PAYMENT_RESULTS.includes(result as PaymentResult)) {
    return { error: "Seleccioná un resultado de pago válido." };
  }

  try {
    await registrarPagoConsulta({
      appointmentId,
      patientId: guard.actor.id,
      actorId: guard.actor.id,
      result: result as PaymentResult,
    });
  } catch (error) {
    if (error instanceof PaymentRuleError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath("/paciente/pagos");
  revalidatePath(`/paciente/pagos/${appointmentId}`);

  redirect(`/paciente/pagos?pago=${result.toLowerCase()}`);
}
