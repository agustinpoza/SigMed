"use server";

import { revalidatePath } from "next/cache";
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
import { requireEnfermeraOAdministrador } from "@/lib/actor-guard";
import { MAX_STOCK_INPUT_QUANTITY } from "@/lib/stock-input";
import { prisma } from "@/lib/db";
import { LOT_AVAILABILITY_ERROR } from "@/lib/stock-messages";

export type MovementFormState = {
  errors?: FieldErrors;
  message?: string;
  values?: Record<string, string>;
};

export type LotAvailabilityResult =
  | { status: "available"; quantityAvailable: number }
  | { status: "not-found" }
  | { status: "error"; message: string };

export async function getLotAvailability(
  vaccineId: string,
  lotNumber: string,
): Promise<LotAvailabilityResult> {
  if (typeof vaccineId !== "string" || !isUuid(vaccineId) ||
      typeof lotNumber !== "string" || !lotNumber.trim()) {
    return { status: "error", message: "Seleccioná una vacuna válida e ingresá el número de lote." };
  }
  try {
    const guard = await requireEnfermeraOAdministrador();
    if ("error" in guard) return { status: "error", message: guard.error };
    const lot = await prisma.vaccineLot.findUnique({
      where: { vaccineId_lotNumber: { vaccineId, lotNumber: lotNumber.trim() } },
      select: { quantityAvailable: true },
    });
    return lot ? { status: "available", quantityAvailable: lot.quantityAvailable } : { status: "not-found" };
  } catch {
    return { status: "error", message: LOT_AVAILABILITY_ERROR };
  }
}

const ALLOWED_TYPES: MovementType[] = [
  MovementType.INGRESO,
  MovementType.AJUSTE,
];

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
  const reason = rawValue(formData, "reason");

  if (vaccineId && !isUuid(vaccineId)) {
    errors.vaccineId = "La vacuna seleccionada no es valida.";
  }

  const rawType = rawValue(formData, "movementType");
  const operation = rawValue(formData, "operation");
  const movementType = ALLOWED_TYPES.find((type) => type === rawType);

  if (!movementType) {
    errors.movementType = "Selecciona un tipo de movimiento valido.";
  }

  let quantity: number | null = null;

  if (movementType) {
    quantity = requiredInt(
      formData.get("quantity"),
      "quantity",
      errors,
      "La cantidad",
      { min: 1, max: MAX_STOCK_INPUT_QUANTITY },
    );
  }

  if (movementType === MovementType.AJUSTE) {
    if (operation !== "SUMAR" && operation !== "DESCONTAR") {
      errors.operation = "Seleccioná Sumar dosis o Descontar dosis.";
    }
    requiredText(formData.get("reason"), "reason", errors, "El motivo");
  } else if (movementType === MovementType.INGRESO && operation) {
    errors.operation = "La operación de ajuste no corresponde a un ingreso.";
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
    operation,
    lotNumber,
    expiresAt: expiresAtRaw,
    quantity: rawValue(formData, "quantity"),
    reason,
  };

  if (hasErrors(errors) || !movementType || quantity === null) {
    return { errors, values };
  }

  const guard = await requireEnfermeraOAdministrador();

  if ("error" in guard) {
    return { message: guard.error, values };
  }

  try {
    // La UI siempre envía una magnitud positiva; el dominio mantiene cantidades con signo.
    const signedQuantity = movementType === MovementType.AJUSTE && operation === "DESCONTAR"
      ? -quantity
      : quantity;
    await registerStockMovement({
      vaccineId,
      lotNumber,
      expiresAt,
      quantity: signedQuantity,
      movementType,
      reason: reason || null,
      actorId: guard.actor.id,
    });
  } catch (error) {
    if (error instanceof StockRuleError) {
      return { errors: error.fields, values };
    }

    throw error;
  }

  revalidatePath("/enfermera/inventario");

  return {
    message:
      movementType === MovementType.INGRESO
        ? `Se registró un ingreso de ${quantity} unidades.`
        : operation === "DESCONTAR"
          ? `Se descontaron ${quantity} dosis del lote.`
          : `Se sumaron ${quantity} dosis al lote.`,
  };
}
