// Constantes puras: sin imports de runtime de Prisma para poder usarse desde componentes de cliente.
import type { UserRole } from "@/generated/prisma/client";

// RF-24: el administrador solo da de alta médicos y enfermeras. Los pacientes
// se auto-registran y los administradores no se crean desde el portal.
export const STAFF_ROLES = ["MEDICO", "ENFERMERA"] as const satisfies readonly UserRole[];

export type StaffRole = (typeof STAFF_ROLES)[number];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  MEDICO: "Médico",
  ENFERMERA: "Enfermera",
};

export function isStaffRole(value: string): value is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value);
}
