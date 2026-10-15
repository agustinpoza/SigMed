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
