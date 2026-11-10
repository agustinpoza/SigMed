"use server";

import { revalidatePath } from "next/cache";
import { requireAdministrador } from "@/lib/actor-guard";
import { isUuid } from "@/lib/forms";
import {
  condonarDeudaInasistencia,
  cobrarDeudaInasistencia,
} from "@/lib/payments";

function paymentId(formData: FormData) {
  const value = String(formData.get("paymentId") ?? "").trim();

  if (!isUuid(value)) {
    throw new Error("El cargo por inasistencia indicado no es válido.");
  }

  return value;
}

export async function registrarCobroInasistencia(formData: FormData) {
  const guard = await requireAdministrador();

  if ("error" in guard) {
    throw new Error(guard.error);
  }

  await cobrarDeudaInasistencia(paymentId(formData));
  revalidatePath("/admin/inasistencias");
}

export async function condonarInasistencia(formData: FormData) {
  const guard = await requireAdministrador();

  if ("error" in guard) {
    throw new Error(guard.error);
  }

  await condonarDeudaInasistencia(paymentId(formData));
  revalidatePath("/admin/inasistencias");
}
