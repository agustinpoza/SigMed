// Sprint 3: US-4.2 (validación de coberturas), US-4.4 (pago online de
// consultas particulares) y US-4.7 (deuda por inasistencia).
// Prisma, SQL, triggers, dominio y acciones son reales sobre una base aislada;
// solo se simulan la identidad y la invalidación de Next.
import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import type { UserProfile } from "@/generated/prisma/client";
import {
  AppointmentState,
  CoverageStatus,
  PaymentConcept,
  PaymentStatus,
  Speciality,
  UserRole,
} from "@/generated/prisma/enums";
import {
  PaymentRuleError,
  cobrarDeudaInasistencia,
  condonarDeudaInasistencia,
  generarCargoInasistencia,
  obtenerDeudaPaciente,
  obtenerResumenPago,
  registrarPagoConsulta,
} from "@/lib/payments";
import { registrarAsistencia } from "@/app/(portal)/medico/agenda/actions";
import { validarCobertura } from "@/app/(portal)/admin/coberturas/actions";

const boundary = vi.hoisted(() => ({
  actor: null as UserProfile | null,
  revalidate: vi.fn(),
}));

vi.mock("@/lib/actor", () => ({
  getCurrentActor: async () => boundary.actor,
  getActorContext: async () =>
    boundary.actor
      ? { real: boundary.actor, effective: boundary.actor, acting: null }
      : null,
}));
vi.mock("next/cache", () => ({ revalidatePath: boundary.revalidate }));

const FEE = 45000;

let admin: UserProfile;
let doctorProfile: UserProfile;
let doctorId: string;
let privatePatient: UserProfile;
let coveredPatient: UserProfile;
let pendingPatient: UserProfile;
let validationPatient: UserProfile;
let insurance: { id: string };

let slot = 0;

async function profile(role: UserRole, firstName: string) {
  const dni = randomUUID().replaceAll("-", "").slice(0, 9);
  return prisma.userProfile.create({
    data: {
      firstName,
      lastName: "Sprint 3",
      dni,
      role,
      email: `${dni}-${randomUUID()}@example.invalid`,
      clerkUserId: `fixture-${randomUUID()}`,
    },
  });
}

async function crearTurno(
  patientId: string,
  status: AppointmentState = AppointmentState.CONFIRMADO,
) {
  slot += 1;
  const startsAt = new Date(Date.now() + (40 + slot) * 86_400_000);
  return prisma.appointment.create({
    data: {
      patientId,
      doctorId,
      startsAt,
      endsAt: new Date(startsAt.getTime() + 30 * 60_000),
      status,
      reservedById: patientId,
    },
  });
}

function formData(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
}

beforeAll(async () => {
  admin = await profile(UserRole.ADMINISTRADOR, "Ana");
  doctorProfile = await profile(UserRole.MEDICO, "Bruno");
  privatePatient = await profile(UserRole.PACIENTE, "Carla");
  coveredPatient = await profile(UserRole.PACIENTE, "Diego");
  pendingPatient = await profile(UserRole.PACIENTE, "Elena");
  validationPatient = await profile(UserRole.PACIENTE, "Fabián");

  insurance = await prisma.insuranceProvider.create({
    data: {
      name: `Pampora ${randomUUID()}`,
      accepted: true,
    },
  });

  await prisma.patient.create({ data: { id: privatePatient.id } });
  await prisma.patient.create({
    data: {
      id: coveredPatient.id,
      insuranceId: insurance.id,
      memberNumber: "PAMP-VALIDA",
      coverageStatus: CoverageStatus.VALIDADA,
    },
  });
  await prisma.patient.create({
    data: {
      id: pendingPatient.id,
      insuranceId: insurance.id,
      memberNumber: "PAMP-PENDIENTE",
      coverageStatus: CoverageStatus.PENDIENTE,
    },
  });
  await prisma.patient.create({
    data: {
      id: validationPatient.id,
      insuranceId: insurance.id,
      memberNumber: "PAMP-VALIDAR",
      coverageStatus: CoverageStatus.VALIDADA,
    },
  });

  const doctor = await prisma.doctor.create({
    data: {
      id: doctorProfile.id,
      licenseNumber: `MP-${randomUUID()}`,
      speciality: Speciality.TRAUMATOLOGO,
      consultDuration: 30,
      consultFee: FEE,
    },
  });
  doctorId = doctor.id;
});

