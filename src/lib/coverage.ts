import { CoverageStatus } from "@/generated/prisma/enums";

/**
 * US-4.2 / RF-14: clasificación de la cobertura de un paciente.
 *
 * La distinción es deliberada: una cobertura que no está validada nunca cuenta
 * como cubierta. "No válida" describe un rechazo de la obra social; "inválida"
 * describe datos incompletos o inconsistentes. Ambas quedan fuera de cobertura.
 */
export type CoverageState =
  | "CUBIERTA"
  | "NO_VALIDA"
  | "PENDIENTE"
  | "SIN_COBERTURA"
  | "INVALIDA";

export type CoverageInput = {
  coverageStatus: CoverageStatus | null;
  memberNumber: string | null;
  insurance: { name: string; accepted: boolean } | null;
};

export type CoverageAssessment = {
  state: CoverageState;
  /** Solo una cobertura validada, aceptada y con afiliado cuenta como cubierta. */
  covered: boolean;
  label: string;
  detail: string;
  /** La consulta se abona como particular (no hay cobertura que la respalde). */
  requiresPrivatePayment: boolean;
};

export const COVERAGE_STATE_LABELS: Record<CoverageState, string> = {
  CUBIERTA: "Cobertura válida",
  NO_VALIDA: "Cobertura no válida",
  PENDIENTE: "Validación pendiente",
  SIN_COBERTURA: "Sin cobertura",
  INVALIDA: "Cobertura inválida",
};

export const COVERAGE_BADGE_CLASSES: Record<CoverageState, string> = {
  CUBIERTA: "border-emerald-300 bg-emerald-50 text-emerald-800",
  NO_VALIDA: "border-red-300 bg-red-50 text-red-700",
  PENDIENTE: "border-amber-300 bg-amber-50 text-amber-800",
  SIN_COBERTURA: "border-zinc-300 bg-zinc-50 text-zinc-700",
  INVALIDA: "border-orange-300 bg-orange-50 text-orange-800",
};

export function evaluarCobertura(input: CoverageInput): CoverageAssessment {
  const { coverageStatus, memberNumber, insurance } = input;
  const hasMemberNumber = Boolean(memberNumber && memberNumber.trim());

  if (!insurance) {
    return hasMemberNumber
      ? {
          state: "INVALIDA",
          covered: false,
          label: COVERAGE_STATE_LABELS.INVALIDA,
          detail: "Hay un número de afiliado registrado pero no hay obra social asociada.",
          requiresPrivatePayment: true,
        }
      : {
          state: "SIN_COBERTURA",
          covered: false,
          label: COVERAGE_STATE_LABELS.SIN_COBERTURA,
          detail: "El paciente no registró una obra social: la consulta es particular.",
          requiresPrivatePayment: true,
        };
  }

  if (!insurance.accepted) {
    return {
      state: "NO_VALIDA",
      covered: false,
      label: COVERAGE_STATE_LABELS.NO_VALIDA,
      detail: `${insurance.name} no está aceptada por la institución.`,
      requiresPrivatePayment: true,
    };
  }

  if (!hasMemberNumber) {
    return {
      state: "INVALIDA",
      covered: false,
      label: COVERAGE_STATE_LABELS.INVALIDA,
      detail: `Falta el número de afiliado de ${insurance.name}.`,
      requiresPrivatePayment: true,
    };
  }

  if (coverageStatus === null || coverageStatus === undefined) {
    return {
      state: "INVALIDA",
      covered: false,
      label: COVERAGE_STATE_LABELS.INVALIDA,
      detail: `La cobertura con ${insurance.name} no fue validada.`,
      requiresPrivatePayment: true,
    };
  }

  if (coverageStatus === CoverageStatus.PENDIENTE) {
    return {
      state: "PENDIENTE",
      covered: false,
      label: COVERAGE_STATE_LABELS.PENDIENTE,
      detail: `La validación de la cobertura con ${insurance.name} está pendiente.`,
      requiresPrivatePayment: false,
    };
  }

  if (coverageStatus === CoverageStatus.RECHAZADA) {
    return {
      state: "NO_VALIDA",
      covered: false,
      label: COVERAGE_STATE_LABELS.NO_VALIDA,
      detail: `${insurance.name} rechazó la cobertura del paciente.`,
      requiresPrivatePayment: true,
    };
  }

  return {
    state: "CUBIERTA",
    covered: true,
    label: COVERAGE_STATE_LABELS.CUBIERTA,
    detail: `Cobertura validada con ${insurance.name}.`,
    requiresPrivatePayment: false,
  };
}
