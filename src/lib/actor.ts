import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import type { UserProfile } from "@/generated/prisma/client";
import { homeForRole } from "@/lib/roles";
import { devAuthEmail } from "@/lib/dev-auth";

function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    (Object.values(UserRole) as string[]).includes(value)
  );
}

/**
 * Correo principal del usuario de Clerk. La identidad del portal se enlaza por
 * email con los usuarios existentes (incluidos los del seed), reemplazando el
 * `clerk_user_id` provisorio por el real.
 */
function primaryEmail(user: Awaited<ReturnType<typeof currentUser>>): string | null {
  if (!user) return null;

  const primary = user.emailAddresses.find(
    (entry) => entry.id === user.primaryEmailAddressId,
  );

  return (primary ?? user.emailAddresses[0])?.emailAddress ?? null;
}

/**
 * Espeja el rol de la base en `publicMetadata` de Clerk (caché de lectura). La
 * base sigue siendo la fuente de verdad (D-02). Es best-effort: un fallo acá no
 * debe impedir la operación.
 */
async function syncRoleMetadata(userId: string, role: UserRole): Promise<void> {
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, { publicMetadata: { role } });
  } catch (error) {
    console.error("[actor] no se pudo sincronizar el rol en Clerk:", error);
  }
}

/**
 * Actor del request actual resuelto por la sesión de Clerk.
 *
 * Orden de resolución:
 * 1. Sesión ya enlazada por `clerkUserId`.
 * 2. Enlace por email con un usuario existente (seed), adoptando su rol.
 * 3. Alta JIT: el rol sale de `publicMetadata.role` o cae a PACIENTE, y se crea
 *    la fila `paciente` asociada. El DNI llega por `unsafeMetadata` del registro.
 *
 * Devuelve `null` cuando no hay sesión o no se puede aprovisionar (datos
 * incompletos). Los llamadores deciden si rechazar o redirigir.
 */
export async function getCurrentActor(): Promise<UserProfile | null> {
  const devEmail = devAuthEmail();
  if (devEmail) {
    return prisma.userProfile.findUnique({ where: { email: devEmail } });
  }

  const { userId } = await auth();
  if (!userId) return null;

  const linkedByClerk = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
  });
  if (linkedByClerk) return linkedByClerk;

  const user = await currentUser();
  if (!user) return null;

  const email = primaryEmail(user);
  if (!email) return null;

  const linkedByEmail = await prisma.userProfile.findUnique({
    where: { email },
  });
  if (linkedByEmail) {
    const updated = await prisma.userProfile.update({
      where: { id: linkedByEmail.id },
      data: { clerkUserId: userId },
    });
    await syncRoleMetadata(userId, updated.role);
    return updated;
  }

  const firstName = user.firstName?.trim() ?? "";
  const lastName = user.lastName?.trim() ?? "";
  const metadata = (user.unsafeMetadata ?? {}) as Record<string, unknown>;
  const dni = typeof metadata.dni === "string" ? metadata.dni.trim() : "";

  if (!firstName || !lastName || !dni) return null;

  const role = isUserRole(user.publicMetadata?.role)
    ? user.publicMetadata.role
    : UserRole.PACIENTE;

  try {
    const created = await prisma.userProfile.create({
      data: {
        firstName,
        lastName,
        dni,
        email,
        role,
        clerkUserId: userId,
        patient: role === UserRole.PACIENTE ? { create: {} } : undefined,
      },
    });
    await syncRoleMetadata(userId, created.role);
    return created;
  } catch (error) {
    // Otra petición concurrente pudo crear la fila primero.
    const existing = await prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
    });
    if (existing) return existing;

    console.error("[actor] no se pudo aprovisionar el usuario:", error);
    return null;
  }
}

/**
 * Exige sesión (y opcionalmente uno o más roles) y devuelve el actor. Si no hay
 * sesión redirige a `/sign-in`; si el rol no corresponde, al inicio de su rol.
 */
export async function requireActor(
  roles?: UserRole | UserRole[],
): Promise<UserProfile> {
  const actor = await getCurrentActor();

  if (!actor) redirect("/sign-in");

  const allowed =
    roles === undefined ? null : Array.isArray(roles) ? roles : [roles];

  if (allowed && !allowed.includes(actor.role)) {
    redirect(homeForRole(actor.role));
  }

  return actor;
}