beforeEach(() => {
  boundary.revalidate.mockClear();
});

describe("US-4.2: validación administrativa de la cobertura", () => {
  it("registra el resultado, la fecha, el administrador y la nota", async () => {
    boundary.actor = admin;

    const state = await validarCobertura(
      {},
      formData({
        patientId: validationPatient.id,
        status: CoverageStatus.RECHAZADA,
        note: "La obra social informó que la afiliación está vencida.",
      }),
    );

    expect(state.success).toBe(true);

    const stored = await prisma.patient.findUniqueOrThrow({
      where: { id: validationPatient.id },
    });
    expect(stored.coverageStatus).toBe(CoverageStatus.RECHAZADA);
    expect(stored.coverageValidatedById).toBe(admin.id);
    expect(stored.coverageValidatedAt).not.toBeNull();
    expect(stored.coverageValidationNote).toContain("vencida");
  });

  it("no permite validar a un paciente sin obra social registrada", async () => {
    boundary.actor = admin;

    const state = await validarCobertura(
      {},
      formData({
        patientId: privatePatient.id,
        status: CoverageStatus.VALIDADA,
        note: "",
      }),
    );

    expect(state.success).toBeUndefined();
    expect(state.message).toMatch(/no tiene una obra social/i);
  });

  it("rechaza resultados de validación desconocidos", async () => {
    boundary.actor = admin;

    const state = await validarCobertura(
      {},
      formData({
        patientId: validationPatient.id,
        status: "CUBIERTA_TOTAL",
        note: "",
      }),
    );

    expect(state.errors?.status).toMatch(/no es válido/i);
  });

  it("solo el administrador puede registrar la validación", async () => {
    boundary.actor = doctorProfile;

    const state = await validarCobertura(
      {},
      formData({
        patientId: validationPatient.id,
        status: CoverageStatus.VALIDADA,
        note: "",
      }),
    );

    expect(state.success).toBeUndefined();
    expect(state.message).toMatch(/administrador/i);
  });
});

