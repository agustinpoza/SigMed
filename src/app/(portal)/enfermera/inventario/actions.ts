"use server";

import { revalidatePath } from "next/cache";
import { getCurrentActor } from "@/lib/dev-actor";
import {
  type FieldErrors,
  hasErrors,
  isUuid,
  requiredDate,
  requiredInt,
  requiredText,
} from "@/lib/forms";
import { StockRuleError, registerStockMovement } from "@/lib/stock";
import { MovementType } from "@/generated/prisma/enums";

export type MovementFormState = {
  errors?: FieldErrors;
  message?: string;
  values?: Record<string, string>;
};

const ALLOWED_TYPES: MovementType[] = [MovementType.INGRESO, MovementType.EGRESO];

function rawValue(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export async function createStockMovement(
  _previous: MovementFormState,
  formData: FormData,
): Promise<MovementFormState> {
  const errors: FieldErrors = {};

  const vaccineId = requiredText(
    formData.get("vaccineId"),
    "vaccineId",
    errors,
    "La vacuna",
  );
  const lotNumber = requiredText(
    formData.get("lotNumber"),
    "lotNumber",
    errors,
    "El lote",
  );
  const quantity = requiredInt(
    formData.get("quantity"),
    "quantity",
    errors,
    "La cantidad",
    { min: 1 },
  );
  const reason = rawValue(formData, "reason");

  const rawType = rawValue(formData, "movementType");
  const movementType = ALLOWED_TYPES.find((type) => type === rawType);

  if (!movementType) {
    errors.movementType = "El tipo de movimiento debe ser Ingreso o Egreso.";
  }

  if (vaccineId && !isUuid(vaccineId)) {
    errors.vaccineId = "La vacuna seleccionada no es valida.";
  }

  const expiresAtRaw = rawValue(formData, "expiresAt");
  const expiresAt =
    movementType === MovementType.INGRESO && expiresAtRaw
      ? requiredDate(
          formData.get("expiresAt"),
          "expiresAt",
          errors,
          "La fecha de vencimiento",
        )
      : null;

  const values = {
    vaccineId,
    movementType: rawType,
    lotNumber,
    expiresAt: expiresAtRaw,
    quantity: rawValue(formData, "quantity"),
    reason,
  };

  if (hasErrors(errors) || !movementType || quantity === null) {
    return { errors, values };
  }

  const actor = await getCurrentActor();

  if (!actor) {
    return {
      message:
        "No hay actor definido, asi que el movimiento no se puede atribuir. Selecciona uno en la barra superior.",
      values,
    };
  }

  try {
    await registerStockMovement({
      vaccineId,
      lotNumber,
      expiresAt,
      quantity,
      movementType,
      reason: reason || null,
      actorId: actor.id,
    });
  } catch (error) {
    if (error instanceof StockRuleError) {
      return { errors: error.fields, values };
    }

    throw error;
  }

  revalidatePath("/enfermera/inventario");

  return {
    message: `Se registró ${movementType === "INGRESO" ? "un ingreso" : "un egreso"} de ${quantity} unidades.`,
  };
}
