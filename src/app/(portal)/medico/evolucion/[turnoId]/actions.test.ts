import { beforeEach, describe, expect, it, vi } from "vitest";
import { registrarEvolucion } from "./actions";

const mocks = vi.hoisted(() => ({
  guard: vi.fn(),
  turno: vi.fn(),
  create: vi.fn(),
  revalidate: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  prisma: { clinicalRecord: { create: mocks.create } },
  isUniqueViolation: (error: unknown) => (error as { code?: string })?.code === "P2002",
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/actor-guard", () => ({ requireMedico: mocks.guard }));
vi.mock("@/lib/clinical-records", () => ({ obtenerTurnoParaEvolucion: mocks.turno }));

const TURNO_ID = "11111111-1111-4111-8111-111111111111";
const PACIENTE_ID = "22222222-2222-4222-8222-222222222222";

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    turnoId: TURNO_ID,
    diagnosis: "Infección respiratoria alta",
    treatment: "Paracetamol 500 mg",
    indications: "Reposo relativo",
    ...overrides,
  })) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.guard.mockResolvedValue({ actor: { id: "medico-1" } });
  mocks.turno.mockResolvedValue({ id: TURNO_ID, patientId: PACIENTE_ID, status: "ATENDIDO", clinicalRecord: null });
  mocks.create.mockResolvedValue({});
});

describe("US-5.1: registrar evolución médica", () => {
  it("CA1: guarda el registro sobre el turno del médico y redirige al historial del paciente", async () => {
    await registrarEvolucion({}, form());
    expect(mocks.turno).toHaveBeenCalledExactlyOnceWith(TURNO_ID, "medico-1");
    expect(mocks.create).toHaveBeenCalledExactlyOnceWith({
      data: {
        appointmentId: TURNO_ID,
        diagnosis: "Infección respiratoria alta",
        treatment: "Paracetamol 500 mg",
        indications: "Reposo relativo",
      },
    });
    expect(mocks.revalidate).toHaveBeenCalledWith(`/medico/pacientes/${PACIENTE_ID}/historial`);
    expect(mocks.redirect).toHaveBeenCalledWith(`/medico/pacientes/${PACIENTE_ID}/historial?registrado=1`);
  });

  it("guarda tratamiento e indicaciones vacíos como null", async () => {
    await registrarEvolucion({}, form({ treatment: "  ", indications: "" }));
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ treatment: null, indications: null }),
    });
  });

  it("exige diagnóstico sin consultar la base", async () => {
    const result = await registrarEvolucion({}, form({ diagnosis: "   " }));
    expect(result.errors?.diagnosis).toBeTruthy();
    expect(result.values?.treatment).toBe("Paracetamol 500 mg");
    expect(mocks.guard).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rechaza textos que superan el máximo", async () => {
    const result = await registrarEvolucion({}, form({ treatment: "x".repeat(2001) }));
    expect(result.errors?.treatment).toBeTruthy();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rechaza un turno con id inválido", async () => {
    const result = await registrarEvolucion({}, form({ turnoId: "no-es-uuid" }));
    expect(result.errors?.turnoId).toBeTruthy();
    expect(mocks.turno).not.toHaveBeenCalled();
  });

  it("CA2: no escribe cuando el actor no es médico", async () => {
    mocks.guard.mockResolvedValue({ error: "Solo los médicos pueden registrar la evolución médica." });
    const result = await registrarEvolucion({}, form());
    expect(result.message).toBe("Solo los médicos pueden registrar la evolución médica.");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("CA2: no escribe en turnos de otro médico", async () => {
    mocks.turno.mockResolvedValue(null);
    const result = await registrarEvolucion({}, form());
    expect(result.message).toBe("El turno no existe o no pertenece a tu agenda.");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it.each(["CONFIRMADO", "RESERVADO", "CANCELADO", "AUSENTE"])("rechaza turnos en estado %s", async (status: string) => {
    mocks.turno.mockResolvedValue({ id: TURNO_ID, patientId: PACIENTE_ID, status, clinicalRecord: null });
    const result = await registrarEvolucion({}, form());
    expect(result.message).toBe("Solo se puede registrar la evolución de un turno atendido.");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("no duplica la evolución de un turno", async () => {
    mocks.turno.mockResolvedValue({ id: TURNO_ID, patientId: PACIENTE_ID, status: "ATENDIDO", clinicalRecord: { id: "r" } });
    const result = await registrarEvolucion({}, form());
    expect(result.message).toBe("Este turno ya tiene una evolución registrada.");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("informa la carrera de doble guardado sin redirigir", async () => {
    mocks.create.mockRejectedValue({ code: "P2002" });
    const result = await registrarEvolucion({}, form());
    expect(result.message).toBe("Este turno ya tiene una evolución registrada.");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