describe("US-4.4: pago online de consultas particulares", () => {
  it("toma el monto del arancel del médico y persiste el resultado pendiente", async () => {
    const turno = await crearTurno(privatePatient.id);

    const resumen = await obtenerResumenPago(turno.id, privatePatient.id);
    expect(resumen.amount).toBe(FEE);
    expect(resumen.coverage.state).toBe("SIN_COBERTURA");
    expect(resumen.canPay).toBe(true);

    const payment = await registrarPagoConsulta({
      appointmentId: turno.id,
      patientId: privatePatient.id,
      actorId: privatePatient.id,
      result: "PENDIENTE",
    });

    expect(payment.status).toBe(PaymentStatus.PENDIENTE);
    expect(payment.paidAt).toBeNull();
    expect(payment.concept).toBe(PaymentConcept.CONSULTA);
    expect(Number(payment.amount)).toBe(FEE);
  });

  it("persiste aprobado con fecha de pago y evita un segundo cobro", async () => {
    const turno = await crearTurno(privatePatient.id);

    const payment = await registrarPagoConsulta({
      appointmentId: turno.id,
      patientId: privatePatient.id,
      actorId: privatePatient.id,
      result: "APROBADO",
    });

    expect(payment.status).toBe(PaymentStatus.APROBADO);
    expect(payment.paidAt).not.toBeNull();

    await expect(
      registrarPagoConsulta({
        appointmentId: turno.id,
        patientId: privatePatient.id,
        actorId: privatePatient.id,
        result: "APROBADO",
      }),
    ).rejects.toBeInstanceOf(PaymentRuleError);
  });

  it("persiste rechazado sin contarlo como pago", async () => {
    const turno = await crearTurno(privatePatient.id);

    const payment = await registrarPagoConsulta({
      appointmentId: turno.id,
      patientId: privatePatient.id,
      actorId: privatePatient.id,
      result: "RECHAZADO",
    });

    expect(payment.status).toBe(PaymentStatus.RECHAZADO);
    expect(payment.paidAt).toBeNull();
  });

  it("no cobra una consulta cubierta por la obra social", async () => {
    const turno = await crearTurno(coveredPatient.id);

    const resumen = await obtenerResumenPago(turno.id, coveredPatient.id);
    expect(resumen.coverage.covered).toBe(true);
    expect(resumen.canPay).toBe(false);

    await expect(
      registrarPagoConsulta({
        appointmentId: turno.id,
        patientId: coveredPatient.id,
        actorId: coveredPatient.id,
        result: "APROBADO",
      }),
    ).rejects.toThrow(/cubierta/i);
  });

  it("espera la validación cuando la cobertura está pendiente", async () => {
    const turno = await crearTurno(pendingPatient.id);

    const resumen = await obtenerResumenPago(turno.id, pendingPatient.id);
    expect(resumen.coverage.state).toBe("PENDIENTE");
    expect(resumen.canPay).toBe(false);
  });

  it("exige que el turno esté confirmado", async () => {
    const turno = await crearTurno(
      privatePatient.id,
      AppointmentState.RESERVADO,
    );

    const resumen = await obtenerResumenPago(turno.id, privatePatient.id);
    expect(resumen.canPay).toBe(false);
    expect(resumen.blockedReason).toMatch(/confirmá/i);
  });

  it("no expone el resumen de un turno ajeno", async () => {
    const turno = await crearTurno(privatePatient.id);

    await expect(
      obtenerResumenPago(turno.id, coveredPatient.id),
    ).rejects.toBeInstanceOf(PaymentRuleError);
  });
});

