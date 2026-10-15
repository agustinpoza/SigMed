import { UserRole } from "@/generated/prisma/enums";

/** Página de inicio de cada rol dentro del portal. */
export const HOME_PER_ROLE: Record<UserRole, string> = {
  [UserRole.ENFERMERA]: "/enfermera",
  [UserRole.ADMINISTRADOR]: "/admin",
  [UserRole.MEDICO]: "/medico",
  [UserRole.PACIENTE]: "/paciente",
};

export function homeForRole(role: UserRole): string {
  return HOME_PER_ROLE[role] ?? HOME_PER_ROLE[UserRole.PACIENTE];
}
