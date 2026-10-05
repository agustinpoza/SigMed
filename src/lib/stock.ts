import { prisma, isUniqueViolation } from "@/lib/db";
import type { FieldErrors } from "@/lib/forms";
import { MovementType } from "@/generated/prisma/enums";

export class StockRuleError extends Error {
  constructor(readonly fields: FieldErrors) {
    super("regla de stock");
  }
}

export type NewVaccineInput = {
  name: string;
  criticalLevel: number | null;
  lotNumber: string;
  expiresAt: Date;
  quantity: number;
  actorId: string;
};

export type StockMovementInput = {
  vaccineId: string;
  lotNumber: string;
  expiresAt: Date | null;
  quantity: number;
  movementType: MovementType;
  reason: string | null;
  actorId: string;
};

/**
 * Alta de vacuna con su lote inicial. El stock del lote no se escribe: lo
 * calcula el trigger fn_stock_movimiento_post al asentar el movimiento de
 * ingreso, que ademas dispara o resuelve la alerta de stock critico.
 */
export async function createVaccineWithInitialLot(input: NewVaccineInput) {
  try {
    await prisma.$transaction(async (tx) => {
      const vaccine = await tx.vaccine.create({
        data: {
          name: input.name,
          criticalLevel: input.criticalLevel,
          createdById: input.actorId,
        },
      });

      const lot = await tx.vaccineLot.create({
        data: {
          vaccineId: vaccine.id,
          lotNumber: input.lotNumber,
          expiresAt: input.expiresAt,
          registeredById: input.actorId,
        },
      });

      await tx.stockMovement.create({
        data: {
          lotId: lot.id,
          type: MovementType.INGRESO,
          quantity: input.quantity,
          reason: "Alta inicial en el catalogo",
          actorId: input.actorId,
        },
      });
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new StockRuleError({
        name: "Ya existe una vacuna con ese nombre en el catalogo.",
      });
    }

    throw error;
  }
}

/**
 * Asienta un movimiento de stock.
 *
 * docs/BD.md no define un tipo de egreso libre: la salida de dosis ocurre solo
 * por `asignacion_turno` y `devolucion_turno`, que exigen un turno de
 * vacunacion. `ajuste` queda para correcciones tecnicas justificadas y sigue
 * bloqueado desde la interfaz.
 */
export async function registerStockMovement(input: StockMovementInput) {
  if (input.movementType !== MovementType.INGRESO) {
    throw new StockRuleError({
      movementType:
        "Solo se admiten ingresos desde esta pantalla. Las salidas de stock se generan al aprobar un turno de vacunacion.",
    });
  }

  await prisma.$transaction(async (tx) => {
    const vaccine = await tx.vaccine.findFirst({
      where: { id: input.vaccineId },
      select: { id: true },
    });

    if (!vaccine) {
      throw new StockRuleError({
        vaccineId: "La vacuna no existe.",
      });
    }

    const lot = await tx.vaccineLot.findUnique({
      where: {
        vaccineId_lotNumber: {
          vaccineId: input.vaccineId,
          lotNumber: input.lotNumber,
        },
      },
      select: { id: true },
    });

    let lotId: string;

    if (lot) {
      lotId = lot.id;
    } else {
      if (!input.expiresAt) {
        throw new StockRuleError({
          expiresAt:
            "Es la primera vez que aparece este lote, asi que la fecha de vencimiento es obligatoria.",
        });
      }

      const created = await tx.vaccineLot.create({
        data: {
          vaccineId: input.vaccineId,
          lotNumber: input.lotNumber,
          expiresAt: input.expiresAt,
          registeredById: input.actorId,
        },
      });

      lotId = created.id;
    }

    await tx.stockMovement.create({
      data: {
        lotId,
        type: input.movementType,
        quantity: input.quantity,
        reason: input.reason,
        actorId: input.actorId,
      },
    });
  });
}