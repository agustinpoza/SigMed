// US 3.3: nivel de stock crítico por vacuna (RF-32).
// Prisma, migraciones y trigger de alerta_stock son reales sobre una base aislada.
import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import type { UserProfile } from "@/generated/prisma/client";
import { AlertStatus, MovementType, UserRole } from "@/generated/prisma/enums";
import { GET, POST } from "@/app/api/vaccines/[id]/critical/route";
import { registerStockMovement } from "@/lib/stock";

import type { ActorContext } from "@/lib/actor";

const boundary = vi.hoisted(() => ({
  context: null as ActorContext | null,
}));

vi.mock("@/lib/actor", () => ({
  getActorContext: async () => boundary.context,
  getCurrentActor: async () => boundary.context?.effective ?? null,
  getRealActor: async () => boundary.context?.real ?? null,
}));

let nurse: UserProfile;
let admin: UserProfile;
let patient: UserProfile;
let vaccineId: string;
const future = () => new Date(Date.now() + 365 * 86_400_000);

function ctxFor(real: UserProfile, effective: UserProfile) {
  return { real, effective, acting: null };
}

beforeAll(async () => {
  async function profile(role: UserRole, firstName: string, dni: string) {
    return prisma.userProfile.create({
      data: {
        firstName,
        lastName: "Critico",
        dni,
        role,
        email: `${dni}-${randomUUID()}@example.invalid`,
        clerkUserId: `fixture-${dni}-${randomUUID()}`,
      },
    });
  }
  nurse = await profile(UserRole.ENFERMERA, "Nora", "95000001");
  admin = await profile(UserRole.ADMINISTRADOR, "Ada", "95000002");
  patient = await profile(UserRole.PACIENTE, "Paco", "95000003");
  await prisma.patient.create({ data: { id: patient.id } });

  const vaccine = await prisma.vaccine.create({
    data: {
      name: `Vacuna US33 ${randomUUID()}`,
      laboratory: "Lab",
      criticalLevel: 5,
      createdById: nurse.id,
    },
  });
  vaccineId = vaccine.id;
});

beforeEach(() => {
  boundary.context = ctxFor(nurse, nurse);
});

describe("US 3.3: API /api/vaccines/:id/critical", () => {
  it("GET devuelve { criticalLevel } para enfermera/admin", async () => {
    const res = await GET(new Request("http://local"), { params: Promise.resolve({ id: vaccineId }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ criticalLevel: 5 });

    boundary.context = ctxFor(admin, admin);
    const res2 = await GET(new Request("http://local"), { params: Promise.resolve({ id: vaccineId }) });
    expect(res2.status).toBe(200);
  });

  it("POST actualiza umbral y rechaza negativos/inválidos (CA1/CA2)", async () => {
    const ok = await POST(
      new Request("http://local", { method: "POST", body: JSON.stringify({ criticalLevel: 3 }) }),
      { params: Promise.resolve({ id: vaccineId }) },
    );
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ criticalLevel: 3 });

    const bad = await POST(
      new Request("http://local", { method: "POST", body: JSON.stringify({ criticalLevel: -1 }) }),
      { params: Promise.resolve({ id: vaccineId }) },
    );
    expect(bad.status).toBe(400);

    const bad2 = await POST(
      new Request("http://local", { method: "POST", body: JSON.stringify({ criticalLevel: "x" }) }),
      { params: Promise.resolve({ id: vaccineId }) },
    );
    expect(bad2.status).toBe(400);

    await prisma.vaccine.update({ where: { id: vaccineId }, data: { criticalLevel: 5 } });
  });

  it("rechaza sin rol autorizado", async () => {
    boundary.context = null;
    const res = await GET(new Request("http://local"), { params: Promise.resolve({ id: vaccineId }) });
    expect(res.status).toBe(401);

    boundary.context = ctxFor(patient, patient);
    const res2 = await GET(new Request("http://local"), { params: Promise.resolve({ id: vaccineId }) });
    expect([401, 403]).toContain(res2.status);
  });
});

describe("US 3.3: vínculo umbral ↔ alerta (trigger)", () => {
  it("cruza el umbral y genera/resuelve alerta_stock", async () => {
    const name = `Vacuna alerta ${randomUUID()}`;
    const lotNumber = "L-US33";
    const vaccine = await prisma.vaccine.create({
      data: { name, laboratory: "Lab", criticalLevel: 10, createdById: nurse.id },
    });
    await prisma.vaccineLot.create({
      data: {
        vaccineId: vaccine.id,
        lotNumber,
        expiresAt: future(),
        registeredById: nurse.id,
        quantityAvailable: 0,
      },
    });

    await registerStockMovement({
      vaccineId: vaccine.id,
      lotNumber,
      expiresAt: null,
      quantity: 5,
      movementType: MovementType.INGRESO,
      reason: null,
      actorId: nurse.id,
    });

    const active = await prisma.stockAlert.findFirst({
      where: { vaccineId: vaccine.id, status: AlertStatus.ACTIVA },
    });
    expect(active).not.toBeNull();
    expect(active?.criticalLevelWhenGenerated).toBe(10);

    await registerStockMovement({
      vaccineId: vaccine.id,
      lotNumber,
      expiresAt: null,
      quantity: 10,
      movementType: MovementType.INGRESO,
      reason: null,
      actorId: nurse.id,
    });

    const resolved = await prisma.stockAlert.findFirst({
      where: { vaccineId: vaccine.id, status: AlertStatus.ACTIVA },
    });
    expect(resolved).toBeNull();
  });
});
