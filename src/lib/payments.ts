import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { evaluarCobertura, type CoverageAssessment } from "@/lib/coverage";
import {
  AppointmentState,
  PaymentConcept,
  PaymentStatus,
} from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

/**
 * US-4.4 / RF-15 y US-4.7 / RF-35.
 *
 * El pago online es simulado: no se integra una pasarela real. La transacción
 * igualmente se persiste con su estado para poder demostrar los tres
 * resultados posibles (aprobado, rechazado y pendiente).
 */

export const PAYMENT_METHOD_ONLINE = "pasarela_online";
export const PAYMENT_METHOD_DEBT = "cuenta_corriente";

export type PaymentResult = "APROBADO" | "RECHAZADO" | "PENDIENTE";

export const PAYMENT_RESULTS: PaymentResult[] = [
  "APROBADO",
  "RECHAZADO",
  "PENDIENTE",
];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDIENTE: "Pendiente",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
  ANULADO: "Anulado",
};

export const PAYMENT_CONCEPT_LABELS: Record<PaymentConcept, string> = {
  CONSULTA: "Consulta particular",
  INASISTENCIA: "Deuda por inasistencia",
};

export class PaymentRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentRuleError";
    Object.setPrototypeOf(this, PaymentRuleError.prototype);
  }
}

