import { describe, expect, it } from "vitest";
import { UserRole } from "@/generated/prisma/enums";
import {
  AREA_PER_ROLE,
  EXERCISABLE_ROLES,
  ROLES_CON_OBJETIVO,
  ROLE_LABELS,
  areaForRole,
  canExerciseAs,
  isExercisableRole,
  requiresTarget,
} from "@/lib/permissions";

describe("US-7.5 / RF-26: matriz de permisos por area", () => {
  it("cada area del portal pertenece a un unico rol", () => {
    expect(AREA_PER_ROLE).toEqual({
      admin: UserRole.ADMINISTRADOR,
      medico: UserRole.MEDICO,
      enfermera: UserRole.ENFERMERA,
      paciente: UserRole.PACIENTE,
    });
  });

  it("el administrador ejerce medico, enfermera y paciente; no su propio rol", () => {
    expect([...EXERCISABLE_ROLES].sort()).toEqual(
      [UserRole.MEDICO, UserRole.ENFERMERA, UserRole.PACIENTE].sort(),
    );
    expect(isExercisableRole(UserRole.ADMINISTRADOR)).toBe(false);
    expect(isExercisableRole("SUPERADMIN")).toBe(false);
    expect(isExercisableRole(undefined)).toBe(false);
  });

  it("el medico y el paciente necesitan un objetivo; la enfermera no", () => {
    expect(requiresTarget(UserRole.MEDICO)).toBe(true);
    expect(requiresTarget(UserRole.PACIENTE)).toBe(true);
    expect(requiresTarget(UserRole.ENFERMERA)).toBe(false);
    expect([...ROLES_CON_OBJETIVO].sort()).toEqual(
      [UserRole.MEDICO, UserRole.PACIENTE].sort(),
    );
  });

  it("solo el administrador puede ejercer otro rol (CA2)", () => {
    for (const role of EXERCISABLE_ROLES) {
      expect(canExerciseAs(UserRole.ADMINISTRADOR, role)).toBe(true);
    }

    for (const realRole of [UserRole.MEDICO, UserRole.ENFERMERA, UserRole.PACIENTE]) {
      for (const target of EXERCISABLE_ROLES) {
        expect(canExerciseAs(realRole, target)).toBe(false);
      }
    }

    expect(canExerciseAs(UserRole.ADMINISTRADOR, UserRole.ADMINISTRADOR)).toBe(false);
  });

  it("resuelve el area de cada rol", () => {
    expect(areaForRole(UserRole.ADMINISTRADOR)).toBe("admin");
    expect(areaForRole(UserRole.MEDICO)).toBe("medico");
    expect(areaForRole(UserRole.ENFERMERA)).toBe("enfermera");
    expect(areaForRole(UserRole.PACIENTE)).toBe("paciente");
  });

  it("expone una etiqueta para cada rol", () => {
    expect(Object.keys(ROLE_LABELS).sort()).toEqual(
      [
        UserRole.ADMINISTRADOR,
        UserRole.MEDICO,
        UserRole.ENFERMERA,
        UserRole.PACIENTE,
      ].sort(),
    );
    expect(ROLE_LABELS[UserRole.MEDICO]).toBe("Médico");
  });
});
