import { UserRole } from "@/generated/prisma/enums";

/** Página de inicio de cada rol dentro del portal. */
export const HOME_PER_ROLE: Record<UserRole, string> = {
  [UserRole.ENFERMERA]: "/enfermera/vacunas",
  [UserRole.ADMINISTRADOR]: "/admin/horarios",
  [UserRole.MEDICO]: "/medico/agenda",
  [UserRole.PACIENTE]: "/paciente/historial",
};

export function homeForRole(role: UserRole): string {
  return HOME_PER_ROLE[role] ?? HOME_PER_ROLE[UserRole.PACIENTE];
}
