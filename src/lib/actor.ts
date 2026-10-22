import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import type { UserProfile } from "@/generated/prisma/client";
import { homeForRole } from "@/lib/roles";
import {
  actingSecret,
  findActingTarget,
  readActingToken,
  verifyActingToken,
} from "@/lib/acting";
import { AREA_PER_ROLE, requiresTarget, type PortalArea } from "@/lib/permissions";

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
 * Actor real del request: la persona que inicio sesion en Clerk.
 *
 * Orden de resolucion:
 * 1. Sesion ya enlazada por `clerkUserId`.
 * 2. Enlace por email con un usuario existente (seed), adoptando su rol.
 * 3. Alta JIT: el rol sale de `publicMetadata.role` o cae a PACIENTE, y se crea
 *    la fila `paciente` asociada. El DNI llega por `unsafeMetadata` del registro.
 *
 * Devuelve `null` cuando no hay sesion o no se puede aprovisionar (datos
 * incompletos). Los llamadores deciden si rechazar o redirigir.
 */
export async function getRealActor(): Promise<UserProfile | null> {
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
    // Otra peticion concurrente pudo crear la fila primero.
    const existing = await prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
    });
    if (existing) return existing;

    console.error("[actor] no se pudo aprovisionar el usuario:", error);
    return null;
  }
}

/**
 * Modo ejercicio (US-7.5 / RF-26): el rol que el administrador esta ejerciendo
 * y el profesional o paciente de contexto.
 *
 * El administrador no se reencarna: conserva su identidad. Lo unico que cambia
 * es el rol con el que opera y los datos sobre los que opera.
 */
export type ActingContext = {
  role: UserRole;
  targetId: string | null;
  /** Perfil efectivo: el del profesional o paciente de contexto. */
  actor: UserProfile;
  /** Identificador del administrador real. */
  adminId: string;
};

/**
 * Resuelve el modo ejercicio a partir del actor real. Devuelve null si no hay
 * modo ejercicio, si la cookie no es valida o si el actor real no es
 * administrador: en ese caso el administrador opera con su propio rol.
 */
export async function getActingContext(
  real: UserProfile | null,
): Promise<ActingContext | null> {
  if (!real || real.role !== UserRole.ADMINISTRADOR) return null;

  const key = actingSecret();
  if (!key) return null;

  const token = await readActingToken();
  const payload = verifyActingToken(token, key);
  if (!payload) return null;

  // La cookie pertenece a otro administrador: no se honra.
  if (payload.adminId !== real.id) return null;

  if (!requiresTarget(payload.role)) {
    // enfermeria: no hay ficha propia, el administrador opera con su id.
    return {
      role: payload.role,
      targetId: null,
      actor: { ...real, role: payload.role },
      adminId: real.id,
    };
  }

  if (!payload.targetId) return null;

  const target = await findActingTarget(payload.role, payload.targetId);
  if (!target) return null;

  return {
    role: payload.role,
    targetId: target.id,
    actor: target,
    adminId: real.id,
  };
}

/** Contexto completo del request: actor real, actor efectivo y modo ejercicio. */
export type ActorContext = {
  real: UserProfile;
  effective: UserProfile;
  acting: ActingContext | null;
};

export async function getActorContext(): Promise<ActorContext | null> {
  const real = await getRealActor();
  if (!real) return null;

  const acting = await getActingContext(real);

  return { real, effective: acting ? acting.actor : real, acting };
}

/**
 * Actor del request con el que opera la aplicacion: el administrador conserva
 * su identidad y, si esta en modo ejercicio, el rol y el contexto que eligio.
 */
export async function getCurrentActor(): Promise<UserProfile | null> {
  const context = await getActorContext();
  return context ? context.effective : null;
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

/**
 * Exige sesion con un rol **real** (ignora el modo ejercicio). Se usa para las
 * funciones propias del administrador: el administrador las puede usar siempre,
 * incluso mientras ejerce otro rol.
 */
export async function requireRealActor(
  roles?: UserRole | UserRole[],
): Promise<UserProfile> {
  const actor = await getRealActor();

  if (!actor) redirect("/sign-in");

  const allowed =
    roles === undefined ? null : Array.isArray(roles) ? roles : [roles];

  if (allowed && !allowed.includes(actor.role)) {
    redirect(homeForRole(actor.role));
  }

  return actor;
}

/**
 * Guarda de area del portal (matriz de permisos de RF-26).
 *
 * El area de administracion se valida con el rol real: el administrador siempre
 * vuelve a su panel. Las areas de medico, enfermera y paciente se validan con
 * el rol efectivo, asi que el administrador solo entra a ellas mediante el modo
 * ejercicio y ningun otro rol puede asumirlas.
 */
export async function requireArea(area: PortalArea): Promise<ActorContext> {
  const real = await getRealActor();

  if (!real) redirect("/sign-in");

  const acting = await getActingContext(real);
  const required = AREA_PER_ROLE[area];
  const effectiveRole = acting ? acting.role : real.role;

  const allowed = area === "admin" ? real.role === required : effectiveRole === required;

  if (!allowed) {
    redirect(homeForRole(effectiveRole));
  }

  return { real, effective: acting ? acting.actor : real, acting };
}
