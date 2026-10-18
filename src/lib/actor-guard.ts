import { getCurrentActor } from "@/lib/actor";
import { UserRole } from "@/generated/prisma/enums";

export type ActorGuardResult =
  | { actor: { id: string } }
  | { error: string };

export async function requireEnfermeraOAdministrador(): Promise<ActorGuardResult> {
  const actor = await getCurrentActor();

  if (!actor) {
    return {
      error: "Se requiere iniciar sesión para modificar el catálogo y el stock.",
    };
  }

  if (actor.role !== UserRole.ENFERMERA && actor.role !== UserRole.ADMINISTRADOR) {
    return {
      error:
        "Solo las enfermeras y los administradores pueden modificar el catálogo y el stock.",
    };
  }

  return { actor: { id: actor.id } };
}

export async function requireAdministrador(): Promise<ActorGuardResult> {
  const actor = await getCurrentActor();

  if (!actor) {
    return { error: "Se requiere iniciar sesión para dar de alta personal." };
  }

  if (actor.role !== UserRole.ADMINISTRADOR) {
    return { error: "Solo los administradores pueden dar de alta personal." };
  }

  return { actor: { id: actor.id } };
}

export async function requireMedico(): Promise<ActorGuardResult> {
  const actor = await getCurrentActor();

  if (!actor) {
    return { error: "Se requiere iniciar sesión para registrar la evolución médica." };
  }

  if (actor.role !== UserRole.MEDICO) {
    return { error: "Solo los médicos pueden registrar la evolución médica." };
  }

  return { actor: { id: actor.id } };
}
