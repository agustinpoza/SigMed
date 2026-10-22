"use server";

import { redirect } from "next/navigation";
import { getRealActor } from "@/lib/actor";
import { AuditAction, AuditEntity, UserRole } from "@/generated/prisma/enums";
import { recordAudit } from "@/lib/audit";
import {
  actingSecret,
  buildActingToken,
  clearActingCookie,
  findActingTarget,
  readActingToken,
  signActingToken,
  verifyActingToken,
  writeActingCookie,
} from "@/lib/acting";
import { canExerciseAs, isExercisableRole, requiresTarget } from "@/lib/permissions";
import { homeForRole } from "@/lib/roles";
import { isUuid } from "@/lib/forms";

/**
 * US-7.5 / RF-26: el administrador entra al area de otro rol.
 *
 * El administrador no se reencarna: la cookie firmada guarda el rol que esta
 * ejerciendo y el profesional o el paciente de contexto. Si no hay objetivo
 * posible, se vuelve al panel sin cambios.
 */
export async function iniciarEjercicio(formData: FormData): Promise<void> {
  const admin = await getRealActor();

  if (!admin || admin.role !== UserRole.ADMINISTRADOR) {
    redirect("/admin");
  }

  const rawRole = formData.get("role");
  const role = typeof rawRole === "string" ? rawRole : "";

  if (!isExercisableRole(role) || !canExerciseAs(admin.role, role)) {
    redirect("/admin");
  }

  const rawTarget = formData.get("targetId");
  const targetId = typeof rawTarget === "string" ? rawTarget.trim() : "";

  let objetivo: string | null = null;

  if (requiresTarget(role)) {
    if (!isUuid(targetId)) redirect("/admin");

    const target = await findActingTarget(role, targetId);
    if (!target) redirect("/admin");

    objetivo = target.id;
  }

  const key = actingSecret();
  if (!key) redirect("/admin");

  const token = buildActingToken(admin.id, role, objetivo);
  await writeActingCookie(signActingToken(token, key));

  await recordAudit({
    actorId: admin.id,
    effectiveRole: role,
    action: AuditAction.EJERCER_INICIO,
    entity: AuditEntity.EJERCICIO,
    entityId: null,
    targetId: objetivo,
    details: { rol: role },
  });

  redirect(homeForRole(role));
}

/**
 * Cierra el modo ejercicio: borra la cookie y deja constancia en la auditoria.
 */
export async function finalizarEjercicio(): Promise<void> {
  const admin = await getRealActor();

  if (!admin || admin.role !== UserRole.ADMINISTRADOR) {
    redirect("/admin");
  }

  const key = actingSecret();
  const payload = key ? verifyActingToken(await readActingToken(), key) : null;

  if (payload && payload.adminId === admin.id) {
    await recordAudit({
      actorId: admin.id,
      effectiveRole: payload.role,
      action: AuditAction.EJERCER_FIN,
      entity: AuditEntity.EJERCICIO,
      entityId: null,
      targetId: payload.targetId,
      details: { rol: payload.role },
    });
  }

  await clearActingCookie();

  redirect("/admin");
}
