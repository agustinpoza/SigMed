"use server";

import { revalidatePath } from "next/cache";
import { prisma, isUniqueViolation } from "@/lib/db";
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
import { AuditAction, AuditEntity } from "@/generated/prisma/enums";
import { buildExerciseAudit, insertAudit } from "@/lib/audit";

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
  const laboratory = requiredText(
    formData.get("laboratory"),
    "laboratory",
    errors,
    "El laboratorio u origen",
  );
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
    laboratory: rawValue(formData, "laboratory"),
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

  const audit = buildExerciseAudit(guard.context, {
    action: AuditAction.CREAR_VACUNA,
    entity: AuditEntity.VACUNA,
    details: { nombre: name, lote: lotNumber, cantidad: quantity },
  });

  try {
    await createVaccineWithInitialLot({
      name,
      laboratory,
      criticalLevel,
      lotNumber,
      expiresAt,
      quantity,
      actorId: guard.actor.id,
      audit,
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

export async function updateVaccine(
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

  const name = requiredText(formData.get("name"), "name", errors, "El nombre");
  const laboratory = requiredText(
    formData.get("laboratory"),
    "laboratory",
    errors,
    "El laboratorio u origen",
  );
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

  const audit = buildExerciseAudit(guard.context, {
    action: AuditAction.ACTUALIZAR_VACUNA,
    entity: AuditEntity.VACUNA,
    entityId: vaccine.id,
    details: { nombre: name },
  });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.vaccine.update({
        where: { id: vaccineId },
        data: { name, laboratory, criticalLevel },
      });

      if (audit) {
        await insertAudit(tx, audit);
      }
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        errors: { name: "Ya existe una vacuna con ese nombre en el catalogo." },
      };
    }

    throw error;
  }

  revalidatePath("/enfermera/vacunas");

  return {
    message:
      criticalLevel === null
        ? "Vacuna actualizada."
        : `Vacuna actualizada con nivel critico ${criticalLevel}.`,
  };
}