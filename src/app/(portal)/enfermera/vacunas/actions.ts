"use server";

import { revalidatePath } from "next/cache";
import { prisma, isUniqueViolation } from "@/lib/db";
import { getCurrentActor } from "@/lib/dev-actor";
import {
  type FieldErrors,
  hasErrors,
  requiredDate,
  requiredInt,
  requiredText,
} from "@/lib/forms";
import { MovementType } from "@/generated/prisma/enums";

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
  const actor = await getCurrentActor();

  const errors: FieldErrors = {};

  const name = requiredText(formData.get("name"), "name", errors, "El nombre");
  const laboratory = requiredText(
    formData.get("laboratory"),
    "laboratory",
    errors,
    "El laboratorio",
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
  const criticalStockLevel = requiredInt(
    formData.get("criticalStockLevel"),
    "criticalStockLevel",
    errors,
    "El nivel critico de stock",
    { min: 0 },
  );

  const values = {
    name,
    laboratory,
    lotNumber,
    expiresAt: rawValue(formData, "expiresAt"),
    quantity: rawValue(formData, "quantity"),
    criticalStockLevel: rawValue(formData, "criticalStockLevel"),
  };

  if (
    hasErrors(errors) ||
    expiresAt === null ||
    quantity === null ||
    criticalStockLevel === null
  ) {
    return { errors, values };
  }

  if (!actor) {
    return {
      message:
        "No hay actor definido, asi que el movimiento no se puede atribuir. Selecciona uno en la barra superior.",
      values,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const vaccine = await tx.vaccine.create({
        data: { name, laboratory, criticalStockLevel },
      });

      const lot = await tx.vaccineLot.create({
        data: {
          vaccineId: vaccine.id,
          lotNumber,
          expiresAt,
          quantityAvailable: quantity,
        },
      });

      await tx.stockMovement.create({
        data: {
          vaccineId: vaccine.id,
          vaccineLotId: lot.id,
          movementType: MovementType.INGRESO,
          quantity,
          reason: "Alta inicial en el catalogo",
          actorId: actor.id,
        },
      });
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        errors: { name: "Ya existe una vacuna con ese nombre en el catalogo." },
        values,
      };
    }

    throw error;
  }

  revalidatePath("/enfermera/vacunas");

  return { message: `${name} se cargo con ${quantity} unidades.` };
}
