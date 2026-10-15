// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AssignmentForm } from "./assignment-form";
import type { SlotOption, VaccinationFormState } from "./actions";

const mocks = vi.hoisted(() => ({ slots: vi.fn(), create: vi.fn(), patients: vi.fn() }));
vi.mock("./actions", () => ({
  getAvailableSlots: mocks.slots,
  createVaccinationAppointment: mocks.create,
  searchPatients: mocks.patients,
}));

const firstDate = "2040-10-16";
const secondDate = "2040-10-17";
const slot: SlotOption = { time: "10:00", value: "2040-10-16T13:00:00.000Z" };
const nextSlot: SlotOption = { time: "11:00", value: "2040-10-17T14:00:00.000Z" };
const noSlots = "No hay horarios disponibles para la fecha seleccionada. Elegí otra fecha.";
const loadError = "No se pudieron consultar los horarios. Intentá nuevamente.";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function setup() {
  render(<AssignmentForm vaccines={[{ id: "vacuna", name: "Vacuna de prueba", availableDoses: 10 }]} minDate="2040-01-01" />);
}
function changeDate(value: string) {
  fireEvent.change(screen.getByLabelText("Fecha de vacunacion"), { target: { value } });
}
function schedule() {
  return screen.getByRole("combobox", { name: "Horario asignado" }) as HTMLSelectElement;
}
function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Confirmar turno" }));
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.slots.mockResolvedValue({ slots: [] });
  mocks.patients.mockResolvedValue([]);
});
afterEach(cleanup);

