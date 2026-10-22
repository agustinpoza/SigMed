import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { UserRole } from "@/generated/prisma/enums";
import type { UserProfile } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { isExercisableRole } from "@/lib/permissions";

/**
 * Modo ejercicio del administrador (US-7.5 / RF-26).
 *
 * El contexto vive en una cookie firmada: el administrador conserva su
 * identidad (no se reencarna como otro usuario) y elige el profesional o el
 * paciente sobre el que opera. La cookie es httpOnly, expira y solo se honra si
 * el actor real es administrador y si la firma sigue siendo valida.
 */
export const ACTING_COOKIE = "sigmed_ejercicio";

/** Duracion maxima del modo ejercicio: 8 horas. */
export const ACTING_MAX_AGE_SECONDS = 8 * 60 * 60;

export type ActingToken = {
  /** Id del `usuario` del administrador real. */
  adminId: string;
  /** Rol que se esta ejerciendo. */
  role: UserRole;
  /** Medico o paciente de contexto; null cuando el rol no lo necesita. */
  targetId: string | null;
  /** Vencimiento en segundos epoch. */
  exp: number;
};

/**
 * Clave de firma. Se reutiliza la clave secreta de Clerk para no agregar
 * variables de entorno nuevas: si esa clave rota, los modos ejercicio abiertos
 * dejan de aceptarse, que es el comportamiento buscado.
 */
export function actingSecret(): string | null {
  const secret = process.env.CLERK_SECRET_KEY;
  return secret && secret.length > 0 ? secret : null;
}

function signature(body: string, key: string): string {
  return createHmac("sha256", key).update(body).digest("base64url");
}

export function signActingToken(payload: ActingToken, key: string): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${signature(body, key)}`;
}

/**
 * Verifica la firma y la vigencia del token. Devuelve null ante cualquier
 * cookie invalida: la falla es cerrada, nunca se degrada a "sin ejercicio".
 */
export function verifyActingToken(
  token: string | undefined | null,
  key: string,
): ActingToken | null {
  if (!token) return null;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const body = token.slice(0, separator);
  const received = token.slice(separator + 1);
  const expected = signature(body, key);

  const receivedBytes = Buffer.from(received);
  const expectedBytes = Buffer.from(expected);
  if (
    receivedBytes.length !== expectedBytes.length ||
    !timingSafeEqual(receivedBytes, expectedBytes)
  ) {
    return null;
  }

  let payload: ActingToken;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as ActingToken;
  } catch {
    return null;
  }

  if (!payload || typeof payload !== "object") return null;
  if (typeof payload.adminId !== "string" || payload.adminId.length === 0) return null;
  if (!isExercisableRole(payload.role)) return null;
  if (payload.targetId !== null && typeof payload.targetId !== "string") return null;
  if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) return null;
  if (payload.exp * 1000 <= Date.now()) return null;

  return payload;
}

export function buildActingToken(
  adminId: string,
  role: UserRole,
  targetId: string | null,
  now: number = Date.now(),
): ActingToken {
  return {
    adminId,
    role,
    targetId,
    exp: Math.floor(now / 1000) + ACTING_MAX_AGE_SECONDS,
  };
}

export async function readActingToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACTING_COOKIE)?.value;
}

/**
 * Perfil de contexto: el profesional o el paciente que el administrador eligio.
 * Tiene que existir con el rol esperado y tener su ficha correspondiente
 * (`medico` o `paciente`), porque las areas de medico y de paciente leen por id.
 */
export async function findActingTarget(
  role: UserRole,
  targetId: string,
): Promise<UserProfile | null> {
  const target = await prisma.userProfile.findUnique({
    where: { id: targetId },
  });
  if (!target || target.role !== role) return null;

  const ficha =
    role === UserRole.MEDICO
      ? await prisma.doctor.findUnique({
          where: { id: target.id },
          select: { id: true },
        })
      : await prisma.patient.findUnique({
          where: { id: target.id },
          select: { id: true },
        });

  return ficha ? target : null;
}

export async function writeActingCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(ACTING_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACTING_MAX_AGE_SECONDS,
  });
}

export async function clearActingCookie(): Promise<void> {
  const store = await cookies();
  store.delete(ACTING_COOKIE);
}