function newTransactionCode() {
  return `SIM-${randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
}

const appointmentInclude = {
  doctor: {
    include: { profile: { select: { firstName: true, lastName: true } } },
  },
  patient: { include: { insurance: true } },
  payment: true,
};

async function buscarTurno(appointmentId: string) {
  return prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: appointmentInclude,
  });
}

type TurnoConRelaciones = NonNullable<Awaited<ReturnType<typeof buscarTurno>>>;

export type PaymentSummary = {
  appointmentId: string;
  appointmentStatus: AppointmentState;
  startsAt: Date;
  doctorName: string;
  specialty: string;
  licenseNumber: string;
  amount: number;
  coverage: CoverageAssessment;
  payment: {
    id: string;
    status: PaymentStatus;
    concept: PaymentConcept;
    amount: number;
    paidAt: Date | null;
    transactionCode: string | null;
  } | null;
  canPay: boolean;
  blockedReason: string | null;
};

function armarResumen(turno: TurnoConRelaciones): PaymentSummary {
  const coverage = evaluarCobertura(turno.patient);
  const payment = turno.payment;

  let blockedReason: string | null = null;

  if (payment?.status === PaymentStatus.APROBADO) {
    blockedReason = "El pago de esta consulta ya fue aprobado.";
  } else if (turno.status === AppointmentState.CANCELADO) {
    blockedReason = "El turno está cancelado.";
  } else if (turno.status === AppointmentState.ATENDIDO) {
    blockedReason = "El turno ya fue atendido.";
  } else if (turno.status === AppointmentState.AUSENTE) {
    blockedReason =
      "El turno quedó como ausente: la deuda se gestiona como inasistencia.";
  } else if (turno.status === AppointmentState.RESERVADO) {
    blockedReason = "Primero confirmá el turno para poder abonarlo.";
  } else if (coverage.covered) {
    blockedReason = "La consulta está cubierta por la obra social.";
  } else if (coverage.state === "PENDIENTE") {
    blockedReason =
      "La validación de la cobertura está pendiente. Esperá el resultado antes de abonar.";
  }

  return {
    appointmentId: turno.id,
    appointmentStatus: turno.status,
    startsAt: turno.startsAt,
    doctorName: `${turno.doctor.profile.firstName} ${turno.doctor.profile.lastName}`,
    specialty: turno.doctor.speciality,
    licenseNumber: turno.doctor.licenseNumber,
    amount: Number(turno.doctor.consultFee),
    coverage,
    payment: payment
      ? {
          id: payment.id,
          status: payment.status,
          concept: payment.concept,
          amount: Number(payment.amount),
          paidAt: payment.paidAt,
          transactionCode: payment.transactionCode,
        }
      : null,
    canPay: blockedReason === null,
    blockedReason,
  };
}

/**
 * Resumen previo al pago. Solo devuelve turnos del paciente autenticado.
 */
export async function obtenerResumenPago(
  appointmentId: string,
  patientId: string,
): Promise<PaymentSummary> {
  const turno = await buscarTurno(appointmentId);

  if (!turno || turno.patientId !== patientId) {
    throw new PaymentRuleError("No encontramos el turno indicado para tu cuenta.");
  }

  return armarResumen(turno);
}

/**
 * Registra el intento de pago online. El monto sale siempre del arancel del
 * médico que atiende el turno. El estado se persiste tal como lo devuelve la
 * pasarela simulada.
 */
export async function registrarPagoConsulta(input: {
  appointmentId: string;
  patientId: string;
  actorId: string;
  result: PaymentResult;
}) {
  if (!PAYMENT_RESULTS.includes(input.result)) {
    throw new PaymentRuleError("Resultado de pago inválido.");
  }

  return prisma.$transaction(async (tx) => {
    const turno = await tx.appointment.findUnique({
      where: { id: input.appointmentId },
      include: appointmentInclude,
    });

    if (!turno || turno.patientId !== input.patientId) {
      throw new PaymentRuleError(
        "No encontramos el turno indicado para tu cuenta.",
      );
    }

    const resumen = armarResumen(turno);

    if (!resumen.canPay) {
      throw new PaymentRuleError(
        resumen.blockedReason ?? "El turno no admite un pago online.",
      );
    }

    const status = input.result as PaymentStatus;
    const data = {
      amount: turno.doctor.consultFee,
      paymentMethod: PAYMENT_METHOD_ONLINE,
      transactionCode: newTransactionCode(),
      status,
      concept: PaymentConcept.CONSULTA,
      paidAt: status === PaymentStatus.APROBADO ? new Date() : null,
      registeredById: input.actorId,
    };

    return tx.payment.upsert({
      where: { appointmentId: turno.id },
      create: { appointmentId: turno.id, ...data },
      update: data,
    });
  });
}

/**
 * US-4.7: al quedar ausente se imputa la deuda por el valor total de la
 * consulta. La operación es idempotente: nunca duplica el cargo de un turno.
 */
export async function generarCargoInasistencia(
  tx: Prisma.TransactionClient,
  appointmentId: string,
  actorId: string,
) {
  const turno = await tx.appointment.findUnique({
    where: { id: appointmentId },
    include: { doctor: true, payment: true },
  });

  if (!turno) {
    throw new PaymentRuleError("El turno indicado no existe.");
  }

  if (turno.status !== AppointmentState.AUSENTE) {
    throw new PaymentRuleError(
      "Solo un turno marcado como ausente genera una deuda por inasistencia.",
    );
  }

  const existing = turno.payment;

  // Ya hay un pago aprobado (consulta abonada o deuda cobrada): no se agrega
  // otro cargo. La política de no show no reintegra lo ya pagado.
  if (existing?.status === PaymentStatus.APROBADO) {
    return { payment: existing, created: false };
  }

  // El cargo ya existe y sigue pendiente: no se duplica.
  if (
    existing?.concept === PaymentConcept.INASISTENCIA &&
    existing.status === PaymentStatus.PENDIENTE
  ) {
    return { payment: existing, created: false };
  }

  const cargo = {
    amount: turno.doctor.consultFee,
    paymentMethod: PAYMENT_METHOD_DEBT,
    transactionCode: null,
    status: PaymentStatus.PENDIENTE,
    concept: PaymentConcept.INASISTENCIA,
    paidAt: null,
    registeredById: actorId,
  };

  if (existing) {
    // Un intento rechazado/pendiente de consulta o una deuda anulada se
    // reutiliza: la relación pago-turno es única.
    const payment = await tx.payment.update({
      where: { id: existing.id },
      data: cargo,
    });
    return { payment, created: false };
  }

  const payment = await tx.payment.create({
    data: { appointmentId: turno.id, ...cargo },
  });

  return { payment, created: true };
}

/**
 * Corregir una ausencia a "atendido" retira la deuda mientras siga impaga. Si
 * ya fue cobrada no se permite la corrección: primero debe resolverse el cobro.
 */
export async function anularCargoInasistencia(
  tx: Prisma.TransactionClient,
  appointmentId: string,
) {
  const payment = await tx.payment.findUnique({ where: { appointmentId } });

  if (!payment || payment.concept !== PaymentConcept.INASISTENCIA) {
    return null;
  }

  if (payment.status === PaymentStatus.APROBADO) {
    throw new PaymentRuleError(
      "La deuda por inasistencia ya fue cobrada: no se puede corregir la asistencia.",
    );
  }

  if (payment.status === PaymentStatus.ANULADO) {
    return payment;
  }

  return tx.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.ANULADO,
      paidAt: null,
      transactionCode: null,
    },
  });
}

export type PatientDebt = {
  totalPending: number;
  pending: Array<{
    id: string;
    amount: number;
    appointmentId: string;
    startsAt: Date;
    doctorName: string;
    speciality: string;
    status: PaymentStatus;
  }>;
};

/** Deuda vigente del paciente: solo los cargos por inasistencia impagos. */
export async function obtenerDeudaPaciente(
  patientId: string,
): Promise<PatientDebt> {
  const payments = await prisma.payment.findMany({
    where: {
      concept: PaymentConcept.INASISTENCIA,
      status: { in: [PaymentStatus.PENDIENTE, PaymentStatus.APROBADO] },
      appointment: { patientId },
    },
    include: {
      appointment: {
        include: {
          doctor: {
            include: { profile: { select: { firstName: true, lastName: true } } },
          },
        },
      },
    },
    orderBy: { registeredAt: "desc" },
  });

  const pending = payments
    .filter((payment) => payment.status === PaymentStatus.PENDIENTE)
    .map((payment) => ({
      id: payment.id,
      amount: Number(payment.amount),
      appointmentId: payment.appointmentId,
      startsAt: payment.appointment.startsAt,
      doctorName: `${payment.appointment.doctor.profile.firstName} ${payment.appointment.doctor.profile.lastName}`,
      speciality: payment.appointment.doctor.speciality,
      status: payment.status,
    }));

  return {
    totalPending: pending.reduce((total, item) => total + item.amount, 0),
    pending,
  };
}

/** Listado administrativo de cargos por inasistencia (US-4.7). */
export async function listarCargosInasistencia() {
  return prisma.payment.findMany({
    where: { concept: PaymentConcept.INASISTENCIA },
    include: {
      appointment: {
        include: {
          patient: { include: { profile: true } },
          doctor: { include: { profile: true } },
        },
      },
    },
    orderBy: { registeredAt: "desc" },
  });
}

/** El administrador registra el cobro de una deuda pendiente. */
export async function cobrarDeudaInasistencia(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

  if (!payment || payment.concept !== PaymentConcept.INASISTENCIA) {
    throw new PaymentRuleError("El cargo por inasistencia no existe.");
  }

  if (payment.status !== PaymentStatus.PENDIENTE) {
    throw new PaymentRuleError("Solo se puede cobrar una deuda pendiente.");
  }

  return prisma.payment.update({
    where: { id: payment.id },
    data: { status: PaymentStatus.APROBADO, paidAt: new Date() },
  });
}

/** El administrador condona una deuda pendiente (queda anulada, no borrada). */
export async function condonarDeudaInasistencia(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

  if (!payment || payment.concept !== PaymentConcept.INASISTENCIA) {
    throw new PaymentRuleError("El cargo por inasistencia no existe.");
  }

  if (payment.status !== PaymentStatus.PENDIENTE) {
    throw new PaymentRuleError("Solo se puede condonar una deuda pendiente.");
  }

  return prisma.payment.update({
    where: { id: payment.id },
    data: { status: PaymentStatus.ANULADO, paidAt: null },
  });
}
