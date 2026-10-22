// US-7.5 / RF-26: auditoria de las operaciones del modo ejercicio.
// Prisma, SQL y triggers son reales sobre una base aislada.
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import type { UserProfile } from "@/generated/prisma/client";
import { AuditAction, AuditEntity, MovementType, Specialty, UserRole } from "@/generated/prisma/enums";
import { registerStockMovement, createVaccineWithInitialLot } from "@/lib/stock";
import { buildExerciseAudit } from "@/lib/audit";
import { findActingTarget } from "@/lib/acting";
import type { ActorContext } from "@/lib/actor";

let admin: UserProfile, doctor: UserProfile, patient: UserProfile, nurse: UserProfile;
const future = () => new Date(Date.now() + 365 * 86_400_000);

beforeAll(async () => {
  async function profile(role: UserRole, firstName: string, dni: string) {
    return prisma.userProfile.create({
      data: {
        firstName,
        lastName: "Ejercicio",
        dni,
        role,
        email: `${dni}-${randomUUID()}@example.invalid`,
        clerkUserId: `fixture-${dni}-${randomUUID()}`,
      },
    });
  }

  admin = await profile(UserRole.ADMINISTRADOR, "Ana", "91000001");
  doctor = await profile(UserRole.MEDICO, "Bruno", "91000002");
  patient = await profile(UserRole.PACIENTE, "Carla", "91000003");
  nurse = await profile(UserRole.ENFERMERA, "Diana", "91000004");

  await prisma.doctor.create({
    data: {
      id: doctor.id,
      licenseNumber: `MAT-${randomUUID()}`,
      specialty: Specialty.PEDIATRA,
      consultDuration: 30,
      consultFee: 100,
    },
  });
  await prisma.patient.create({ data: { id: patient.id } });
});

/** Contexto de ejercicio del administrador sobre el profesional elegido. */
function actingContext(
  real: UserProfile,
  effective: UserProfile,
  role: UserRole,
  targetId: string | null,
): ActorContext {
  return {
    real,
    effective,
    acting: { role, targetId, actor: effective, adminId: real.id },
  };
}

async function vaccineWithStock(quantity: number) {
  const name = `Vacuna ejercicio ${randomUUID()}`;
  await createVaccineWithInitialLot({
    name,
    laboratory: "Laboratorio ficticio",
    criticalLevel: null,
    lotNumber: "LOTE-EJERCICIO",
    expiresAt: future(),
    quantity,
    actorId: nurse.id,
  });
  const vaccine = await prisma.vaccine.findUniqueOrThrow({ where: { name } });
  const lot = await prisma.vaccineLot.findUniqueOrThrow({
    where: { vaccineId_lotNumber: { vaccineId: vaccine.id, lotNumber: "LOTE-EJERCICIO" } },
  });
  return { vaccine, lot };
}

