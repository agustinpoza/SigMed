import { UserRole } from "@/generated/prisma/enums";

/**
 * Areas del portal. Cada area pertenece a un rol y se valida con la matriz de
 * esta tabla (RF-26 / US-7.5).
 */
export type PortalArea = "admin" | "medico" | "enfermera" | "paciente";

/** Rol que habilita cada area del portal. */
export const AREA_PER_ROLE: Record<PortalArea, UserRole> = {
  admin: UserRole.ADMINISTRADOR,
  medico: UserRole.MEDICO,
  enfermera: UserRole.ENFERMERA,
  paciente: UserRole.PACIENTE,
};

/**
 * Roles que el administrador puede ejercer (RF-26). El administrador no puede
 * ejercer el rol de administrador: su area ya es propia.
 */
export const EXERCISABLE_ROLES: readonly UserRole[] = [
  UserRole.MEDICO,
  UserRole.ENFERMERA,
  UserRole.PACIENTE,
];

/**
 * Roles que operan sobre los datos de un profesional o de un paciente concreto.
 * El medico y el paciente no tienen ficha propia por la que la aplicacion pueda
 * inferir el contexto, asi que hay que elegirlo al entrar.
 */
export const ROLES_CON_OBJETIVO: readonly UserRole[] = [
  UserRole.MEDICO,
  UserRole.PACIENTE,
];

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMINISTRADOR]: "Administrador",
  [UserRole.MEDICO]: "Médico",
  [UserRole.ENFERMERA]: "Enfermera",
  [UserRole.PACIENTE]: "Paciente",
};

export function isExercisableRole(role: unknown): role is UserRole {
  return (
    typeof role === "string" &&
    (EXERCISABLE_ROLES as readonly string[]).includes(role)
  );
}

/** El rol necesita un profesional o un paciente de contexto. */
export function requiresTarget(role: UserRole): boolean {
  return ROLES_CON_OBJETIVO.includes(role);
}

/**
 * Solo el administrador puede ejercer otro rol (CA2). Ningun otro rol puede
 * asumir permisos que no son suyos.
 */
export function canExerciseAs(realRole: UserRole, targetRole: UserRole): boolean {
  return realRole === UserRole.ADMINISTRADOR && isExercisableRole(targetRole);
}

/** Area del portal a la que pertenece un rol. */
export function areaForRole(role: UserRole): PortalArea | null {
  const entry = (Object.entries(AREA_PER_ROLE) as [PortalArea, UserRole][]).find(
    ([, required]) => required === role,
  );

  return entry ? entry[0] : null;
}