describe("US-4.7: deuda por inasistencia", () => {
  it("imputa la totalidad del arancel al marcar ausente y no duplica el cargo", async () => {
    const turno = await crearTurno(privatePatient.id);
    boundary.actor = doctorProfile;

    await registrarAsistencia(
      formData({ appointmentId: turno.id, estado: "AUSENTE" }),
    );

    const saved = await prisma.appointment.findUniqueOrThrow({
      where: { id: turno.id },
      include: { payment: true },
    });

    expect(saved.status).toBe(AppointmentState.AUSENTE);
    expect(saved.payment?.concept).toBe(PaymentConcept.INASISTENCIA);
    expect(saved.payment?.status).toBe(PaymentStatus.PENDIENTE);
    expect(Number(saved.payment?.amount)).toBe(FEE);

    await registrarAsistencia(
      formData({ appointmentId: turno.id, estado: "AUSENTE" }),
    );

    const count = await prisma.payment.count({
      where: { appointmentId: turno.id },
    });
    expect(count).toBe(1);

    const deuda = await obtenerDeudaPaciente(privatePatient.id);
    expect(deuda.totalPending).toBeGreaterThanOrEqual(FEE);
  });

  it("no genera deuda si el turno queda atendido", async () => {
    const turno = await crearTurno(privatePatient.id);
    boundary.actor = doctorProfile;

    await registrarAsistencia(
      formData({ appointmentId: turno.id, estado: "ATENDIDO" }),
    );

    const saved = await prisma.appointment.findUniqueOrThrow({
      where: { id: turno.id },
      include: { payment: true },
    });

    expect(saved.status).toBe(AppointmentState.ATENDIDO);
    expect(saved.payment).toBeNull();
  });

  it("anula la deuda impaga al corregir la ausencia a atendido", async () => {
    const turno = await crearTurno(privatePatient.id);
    boundary.actor = doctorProfile;

    await registrarAsistencia(
      formData({ appointmentId: turno.id, estado: "AUSENTE" }),
    );
    await registrarAsistencia(
      formData({ appointmentId: turno.id, estado: "ATENDIDO" }),
    );

    const saved = await prisma.appointment.findUniqueOrThrow({
      where: { id: turno.id },
      include: { payment: true },
    });

    expect(saved.status).toBe(AppointmentState.ATENDIDO);
    expect(saved.payment?.status).toBe(PaymentStatus.ANULADO);
    expect(saved.payment?.paidAt).toBeNull();

    const deuda = await obtenerDeudaPaciente(privatePatient.id);
    expect(
      deuda.pending.some((item) => item.appointmentId === turno.id),
    ).toBe(false);
  });

  it("bloquea la corrección si la deuda ya fue cobrada", async () => {
    const turno = await crearTurno(privatePatient.id);
    boundary.actor = doctorProfile;

    await registrarAsistencia(
      formData({ appointmentId: turno.id, estado: "AUSENTE" }),
    );

    const payment = await prisma.payment.findUniqueOrThrow({
      where: { appointmentId: turno.id },
    });
    await cobrarDeudaInasistencia(payment.id);

    await expect(
      registrarAsistencia(
        formData({ appointmentId: turno.id, estado: "ATENDIDO" }),
      ),
    ).rejects.toThrow(/ya fue cobrada/i);

    const saved = await prisma.appointment.findUniqueOrThrow({
      where: { id: turno.id },
      include: { payment: true },
    });
    expect(saved.status).toBe(AppointmentState.AUSENTE);
    expect(saved.payment?.status).toBe(PaymentStatus.APROBADO);
  });

  it("no agrega deuda si la consulta ya estaba abonada", async () => {
    const turno = await crearTurno(privatePatient.id);
    await prisma.payment.create({
      data: {
        appointmentId: turno.id,
        amount: FEE,
        paymentMethod: "tarjeta",
        status: PaymentStatus.APROBADO,
        concept: PaymentConcept.CONSULTA,
        paidAt: new Date(),
        registeredById: privatePatient.id,
      },
    });

    boundary.actor = doctorProfile;
    await registrarAsistencia(
      formData({ appointmentId: turno.id, estado: "AUSENTE" }),
    );

    const payment = await prisma.payment.findUniqueOrThrow({
      where: { appointmentId: turno.id },
    });
    expect(payment.concept).toBe(PaymentConcept.CONSULTA);
    expect(payment.status).toBe(PaymentStatus.APROBADO);
  });

  it("el administrador puede cobrar o condonar una deuda pendiente", async () => {
    const turnoCobro = await crearTurno(privatePatient.id);
    const turnoCondonado = await crearTurno(privatePatient.id);
    boundary.actor = doctorProfile;

    await registrarAsistencia(
      formData({ appointmentId: turnoCobro.id, estado: "AUSENTE" }),
    );
    await registrarAsistencia(
      formData({ appointmentId: turnoCondonado.id, estado: "AUSENTE" }),
    );

    const cobro = await prisma.payment.findUniqueOrThrow({
      where: { appointmentId: turnoCobro.id },
    });
    const condonado = await prisma.payment.findUniqueOrThrow({
      where: { appointmentId: turnoCondonado.id },
    });

    const cobrada = await cobrarDeudaInasistencia(cobro.id);
    const anulada = await condonarDeudaInasistencia(condonado.id);

    expect(cobrada.status).toBe(PaymentStatus.APROBADO);
    expect(cobrada.paidAt).not.toBeNull();
    expect(anulada.status).toBe(PaymentStatus.ANULADO);
    expect(anulada.paidAt).toBeNull();
  });

  it("no permite imputar inasistencia a un turno que no está ausente", async () => {
    const turno = await crearTurno(privatePatient.id);

    await expect(
      prisma.$transaction((tx) =>
        generarCargoInasistencia(tx, turno.id, admin.id),
      ),
    ).rejects.toBeInstanceOf(PaymentRuleError);
  });
});
