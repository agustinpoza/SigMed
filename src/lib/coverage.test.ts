import { describe, expect, it } from "vitest";
import { evaluarCobertura } from "@/lib/coverage";
import { CoverageStatus } from "@/generated/prisma/enums";

const pampora = { name: "Pampora Salud", accepted: true };
const noAceptada = { name: "Obra Social del Este", accepted: false };

describe("US-4.2: clasificación de la cobertura", () => {
  it("solo una cobertura validada, aceptada y con afiliado cuenta como cubierta", () => {
    const evaluacion = evaluarCobertura({
      insurance: pampora,
      memberNumber: "PAMP-88213",
      coverageStatus: CoverageStatus.VALIDADA,
    });

    expect(evaluacion.state).toBe("CUBIERTA");
    expect(evaluacion.covered).toBe(true);
    expect(evaluacion.requiresPrivatePayment).toBe(false);
  });

  it("una cobertura rechazada nunca cuenta como cubierta", () => {
    const evaluacion = evaluarCobertura({
      insurance: pampora,
      memberNumber: "PAMP-88213",
      coverageStatus: CoverageStatus.RECHAZADA,
    });

    expect(evaluacion.state).toBe("NO_VALIDA");
    expect(evaluacion.covered).toBe(false);
    expect(evaluacion.requiresPrivatePayment).toBe(true);
  });

  it("una obra social no aceptada es cobertura no válida aunque figure validada", () => {
    const evaluacion = evaluarCobertura({
      insurance: noAceptada,
      memberNumber: "OSE-123",
      coverageStatus: CoverageStatus.VALIDADA,
    });

    expect(evaluacion.state).toBe("NO_VALIDA");
    expect(evaluacion.covered).toBe(false);
  });

  it("la falta de número de afiliado vuelve la cobertura inválida", () => {
    const evaluacion = evaluarCobertura({
      insurance: pampora,
      memberNumber: "   ",
      coverageStatus: CoverageStatus.VALIDADA,
    });

    expect(evaluacion.state).toBe("INVALIDA");
    expect(evaluacion.covered).toBe(false);
  });

  it("una cobertura validada sin estado registrado es inválida", () => {
    const evaluacion = evaluarCobertura({
      insurance: pampora,
      memberNumber: "PAMP-88213",
      coverageStatus: null,
    });

    expect(evaluacion.state).toBe("INVALIDA");
    expect(evaluacion.covered).toBe(false);
  });

  it("la validación pendiente no cubre ni habilita el pago particular", () => {
    const evaluacion = evaluarCobertura({
      insurance: pampora,
      memberNumber: "PAMP-88213",
      coverageStatus: CoverageStatus.PENDIENTE,
    });

    expect(evaluacion.state).toBe("PENDIENTE");
    expect(evaluacion.covered).toBe(false);
    expect(evaluacion.requiresPrivatePayment).toBe(false);
  });

  it("un paciente sin obra social tiene consulta particular", () => {
    const evaluacion = evaluarCobertura({
      insurance: null,
      memberNumber: null,
      coverageStatus: null,
    });

    expect(evaluacion.state).toBe("SIN_COBERTURA");
    expect(evaluacion.covered).toBe(false);
    expect(evaluacion.requiresPrivatePayment).toBe(true);
  });
});
