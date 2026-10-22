import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { AuditAction, AuditEntity, UserRole } from "@/generated/prisma/enums";
import type { ActorContext } from "@/lib/actor";

/**
 * Auditoria del modo ejercicio (US-7.5).
 *
 * `actorId` es siempre el actor real (el administrador) y `effectiveRole` el rol
 * que estaba ejerciendo: asi queda claro quien opero y con que permisos. La
 * tabla es append-only (trigger en la base) y hoy cubre solo el alcance de
 * US-7.5: la auditoria general de RNF-04 sigue fuera de alcance.
 */
export type AuditEntry = {
  actorId: string;
  effectiveRole: UserRole;
  action: AuditAction;
  entity?: AuditEntity | null;
  entityId?: string | null;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
};

export function auditData(entry: AuditEntry) {
  return {
    actorId: entry.actorId,
    effectiveRole: entry.effectiveRole,
    action: entry.action,
    entity: entry.entity ?? null,
    entityId: entry.entityId ?? null,
    targetId: entry.targetId ?? null,
    details: entry.details ? (entry.details as Prisma.InputJsonValue) : undefined,
  };
}

/**
 * Inserta la fila de auditoria dentro de la misma transaccion que la escritura
 * de dominio: o queda registro de la operacion, o no queda nada.
 */
export async function insertAudit(
  tx: Prisma.TransactionClient,
  entry: AuditEntry,
): Promise<void> {
  await tx.auditLog.create({ data: auditData(entry) });
}

/** Auditoria de una operacion que no comparte transaccion con el dominio. */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  await prisma.auditLog.create({ data: auditData(entry) });
}

/** Datos de la operacion auditada, sin el actor ni el rol efectivo. */
export type ExerciseAudit = {
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
};

/**
 * Descriptor de la auditoria de una escritura hecha durante el modo ejercicio.
 *
 * Fuera del modo ejercicio devuelve `null`: la auditoria de US-7.5 cubre las
 * operaciones ejecutadas bajo ese modo, que es lo que exige la story. Con
 * `actorId` = actor real y `rol_efectivo` = rol ejercido, la fila deja claro
 * quien opero y con que permisos.
 */
export function buildExerciseAudit(
  context: ActorContext | null,
  entry: ExerciseAudit,
): AuditEntry | null {
  if (!context?.acting) return null;

  return {
    actorId: context.real.id,
    effectiveRole: context.acting.role,
    targetId: context.acting.targetId,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId ?? null,
    details: entry.details ?? null,
  };
}
