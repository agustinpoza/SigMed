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
  laboratory: string;
  criticalStockLevel: number;
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

export async function createVaccineWithInitialLot(input: NewVaccineInput) {
  try {
    await prisma.$transaction(async (tx) => {
      const vaccine = await tx.vaccine.create({
        data: {
          name: input.name,
          laboratory: input.laboratory,
          criticalStockLevel: input.criticalStockLevel,
        },
      });

      const lot = await tx.vaccineLot.create({
        data: {
          vaccineId: vaccine.id,
          lotNumber: input.lotNumber,
          expiresAt: input.expiresAt,
          quantityAvailable: input.quantity,
        },
      });

      await tx.stockMovement.create({
        data: {
          vaccineId: vaccine.id,
          vaccineLotId: lot.id,
          movementType: MovementType.INGRESO,
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

export async function registerStockMovement(input: StockMovementInput) {
  if (input.movementType !== MovementType.INGRESO && input.movementType !== MovementType.EGRESO) {
    throw new StockRuleError({
      movementType: "Solo se admiten ingresos y egresos.",
    });
  }

  await prisma.$transaction(async (tx) => {
    const vaccine = await tx.vaccine.findFirst({
      where: { id: input.vaccineId, isActive: true },
      select: { id: true },
    });

    if (!vaccine) {
      throw new StockRuleError({
        vaccineId: "La vacuna no existe o esta dada de baja.",
      });
    }

    const lot = await tx.vaccineLot.findUnique({
      where: {
        vaccine_lot_number_unique: {
          vaccineId: input.vaccineId,
          lotNumber: input.lotNumber,
        },
      },
      select: { id: true, quantityAvailable: true },
    });

    let vaccineLotId: string;

    if (input.movementType === MovementType.EGRESO) {
      if (!lot) {
        throw new StockRuleError({
          lotNumber: `La vacuna seleccionada no tiene el lote ${input.lotNumber}.`,
        });
      }

      const updated = await tx.vaccineLot.updateMany({
        where: { id: lot.id, quantityAvailable: { gte: input.quantity } },
        data: { quantityAvailable: { decrement: input.quantity } },
      });

      if (updated.count === 0) {
        throw new StockRuleError({
          quantity: `Stock insuficiente: el lote ${input.lotNumber} tiene ${lot.quantityAvailable} unidades.`,
        });
      }

      vaccineLotId = lot.id;
    } else if (lot) {
      await tx.vaccineLot.update({
        where: { id: lot.id },
        data: { quantityAvailable: { increment: input.quantity } },
      });

      vaccineLotId = lot.id;
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
          quantityAvailable: input.quantity,
        },
      });

      vaccineLotId = created.id;
    }

    await tx.stockMovement.create({
      data: {
        vaccineId: input.vaccineId,
        vaccineLotId,
        movementType: input.movementType,
        quantity: input.quantity,
        reason: input.reason,
        actorId: input.actorId,
      },
    });
  });
}
