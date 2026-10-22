import { getActorContext } from "@/lib/actor";
import { UserRole } from "@/generated/prisma/enums";
import type { ActorContext } from "@/lib/actor";
import type { UserProfile } from "@/generated/prisma/client";

export type ActorGuardResult =
  | { actor: UserProfile; context: ActorContext }
  | { error: string };

/**
 * Catalogos y stock: los permisos de enfermera y de administrador.
 *
 * El rol que se mira es el efectivo: mientras el administrador ejerce el rol
 * de enfermera puede operar el stock; mientras ejerce el de medico, no.
 */
export async function requireEnfermeraOAdministrador(): Promise<ActorGuardResult> {
  const context = await getActorContext();

  if (!context) {
    return {
      error: "Se requiere iniciar sesión para modificar el catálogo y el stock.",
    };
  }

  const actor = context.effective;

  if (actor.role !== UserRole.ENFERMERA && actor.role !== UserRole.ADMINISTRADOR) {
    return {
      error:
        "Solo las enfermeras y los administradores pueden modificar el catálogo y el stock.",
    };
  }

  return { actor, context };
}

/**
 * Alta de personal: solo el administrador con su rol real. El modo ejercicio
 * no habilita funciones de administracion.
 */
export async function requireAdministrador(): Promise<ActorGuardResult> {
  const context = await getActorContext();

  if (!context) {
    return { error: "Se requiere iniciar sesión para dar de alta personal." };
  }

  if (context.real.role !== UserRole.ADMINISTRADOR) {
    return { error: "Solo los administradores pueden dar de alta personal." };
  }

  return { actor: context.real, context };
}

/**
 * Evolucion medica: el rol efectivo. En modo ejercicio el administrador opera
 * sobre la agenda del profesional que eligio como contexto.
 */
export async function requireMedico(): Promise<ActorGuardResult> {
  const context = await getActorContext();

  if (!context) {
    return { error: "Se requiere iniciar sesión para registrar la evolución médica." };
  }

  const actor = context.effective;

  if (actor.role !== UserRole.MEDICO) {
    return { error: "Solo los médicos pueden registrar la evolución médica." };
  }

  return { actor, context };
}
