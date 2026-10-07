"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  type FieldErrors,
  hasErrors,
  isUuid,
  optionalInt,
  requiredDate,
  requiredInt,
  requiredText,
} from "@/lib/forms";
import { StockRuleError, createVaccineWithInitialLot } from "@/lib/stock";
import { requireEnfermeraOAdministrador } from "@/lib/actor-guard";

export type VaccineFormState = {
  errors?: FieldErrors;
  message?: string;
  values?: Record<string, string>;
};

function rawValue(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export async function createVaccine(
  _previous: VaccineFormState,
  formData: FormData,
): Promise<VaccineFormState> {
  const errors: FieldErrors = {};

  const name = requiredText(formData.get("name"), "name", errors, "El nombre");
  const lotNumber = requiredText(
    formData.get("lotNumber"),
    "lotNumber",
    errors,
    "El lote",
  );
  const expiresAt = requiredDate(
    formData.get("expiresAt"),
    "expiresAt",
    errors,
    "La fecha de vencimiento",
  );
  const quantity = requiredInt(
    formData.get("quantity"),
    "quantity",
    errors,
    "La cantidad",
    { min: 1 },
  );
  const criticalLevel = optionalInt(
    formData.get("criticalLevel"),
    "criticalLevel",
    errors,
    "El nivel critico de stock",
    { min: 0 },
  );

  const values = {
    name,
    lotNumber,
    expiresAt: rawValue(formData, "expiresAt"),
    quantity: rawValue(formData, "quantity"),
    criticalLevel: rawValue(formData, "criticalLevel"),
  };

  if (hasErrors(errors) || expiresAt === null || quantity === null) {
    return { errors, values };
  }

  const guard = await requireEnfermeraOAdministrador();

  if ("error" in guard) {
    return { message: guard.error, values };
  }

  try {
    await createVaccineWithInitialLot({
      name,
      criticalLevel,
      lotNumber,
      expiresAt,
      quantity,
      actorId: guard.actor.id,
    });
  } catch (error) {
    if (error instanceof StockRuleError) {
      return { errors: error.fields, values };
    }

    throw error;
  }

  revalidatePath("/enfermera/vacunas");

  return { message: `${name} se cargo con ${quantity} unidades.` };
}

export async function updateVaccineCriticalLevel(
  _previous: VaccineFormState,
  formData: FormData,
): Promise<VaccineFormState> {
  const errors: FieldErrors = {};

  const vaccineId = requiredText(
    formData.get("vaccineId"),
    "vaccineId",
    errors,
    "La vacuna",
  );

  if (vaccineId && !isUuid(vaccineId)) {
    errors.vaccineId = "La vacuna seleccionada no es valida.";
  }

  const criticalLevel = optionalInt(
    formData.get("criticalLevel"),
    "criticalLevel",
    errors,
    "El nivel critico de stock",
    { min: 0 },
  );

  if (hasErrors(errors)) {
    return { errors };
  }

  const guard = await requireEnfermeraOAdministrador();

  if ("error" in guard) {
    return { message: guard.error };
  }

  const vaccine = await prisma.vaccine.findFirst({
    where: { id: vaccineId },
    select: { id: true },
  });

  if (!vaccine) {
    return { errors: { vaccineId: "La vacuna ya no existe." } };
  }

  await prisma.vaccine.update({
    where: { id: vaccineId },
    data: { criticalLevel },
  });

  revalidatePath("/enfermera/vacunas");

  return {
    message:
      criticalLevel === null
        ? "Nivel critico desactivado."
        : `Nivel critico fijado en ${criticalLevel}.`,
  };
}