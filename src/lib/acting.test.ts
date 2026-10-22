import { describe, expect, it, vi } from "vitest";

// La cookie firmada se prueba sin base de datos ni sesion de Clerk: el cliente
// de Prisma y las cookies de Next se simulan.
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }) }));

import { UserRole } from "@/generated/prisma/enums";
import {
  ACTING_COOKIE,
  ACTING_MAX_AGE_SECONDS,
  buildActingToken,
  signActingToken,
  verifyActingToken,
} from "@/lib/acting";

const KEY = "clave-de-prueba";
const adminId = "11111111-1111-1111-1111-111111111111";
const targetId = "22222222-2222-2222-2222-222222222222";

describe("US-7.5: cookie firmada del modo ejercicio", () => {
  it("acepta un token recien firmado", () => {
    const token = buildActingToken(adminId, UserRole.MEDICO, targetId);
    const payload = verifyActingToken(signActingToken(token, KEY), KEY);

    expect(payload).toMatchObject({
      adminId,
      role: UserRole.MEDICO,
      targetId,
    });
    expect(payload!.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("rechaza un payload modificado", () => {
    const token = signActingToken(buildActingToken(adminId, UserRole.ENFERMERA, null), KEY);
    const [body, signature] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ ...buildActingToken(adminId, UserRole.MEDICO, targetId) }),
      "utf8",
    ).toString("base64url");

    expect(verifyActingToken(`${forged}.${signature}`, KEY)).toBeNull();
    expect(verifyActingToken(`${body}.${signature.slice(0, -1)}x`, KEY)).toBeNull();
  });

  it("rechaza una firma hecha con otra clave", () => {
    const token = signActingToken(buildActingToken(adminId, UserRole.ENFERMERA, null), "otra-clave");

    expect(verifyActingToken(token, KEY)).toBeNull();
  });

  it("rechaza un token vencido", () => {
    const vencido = { ...buildActingToken(adminId, UserRole.ENFERMERA, null), exp: 1 };
    const token = signActingToken(vencido, KEY);

    expect(verifyActingToken(token, KEY)).toBeNull();
  });

  it("rechaza roles que no se pueden ejercer o datos incompletos", () => {
    const invalidos = [
      { ...buildActingToken(adminId, UserRole.ADMINISTRADOR, null) },
      { ...buildActingToken(adminId, UserRole.ENFERMERA, null), adminId: "" },
      { ...buildActingToken(adminId, UserRole.ENFERMERA, null), role: "RECEPCION" },
      { ...buildActingToken(adminId, UserRole.ENFERMERA, null), exp: "pronto" },
    ];

    for (const payload of invalidos) {
      expect(verifyActingToken(signActingToken(payload as never, KEY), KEY)).toBeNull();
    }
  });

  it("rechaza cookies vacias o mal formadas", () => {
    expect(verifyActingToken(undefined, KEY)).toBeNull();
    expect(verifyActingToken("", KEY)).toBeNull();
    expect(verifyActingToken("sin-separador", KEY)).toBeNull();
    expect(verifyActingToken(".", KEY)).toBeNull();
  });

  it("expira en 8 horas y usa una cookie propia", () => {
    const token = buildActingToken(adminId, UserRole.ENFERMERA, null);

    expect(token.exp - Math.floor(Date.now() / 1000)).toBeLessThanOrEqual(ACTING_MAX_AGE_SECONDS);
    expect(ACTING_COOKIE).toBe("sigmed_ejercicio");
  });
});