describe("US-7.5: auditoria de las operaciones bajo el modo ejercicio", () => {
  it("sin modo ejercicio no se asienta ninguna fila de auditoria", async () => {
    const { vaccine, lot } = await vaccineWithStock(3);

    const audit = buildExerciseAudit(null, {
      action: AuditAction.CREAR_MOVIMIENTO_STOCK,
      entity: AuditEntity.MOVIMIENTO_STOCK,
    });

    expect(audit).toBeNull();

    await registerStockMovement({
      vaccineId: vaccine.id,
      lotNumber: "LOTE-EJERCICIO",
      expiresAt: null,
      quantity: -1,
      movementType: MovementType.AJUSTE,
      reason: "Ajuste de prueba",
      actorId: nurse.id,
      audit,
    });

    expect(await prisma.auditLog.findMany({ where: { entityId: lot.id } })).toHaveLength(0);
  });

  it("la escritura y su auditoria se asientan en la misma transaccion", async () => {
    const { vaccine, lot } = await vaccineWithStock(5);

    const audit = buildExerciseAudit(actingContext(admin, admin, UserRole.ENFERMERA, null), {
      action: AuditAction.CREAR_MOVIMIENTO_STOCK,
      entity: AuditEntity.MOVIMIENTO_STOCK,
      details: { vacunaId: vaccine.id, cantidad: 2 },
    });

    expect(audit).toMatchObject({
      actorId: admin.id,
      effectiveRole: UserRole.ENFERMERA,
      targetId: null,
    });

    await registerStockMovement({
      vaccineId: vaccine.id,
      lotNumber: "LOTE-EJERCICIO",
      expiresAt: null,
      quantity: -2,
      movementType: MovementType.AJUSTE,
      reason: "Ajuste auditado",
      actorId: admin.id,
      audit,
    });

    const rows = await prisma.auditLog.findMany({
      where: { entityId: lot.id },
      orderBy: { createdAt: "asc" },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      actorId: admin.id,
      effectiveRole: UserRole.ENFERMERA,
      action: AuditAction.CREAR_MOVIMIENTO_STOCK,
      entity: AuditEntity.MOVIMIENTO_STOCK,
      entityId: lot.id,
    });
    expect(rows[0].details).toMatchObject({ cantidad: 2 });
  });

  it("una escritura rechazada no deja rastro de auditoria", async () => {
    const { vaccine, lot } = await vaccineWithStock(1);

    const audit = buildExerciseAudit(actingContext(admin, admin, UserRole.ENFERMERA, null), {
      action: AuditAction.CREAR_MOVIMIENTO_STOCK,
      entity: AuditEntity.MOVIMIENTO_STOCK,
    });

    await expect(
      registerStockMovement({
        vaccineId: vaccine.id,
        lotNumber: "LOTE-EJERCICIO",
        expiresAt: null,
        quantity: -5,
        movementType: MovementType.AJUSTE,
        reason: "Ajuste imposible",
        actorId: admin.id,
        audit,
      }),
    ).rejects.toThrow();

    expect(await prisma.auditLog.findMany({ where: { entityId: lot.id } })).toHaveLength(0);
  });

  it("la auditoria registra el actor real, el rol efectivo y el objetivo", async () => {
    const audit = buildExerciseAudit(actingContext(admin, doctor, UserRole.MEDICO, doctor.id), {
      action: AuditAction.GUARDAR_DISPONIBILIDAD,
      entity: AuditEntity.HORARIO_ATENCION,
      entityId: doctor.id,
    });

    expect(audit).toMatchObject({
      actorId: admin.id,
      effectiveRole: UserRole.MEDICO,
      targetId: doctor.id,
      entityId: doctor.id,
    });
  });

  it("la tabla de auditoria es append-only", async () => {
    const { vaccine } = await vaccineWithStock(2);

    await registerStockMovement({
      vaccineId: vaccine.id,
      lotNumber: "LOTE-EJERCICIO",
      expiresAt: null,
      quantity: 1,
      movementType: MovementType.AJUSTE,
      reason: "Ajuste auditado",
      actorId: admin.id,
      audit: buildExerciseAudit(actingContext(admin, admin, UserRole.ENFERMERA, null), {
        action: AuditAction.CREAR_MOVIMIENTO_STOCK,
        entity: AuditEntity.MOVIMIENTO_STOCK,
      }),
    });

    const row = await prisma.auditLog.findFirstOrThrow();
    await expect(prisma.auditLog.update({ where: { id: row.id }, data: { action: AuditAction.EJERCER_FIN } })).rejects.toThrow(/append-only/);
    await expect(prisma.auditLog.delete({ where: { id: row.id } })).rejects.toThrow(/append-only/);
  });
});

describe("US-7.5: contexto de medico o paciente", () => {
  it("el objetivo tiene que existir con el rol esperado y su ficha", async () => {
    expect((await findActingTarget(UserRole.MEDICO, doctor.id))?.id).toBe(doctor.id);
    expect((await findActingTarget(UserRole.PACIENTE, patient.id))?.id).toBe(patient.id);
  });

  it("un perfil con otro rol no sirve de contexto", async () => {
    expect(await findActingTarget(UserRole.MEDICO, patient.id)).toBeNull();
    expect(await findActingTarget(UserRole.PACIENTE, doctor.id)).toBeNull();
    expect(await findActingTarget(UserRole.MEDICO, admin.id)).toBeNull();
  });

  it("un perfil sin la ficha correspondiente no sirve de contexto", async () => {
    const sinFicha = await prisma.userProfile.create({
      data: {
        firstName: "Eve",
        lastName: "Sin ficha",
        dni: "91000009",
        role: UserRole.MEDICO,
        email: `sin-ficha-${randomUUID()}@example.invalid`,
        clerkUserId: `fixture-sin-ficha-${randomUUID()}`,
      },
    });

    expect(await findActingTarget(UserRole.MEDICO, sinFicha.id)).toBeNull();
  });
});
