import { prisma } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import { isUuid } from "@/lib/forms";
import { requireEnfermeraOAdministrador } from "@/lib/actor-guard";
import { AuditAction, AuditEntity } from "@/generated/prisma/enums";
import { buildExerciseAudit, insertAudit } from "@/lib/audit";
import type { ActorContext } from "@/lib/actor";
import type { UserProfile } from "@/generated/prisma/client";

export class VaccineServiceError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
  }
}

function assertVaccineId(vaccineId: string) {
  if (!isUuid(vaccineId)) {
    throw new VaccineServiceError("La vacuna seleccionada no es válida.", 400);
  }
}

export function parseCriticalLevelInput(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    if (!Number.isInteger(value) || value < 0) {
      throw new VaccineServiceError("El nivel crítico debe ser un entero mayor o igual a 0.", 400);
    }
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    if (!/^\d+$/.test(trimmed)) {
      throw new VaccineServiceError("El nivel crítico debe ser un entero mayor o igual a 0.", 400);
    }
    const n = Number(trimmed);
    if (!Number.isSafeInteger(n) || n < 0) {
      throw new VaccineServiceError("El nivel crítico debe ser un entero mayor o igual a 0.", 400);
    }
    return n;
  }
  throw new VaccineServiceError("El nivel crítico debe ser un entero mayor o igual a 0.", 400);
}

export async function getCriticalLevel(vaccineId: string): Promise<number | null> {
  assertVaccineId(vaccineId);
  const vaccine = await prisma.vaccine.findUnique({
    where: { id: vaccineId },
    select: { criticalLevel: true },
  });
  if (!vaccine) throw new VaccineServiceError("Vacuna no encontrada.", 404);
  return vaccine.criticalLevel;
}

export type SetCriticalLevelAuth =
  | { actor: UserProfile; context: ActorContext }
  | null;

export async function setCriticalLevel(
  vaccineId: string,
  criticalLevelInput: unknown,
  auth?: SetCriticalLevelAuth,
): Promise<number | null> {
  assertVaccineId(vaccineId);
  const criticalLevel = parseCriticalLevelInput(criticalLevelInput);

  let guard: { actor: UserProfile; context: ActorContext };
  if (auth) {
    guard = auth;
  } else {
    const result = await requireEnfermeraOAdministrador();
    if ("error" in result) throw new VaccineServiceError(result.error, 403);
    guard = result;
  }

  const role = guard.context.effective.role;
  if (role !== UserRole.ENFERMERA && role !== UserRole.ADMINISTRADOR) {
    throw new VaccineServiceError(
      "Solo las enfermeras y los administradores pueden modificar el umbral crítico.",
      403,
    );
  }

  const existing = await prisma.vaccine.findUnique({
    where: { id: vaccineId },
    select: { id: true },
  });
  if (!existing) throw new VaccineServiceError("Vacuna no encontrada.", 404);

  const audit = buildExerciseAudit(guard.context, {
    action: AuditAction.ACTUALIZAR_VACUNA,
    entity: AuditEntity.VACUNA,
    entityId: vaccineId,
    details: { criticalLevel },
  });

  await prisma.$transaction(async (tx) => {
    await tx.vaccine.update({
      where: { id: vaccineId },
      data: { criticalLevel },
    });
    if (audit) await insertAudit(tx, audit);
  });

  return criticalLevel;
}

export type VaccineCriticalConfig = {
  id: string;
  name: string;
  laboratory: string;
  criticalLevel: number | null;
  physicalStock: number;
};

export async function listVaccinesForCriticalConfig(): Promise<VaccineCriticalConfig[]> {
  const vaccines = await prisma.vaccine.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      laboratory: true,
      criticalLevel: true,
      lots: { select: { quantityAvailable: true } },
    },
  });
  return vaccines.map((v) => ({
    id: v.id,
    name: v.name,
    laboratory: v.laboratory,
    criticalLevel: v.criticalLevel,
    physicalStock: v.lots.reduce((sum, lot) => sum + lot.quantityAvailable, 0),
  }));
}