describe("SIG-MEJ-04.1/04.3: disponibilidad del formulario", () => {
  it("informa una fecha sin horarios y bloquea confirmar con el aviso asociado al botón", async () => {
    setup();
    expect(screen.queryByText(noSlots)).toBeNull();
    changeDate(firstDate);
    expect(await screen.findByText(noSlots)).toBeTruthy();
    expect(schedule().disabled).toBe(true);
    const confirm = screen.getByRole("button", { name: "Confirmar turno" });
    expect(confirm.hasAttribute("disabled")).toBe(true);
    expect(confirm.getAttribute("aria-describedby")).toBe("scheduledAt-availability");
    expect(schedule().getAttribute("aria-describedby")).toBe("scheduledAt-availability");
    submit();
    fireEvent.submit(schedule().closest("form")!);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("recupera horarios al cambiar fecha y limpia la selección al volver a un día sin cupos", async () => {
    mocks.slots.mockResolvedValueOnce({ slots: [] }).mockResolvedValueOnce({ slots: [nextSlot] }).mockResolvedValueOnce({ slots: [] });
    setup();
    changeDate(firstDate);
    await screen.findByText(noSlots);
    changeDate(secondDate);
    await screen.findByRole("option", { name: "11:00" });
    expect(screen.queryByText(noSlots)).toBeNull();
    expect(schedule().disabled).toBe(false);
    expect(screen.getByRole("button", { name: "Confirmar turno" }).hasAttribute("disabled")).toBe(false);
    fireEvent.change(schedule(), { target: { value: nextSlot.value } });
    expect(schedule().value).toBe(nextSlot.value);
    changeDate(firstDate);
    await screen.findByText(noSlots);
    expect(schedule().value).toBe("");
    expect(screen.queryByRole("option", { name: "11:00" })).toBeNull();
    expect(screen.getByRole("button", { name: "Confirmar turno" }).hasAttribute("disabled")).toBe(true);
  });

  it("no anuncia día completo ni permite confirmar mientras consulta horarios", async () => {
    const request = deferred<{ slots: SlotOption[] }>();
    mocks.slots.mockReturnValue(request.promise);
    setup();
    changeDate(firstDate);
    expect(screen.getByRole("option", { name: "Buscando horarios..." })).toBeTruthy();
    expect(screen.queryByText(noSlots)).toBeNull();
    expect(screen.getByRole("button", { name: "Confirmar turno" }).hasAttribute("disabled")).toBe(true);
    fireEvent.submit(schedule().closest("form")!);
    expect(mocks.create).not.toHaveBeenCalled();
    await act(async () => request.resolve({ slots: [slot] }));
    expect(schedule().disabled).toBe(false);
  });

  it("descarta una respuesta antigua aunque llegue después de la última fecha", async () => {
    const old = deferred<{ slots: SlotOption[] }>();
    mocks.slots.mockReturnValueOnce(old.promise).mockResolvedValueOnce({ slots: [nextSlot] });
    setup();
    changeDate(firstDate);
    changeDate(secondDate);
    await screen.findByRole("option", { name: "11:00" });
    await act(async () => old.resolve({ slots: [] }));
    expect(screen.queryByText(noSlots)).toBeNull();
    expect(screen.getByRole("option", { name: "11:00" })).toBeTruthy();
  });

  it("descarta también el rechazo de una consulta de fecha anterior", async () => {
    const old = deferred<{ slots: SlotOption[] }>();
    mocks.slots.mockReturnValueOnce(old.promise).mockResolvedValueOnce({ slots: [nextSlot] });
    setup();
    changeDate(firstDate);
    changeDate(secondDate);
    await screen.findByRole("option", { name: "11:00" });
    await act(async () => old.reject(new Error("Consulta vieja fallida")));
    expect(screen.queryByText(loadError)).toBeNull();
    expect(schedule().disabled).toBe(false);
  });

  it("distingue un error de consulta y permite recuperarse con otra fecha", async () => {
    mocks.slots.mockRejectedValueOnce(new Error("Sin conexión")).mockResolvedValueOnce({ slots: [nextSlot] });
    setup();
    changeDate(firstDate);
    await screen.findByText(loadError);
    expect(screen.getByRole("alert").textContent).toBe(loadError);
    expect(schedule().getAttribute("aria-describedby")).toBe("scheduledAt-error");
    expect(screen.queryByText(noSlots)).toBeNull();
    const confirm = screen.getByRole("button", { name: "Confirmar turno" });
    expect(confirm.hasAttribute("disabled")).toBe(true);
    expect(confirm.getAttribute("aria-describedby")).toBe("scheduledAt-error");
    fireEvent.submit(schedule().closest("form")!);
    expect(mocks.create).not.toHaveBeenCalled();
    changeDate(secondDate);
    await screen.findByRole("option", { name: "11:00" });
    expect(screen.queryByText(loadError)).toBeNull();
    expect(schedule().getAttribute("aria-invalid")).toBe("false");
    expect(screen.getByRole("button", { name: "Confirmar turno" }).hasAttribute("disabled")).toBe(false);
  });

  it("quita el error de horario obligatorio al seleccionar o cambiar de fecha", async () => {
    mocks.slots.mockResolvedValueOnce({ slots: [slot] }).mockResolvedValueOnce({ slots: [nextSlot] }).mockResolvedValueOnce({ slots: [slot] });
    mocks.create.mockResolvedValue({ errors: { scheduledAt: "El horario es obligatorio." }, values: { date: firstDate } });
    setup();
    changeDate(firstDate);
    await screen.findByRole("option", { name: "10:00" });
    submit();
    await screen.findByText("El horario es obligatorio.");
    fireEvent.change(schedule(), { target: { value: slot.value } });
    expect(screen.queryByText("El horario es obligatorio.")).toBeNull();
    changeDate(secondDate);
    await screen.findByRole("option", { name: "11:00" });
    expect(screen.queryByText("El horario es obligatorio.")).toBeNull();
    changeDate(firstDate);
    await screen.findByRole("option", { name: "10:00" });
    expect(screen.queryByText("El horario es obligatorio.")).toBeNull();
  });

  it("no revive un error de la fecha anterior si la confirmación responde tarde", async () => {
    const result = deferred<VaccinationFormState>();
    mocks.slots.mockResolvedValueOnce({ slots: [slot] }).mockResolvedValueOnce({ slots: [nextSlot] });
    mocks.create.mockReturnValue(result.promise);
    setup();
    changeDate(firstDate);
    await screen.findByRole("option", { name: "10:00" });
    fireEvent.change(schedule(), { target: { value: slot.value } });
    submit();
    changeDate(secondDate);
    await screen.findByRole("option", { name: "11:00" });
    await act(async () => result.resolve({ errors: { scheduledAt: "Ese horario ya fue asignado." }, values: { date: firstDate } }));
    expect(screen.queryByText("Ese horario ya fue asignado.")).toBeNull();
    expect((screen.getByLabelText("Fecha de vacunacion") as HTMLInputElement).value).toBe(secondDate);
    expect(mocks.slots).toHaveBeenCalledTimes(2);
  });

  it("refresca los horarios cuando el servidor rechaza una selección ocupada", async () => {
    mocks.slots.mockResolvedValueOnce({ slots: [slot] }).mockResolvedValueOnce({ slots: [] });
    mocks.create.mockResolvedValue({ errors: { scheduledAt: noSlots }, values: { date: firstDate } });
    setup();
    changeDate(firstDate);
    await screen.findByRole("option", { name: "10:00" });
    fireEvent.change(schedule(), { target: { value: slot.value } });
    submit();
    await screen.findByText(noSlots);
    expect(mocks.slots).toHaveBeenCalledTimes(2);
    expect(schedule().value).toBe("");
    expect(schedule().disabled).toBe(true);
    expect(screen.getAllByText(noSlots)).toHaveLength(1);
  });

  it("conserva la confirmación válida y limpia el formulario después del éxito", async () => {
    mocks.slots.mockResolvedValue({ slots: [slot] });
    mocks.patients.mockResolvedValue([{ id: "paciente", fullName: "Persona de prueba", dni: "12345678" }]);
    mocks.create.mockResolvedValue({ message: "Turno confirmado para la fecha elegida." });
    setup();
    fireEvent.change(screen.getByLabelText("Buscar paciente"), { target: { value: "Persona" } });
    fireEvent.click(await screen.findByRole("button", { name: /Persona de prueba/ }));
    fireEvent.change(screen.getByLabelText("Seleccionar vacuna"), { target: { value: "vacuna" } });
    changeDate(firstDate);
    await screen.findByRole("option", { name: "10:00" });
    fireEvent.change(schedule(), { target: { value: slot.value } });
    submit();
    await screen.findByText("Turno confirmado para la fecha elegida.");
    const submitted = mocks.create.mock.calls[0][1] as FormData;
    expect(submitted.get("patientId")).toBe("paciente");
    expect(submitted.get("vaccineId")).toBe("vacuna");
    expect(submitted.get("scheduledAt")).toBe(slot.value);
    expect((screen.getByLabelText("Fecha de vacunacion") as HTMLInputElement).value).toBe("");
    expect(schedule().value).toBe("");
    expect((screen.getByLabelText("Buscar paciente") as HTMLInputElement).value).toBe("");
  });

  it("cancelar descarta una consulta de horarios todavía pendiente", async () => {
    const request = deferred<{ slots: SlotOption[] }>();
    mocks.slots.mockReturnValue(request.promise);
    setup();
    changeDate(firstDate);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await act(async () => request.resolve({ slots: [slot] }));
    expect((screen.getByLabelText("Fecha de vacunacion") as HTMLInputElement).value).toBe("");
    expect(screen.queryByRole("option", { name: "10:00" })).toBeNull();
    expect(screen.queryByText(noSlots)).toBeNull();
  });
});
