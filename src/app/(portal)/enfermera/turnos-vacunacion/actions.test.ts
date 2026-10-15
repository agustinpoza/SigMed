import { beforeEach, describe, expect, it, vi } from "vitest";
import { VaccinationRuleError } from "@/lib/vaccination";
import { createVaccinationAppointment, getAvailableSlots } from "./actions";

const mocks = vi.hoisted(() => ({
  slots: vi.fn(),
  assign: vi.fn(),
  actor: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/lib/actor", () => ({ getCurrentActor: mocks.actor }));
vi.mock("@/lib/vaccination", () => ({
  getFreeSlots: mocks.slots,
  assignVaccinationAppointment: mocks.assign,
  cancelVaccinationAppointment: vi.fn(),
  VaccinationRuleError: class extends Error {
    constructor(readonly fields: Record<string, string>) {
      super("Regla de vacunación");
    }
  },
}));

const date = "2040-10-16";
const startsAt = new Date(`${date}T10:00:00-03:00`);
const available = [{ time: "10:00", startsAt }];
const noSlots = "No hay horarios disponibles para la fecha seleccionada. Elegí otra fecha.";
const loadError = "No se pudieron consultar los horarios. Intentá nuevamente.";

function form(values: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    patientId: "11111111-1111-4111-8111-111111111111",
    vaccineId: "22222222-2222-4222-8222-222222222222",
    date,
    ...values,
  })) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.slots.mockResolvedValue(available);
  mocks.actor.mockResolvedValue({ id: "operador-identificado" });
  mocks.assign.mockResolvedValue({ id: "turno" });
});

describe("SIG-MEJ-04.2: validación de confirmación", () => {
  it("informa día sin cupos, no horario obligatorio, y no crea un turno", async () => {
    mocks.slots.mockResolvedValue([]);
    const result = await createVaccinationAppointment({}, form());
    expect(result.errors).toEqual({ scheduledAt: noSlots });
    expect(result.values?.date).toBe(date);
    expect(mocks.assign).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("rechaza un envío directo con un horario cuando el día ya no tiene cupos", async () => {
    mocks.slots.mockResolvedValue([]);
    const result = await createVaccinationAppointment({}, form({ scheduledAt: startsAt.toISOString() }));
    expect(result.errors?.scheduledAt).toBe(noSlots);
    expect(mocks.assign).not.toHaveBeenCalled();
  });

  it("solo exige elegir horario cuando existen opciones", async () => {
    const result = await createVaccinationAppointment({}, form());
    expect(result.errors).toEqual({ scheduledAt: "El horario es obligatorio." });
    expect(mocks.slots).toHaveBeenCalledWith(date);
    expect(mocks.assign).not.toHaveBeenCalled();
  });

  it.each(["", "fecha inválida", "2040-02-30"])("informa fecha inválida (%s) sin anunciar falta de cupos", async (invalid) => {
    const result = await createVaccinationAppointment({}, form({ date: invalid }));
    expect(result.errors?.date).toBeTruthy();
    expect(result.errors?.scheduledAt).toBeUndefined();
    expect(mocks.slots).not.toHaveBeenCalled();
    expect(mocks.assign).not.toHaveBeenCalled();
  });

  it("distingue un fallo de consulta de un día completo", async () => {
    mocks.slots.mockRejectedValue(new Error("Consulta fallida"));
    const result = await createVaccinationAppointment({}, form());
    expect(result.errors?.scheduledAt).toBe(loadError);
    expect(mocks.assign).not.toHaveBeenCalled();
  });

  it("rechaza un horario ocupado o perteneciente a otra fecha", async () => {
    const result = await createVaccinationAppointment({}, form({ scheduledAt: "2040-10-17T13:00:00Z" }));
    expect(result.errors?.scheduledAt).toBe("Ese horario ya no está disponible. Elegí otro horario.");
    expect(mocks.assign).not.toHaveBeenCalled();
  });

  it("conserva la asignación existente cuando fecha y horario son válidos", async () => {
    const data = form({ scheduledAt: startsAt.toISOString() });
    const result = await createVaccinationAppointment({}, data);
    expect(result.errors).toBeUndefined();
    expect(result.message).toContain("Turno confirmado");
    expect(mocks.assign).toHaveBeenCalledExactlyOnceWith({
      patientId: data.get("patientId"),
      vaccineId: data.get("vaccineId"),
      scheduledAt: startsAt,
      actorId: "operador-identificado",
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/enfermera/turnos-vacunacion");
    expect(mocks.revalidate).toHaveBeenCalledWith("/enfermera/inventario");
  });

  it("no asigna sin actor, aunque exista un horario válido", async () => {
    mocks.actor.mockResolvedValue(null);
    const result = await createVaccinationAppointment({}, form({ scheduledAt: startsAt.toISOString() }));
    expect(result.message).toContain("No hay una sesión activa");
    expect(mocks.assign).not.toHaveBeenCalled();
  });

  it("conserva el rechazo de concurrencia de la capa de asignación", async () => {
    mocks.assign.mockRejectedValue(new VaccinationRuleError({ scheduledAt: "Ese horario ya fue asignado." }));
    const result = await createVaccinationAppointment({}, form({ scheduledAt: startsAt.toISOString() }));
    expect(result.errors?.scheduledAt).toBe("Ese horario ya fue asignado.");
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});

describe("SIG-MEJ-04: consulta de horarios", () => {
  it("devuelve horarios con el formato que necesita el formulario", async () => {
    expect(await getAvailableSlots(date)).toEqual({ slots: [{ time: "10:00", value: startsAt.toISOString() }] });
  });

  it("distingue disponibilidad vacía de consulta fallida", async () => {
    mocks.slots.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error("Sin conexión"));
    expect(await getAvailableSlots(date)).toEqual({ slots: [] });
    expect(await getAvailableSlots(date)).toEqual({ slots: [], error: loadError });
  });

  it.each([null, 42, "", "2040-02-30"])("rechaza fechas inválidas (%s) sin consultar la base", async (value) => {
    const result = await getAvailableSlots(value);
    expect(result.error).toBeTruthy();
    expect(mocks.slots).not.toHaveBeenCalled();
  });
});
