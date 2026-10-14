// @vitest-environment jsdom
import { randomUUID } from "node:crypto";
import { Children, isValidElement, type ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import type { UserProfile } from "@/generated/prisma/client";
import { AlertStatus, AppointmentState, MovementType, UserRole, Specialty } from "@/generated/prisma/enums";
import { createVaccineWithInitialLot, registerStockMovement, StockRuleError } from "@/lib/stock";
import HistorialPage from "@/app/(portal)/paciente/historial/page";
import ClinicalHistoryTable, { type ClinicalHistoryEntry } from "@/app/(portal)/paciente/historial/clinical-history-table";
import { createStockMovement, getLotAvailability } from "@/app/(portal)/enfermera/inventario/actions";
import { MovementForm } from "@/app/(portal)/enfermera/inventario/movement-form";

// Solo se simulan la identidad y la invalidación de Next. Prisma, SQL, triggers,
// dominio, guard, acciones y componentes son reales. Esto no autentica una sesión.
const boundary = vi.hoisted(() => ({ actor: null as UserProfile | null, revalidate: vi.fn() }));
vi.mock("@/lib/dev-actor", () => ({ getCurrentActor: async () => boundary.actor }));
vi.mock("next/cache", () => ({ revalidatePath: boundary.revalidate }));

let nurse: UserProfile, otherNurse: UserProfile, patientA: UserProfile, patientB: UserProfile;
const future = () => new Date(Date.now() + 365 * 86_400_000);

beforeAll(async () => {
  async function profile(role: UserRole, firstName: string, dni: string) {
    return prisma.userProfile.create({ data: {
      firstName, lastName: "Prueba", dni, role,
      email: `${dni}@example.invalid`, clerkUserId: `fixture-${dni}`,
    } });
  }
  nurse = await profile(UserRole.ENFERMERA, "Operador A", "11111111");
  otherNurse = await profile(UserRole.ENFERMERA, "Operador B", "22222222");
  patientA = await profile(UserRole.PACIENTE, "Paciente A", "33333333");
  patientB = await profile(UserRole.PACIENTE, "Paciente B", "44444444");
  const doctorProfile = await profile(UserRole.MEDICO, "Martín", "55555555");
  await prisma.patient.create({ data: { id: patientA.id } });
  await prisma.patient.create({ data: { id: patientB.id } });
  await prisma.doctor.create({ data: {
    id: doctorProfile.id, licenseNumber: "MATRICULA-FICTICIA", specialty: Specialty.CLINICO,
    consultDuration: 30, consultFee: 100,
  } });
  // Duración y fechas son datos del fixture, no una definición de DU-11.
  for (let i = 0; i < 8; i++) {
    const startsAt = new Date(Date.now() + 86_400_000 + i * 3_600_000);
    await prisma.appointment.create({ data: {
      patientId: i < 7 ? patientA.id : patientB.id, doctorId: doctorProfile.id,
      startsAt, endsAt: new Date(startsAt.getTime() + 30 * 60_000),
      status: AppointmentState.ATENDIDO, reservedById: nurse.id, attendanceAt: startsAt,
      clinicalRecord: { create: {
        diagnosis: `Infección compartida ${i < 7 ? "EXCLUSIVO-A" : "EXCLUSIVO-B"}-${i}`,
        treatment: "Reposo", indications: i < 7 ? "Indicaciones privadas A" : "Indicaciones privadas B",
      } },
    } });
  }
});

beforeEach(() => { boundary.actor = nurse; boundary.revalidate.mockClear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function clientEntries(node: ReactNode): ClinicalHistoryEntry[] | null {
  let found: ClinicalHistoryEntry[] | null = null;
  Children.forEach(node, (child) => {
    if (!isValidElement<{ records?: ClinicalHistoryEntry[]; children?: ReactNode }>(child)) return;
    if (child.type === ClinicalHistoryTable) found = child.props.records ?? null;
    else if (!found) found = clientEntries(child.props.children);
  });
  return found;
}
function search(query: string) {
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: query } });
  fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
}

describe("SIG-MEJ-02.3: aislamiento del servidor con PostgreSQL real", () => {
  it.each(["A", "B"])("solo envía al cliente el historial de %s aunque comparta diagnóstico/profesional", async (patient) => {
    boundary.actor = patient === "A" ? patientA : patientB;
    const view = await HistorialPage();
    const entries = clientEntries(view)!;
    expect(entries).toHaveLength(patient === "A" ? 7 : 1);
    expect(entries.every((entry) => entry.diagnosis.includes(`EXCLUSIVO-${patient}`))).toBe(true);
    expect(JSON.stringify(entries)).not.toContain(`EXCLUSIVO-${patient === "A" ? "B" : "A"}`);
    expect(Object.keys(entries[0]).sort()).toEqual(["date", "diagnosis", "doctor", "id", "indications", "specialty", "treatment"]);
    render(view); search("infeccion martin");
    expect(screen.queryAllByText(/EXCLUSIVO-/).length).toBeGreaterThan(0);
    search(`EXCLUSIVO-${patient === "A" ? "B" : "A"}`);
    expect(screen.getByText("0 resultados")).toBeTruthy();
  });

  it("reinicia estado y datos del historial al cambiar de paciente, incluso desde página 2", async () => {
    boundary.actor = patientA;
    const rendered = render(await HistorialPage());
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText("2 / 2")).toBeTruthy();
    boundary.actor = patientB;
    rendered.rerender(await HistorialPage());
    expect(screen.getByText(/EXCLUSIVO-B/)).toBeTruthy();
    expect(screen.queryByText(/EXCLUSIVO-A/)).toBeNull();
    expect(screen.getByText("1 / 1")).toBeTruthy();
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("");
  });

  it("no conserva consulta, filtro ni indicaciones del paciente anterior", async () => {
    boundary.actor = patientA;
    const rendered = render(await HistorialPage());
    search("EXCLUSIVO-A-6");
    fireEvent.click(screen.getByRole("radio", { name: "Con indicaciones" }));
    fireEvent.click(screen.getByRole("button", { name: "Detalle" }));
    expect(screen.getByText("Indicaciones privadas A")).toBeTruthy();
    boundary.actor = patientB; rendered.rerender(await HistorialPage());
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("");
    expect((screen.getByRole("radio", { name: "Todas" }) as HTMLInputElement).checked).toBe(true);
    expect(screen.queryByText("Indicaciones privadas A")).toBeNull();
    expect(screen.getByText(/EXCLUSIVO-B/)).toBeTruthy();
  });

  it("sin identidad no entrega registros y retira el historial ya visible", async () => {
    boundary.actor = patientA; const rendered = render(await HistorialPage());
    boundary.actor = null;
    const view = await HistorialPage();
    expect(clientEntries(view)).toBeNull();
    rendered.rerender(view);
    expect(screen.queryByText(/EXCLUSIVO-/)).toBeNull();
    expect(screen.queryByRole("searchbox")).toBeNull();
  });

  it.each([UserRole.MEDICO, UserRole.ENFERMERA, UserRole.ADMINISTRADOR])(
    "preserva el guard actual para %s; no define la futura matriz de US-7.5", async (role) => {
      boundary.actor = { ...nurse, role };
      const view = await HistorialPage();
      expect(clientEntries(view)).toBeNull();
    },
  );
});

async function inventory(quantity: number, criticalLevel: number | null = null) {
  const name = `Vacuna ficticia ${randomUUID()}`;
  await createVaccineWithInitialLot({ name, laboratory: "Laboratorio ficticio", criticalLevel,
    lotNumber: "LOTE-PRUEBA", expiresAt: future(), quantity, actorId: nurse.id });
  const vaccine = await prisma.vaccine.findUniqueOrThrow({ where: { name } });
  const lot = await prisma.vaccineLot.findUniqueOrThrow({ where: { vaccineId_lotNumber: { vaccineId: vaccine.id, lotNumber: "LOTE-PRUEBA" } } });
  return { vaccine, lot };
}
function movement(vaccineId: string, quantity: number, actorId = nurse.id) {
  return { vaccineId, lotNumber: "LOTE-PRUEBA", expiresAt: null, quantity,
    movementType: MovementType.AJUSTE, reason: "Corrección de prueba", actorId };
}
function form(vaccineId: string, quantity: string) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ vaccineId, movementType: "AJUSTE", operation: "DESCONTAR", lotNumber: "LOTE-PRUEBA", expiresAt: "", quantity, reason: "Corrección de prueba", actorId: otherNurse.id })) data.set(key, value);
  return data;
}
async function balance(lotId: string) {
  const lot = await prisma.vaccineLot.findUniqueOrThrow({ where: { id: lotId } });
  const movements = await prisma.stockMovement.findMany({ where: { lotId }, orderBy: { createdAt: "asc" } });
  const sum = movements.reduce((total, entry) => total + entry.quantity, 0);
  expect(lot.quantityAvailable).toBe(sum);
  return { quantity: lot.quantityAvailable, movements };
}
async function compete(lotId: string, operations: () => Promise<unknown>[]) {
  let unlock!: () => void, ready!: () => void;
  const gate = new Promise<void>((resolve) => { unlock = resolve; });
  const locked = new Promise<void>((resolve) => { ready = resolve; });
  const blocker = prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id_lote FROM lote WHERE id_lote = ${lotId}::uuid FOR UPDATE`;
    ready(); await gate;
  }, { timeout: 10_000 });
  await locked;
  const pending = Promise.allSettled(operations());
  let waiting = 0;
  try {
    const deadline = Date.now() + 4_000;
    while (waiting < 2 && Date.now() < deadline) {
      const rows = await prisma.$queryRaw<{ count: number }[]>`SELECT count(*)::integer AS count FROM pg_stat_activity WHERE wait_event_type = 'Lock'`;
      waiting = rows[0].count;
      if (waiting < 2) await new Promise((resolve) => setTimeout(resolve, 20));
    }
  } finally { unlock(); await blocker; }
  const results = await pending;
  expect(waiting).toBeGreaterThanOrEqual(2); // Demuestra dos conexiones concurrentes, no promesas serializadas.
  return results;
}

describe("DU-07: lectura de disponibilidad con PostgreSQL real", () => {
  it("separa lotes con el mismo número en vacunas distintas y lee el saldo actualizado", async () => {
    const first = await inventory(6);
    const second = await inventory(23);
    expect(await getLotAvailability(first.vaccine.id, "  LOTE-PRUEBA  ")).toEqual({ status: "available", quantityAvailable: 6 });
    expect(await getLotAvailability(second.vaccine.id, "LOTE-PRUEBA")).toEqual({ status: "available", quantityAvailable: 23 });
    await createStockMovement({}, form(first.vaccine.id, "2"));
    expect(await getLotAvailability(first.vaccine.id, "LOTE-PRUEBA")).toEqual({ status: "available", quantityAvailable: 4 });
    expect((await balance(first.lot.id)).quantity).toBe(4);
  });
  it("distingue cero persistido de lote inexistente sin crear movimientos al consultar", async () => {
    const { vaccine, lot } = await inventory(3);
    await registerStockMovement(movement(vaccine.id, -3));
    expect(await getLotAvailability(vaccine.id, "LOTE-PRUEBA")).toEqual({ status: "available", quantityAvailable: 0 });
    expect(await getLotAvailability(vaccine.id, "NO-EXISTE")).toEqual({ status: "not-found" });
    expect((await balance(lot.id)).movements).toHaveLength(2);
  });
  it("la lectura respeta el guard actual sin resolver sesión real o su fallback", async () => {
    const { vaccine } = await inventory(3);
    boundary.actor = patientA;
    expect(await getLotAvailability(vaccine.id, "LOTE-PRUEBA")).toMatchObject({ status: "error", message: expect.stringMatching(/enfermeras/) });
  });
});

describe("SIG-MEJ-03.3: stock, transacciones y trazabilidad con PostgreSQL real", () => {
  it("rechaza descuento mayor al stock como error de formulario, con saldo y movimientos intactos", async () => {
    const { vaccine, lot } = await inventory(4);
    const error = await registerStockMovement(movement(vaccine.id, -5)).catch((error: unknown) => error);
    expect(error).toMatchObject({ fields: { quantity: expect.stringMatching(/dosis|stock/i) } });
    const state = await balance(lot.id);
    expect(state.quantity).toBe(4); expect(state.movements).toHaveLength(1);
  });

  it("la acción conserva los valores al fallar y no invalida la caché", async () => {
    const { vaccine, lot } = await inventory(2);
    const result = await createStockMovement({}, form(vaccine.id, "3"));
    expect(result.errors?.quantity).toMatch(/dosis|stock/i);
    expect(result.values).toMatchObject({ operation: "DESCONTAR", quantity: "3", lotNumber: "LOTE-PRUEBA" });
    expect(boundary.revalidate).not.toHaveBeenCalled();
    expect((await balance(lot.id)).quantity).toBe(2);
  });

  it("descontar exactamente lo disponible llega a cero y registra actor, lote, fecha, motivo y signo", async () => {
    const { vaccine, lot } = await inventory(3); const startedAt = Date.now();
    const result = await createStockMovement({}, form(vaccine.id, "3"));
    expect(result.message).toBe("Se descontaron 3 dosis del lote.");
    const state = await balance(lot.id); expect(state.quantity).toBe(0);
    const adjustment = state.movements.find((entry) => entry.type === MovementType.AJUSTE)!;
    expect(adjustment).toMatchObject({ lotId: lot.id, actorId: nurse.id, quantity: -3, reason: "Corrección de prueba" });
    // El actorId agregado al FormData se ignora: el responsable viene del guard del servidor.
    expect(adjustment.actorId).not.toBe(otherNurse.id);
    expect(adjustment.createdAt.getTime()).toBeGreaterThanOrEqual(startedAt - 1_000);
    expect(adjustment.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    expect(boundary.revalidate).toHaveBeenCalledWith("/enfermera/inventario");
  });

  it("el formulario muestra el rechazo real, preserva los valores y permite un reintento válido", async () => {
    const { vaccine, lot } = await inventory(2);
    render(<MovementForm vaccines={[{ id: vaccine.id, name: vaccine.name }]} />);
    fireEvent.change(screen.getByLabelText("Seleccionar Vacuna del Catálogo"), { target: { value: vaccine.id } });
    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "AJUSTE" } });
    fireEvent.click(screen.getByRole("radio", { name: "Descontar dosis" }));
    fireEvent.change(screen.getByLabelText("Lote"), { target: { value: "LOTE-PRUEBA" } });
    fireEvent.change(screen.getByLabelText("Cantidad"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Motivo"), { target: { value: "Corrección de prueba" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Registrar Movimiento" })); });
    const error = await screen.findByRole("alert"); expect(error.textContent).toMatch(/dosis|stock/i);
    expect((screen.getByLabelText("Cantidad") as HTMLInputElement).value).toBe("3");
    expect((await balance(lot.id)).quantity).toBe(2);
    fireEvent.change(screen.getByLabelText("Cantidad"), { target: { value: "2" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Registrar Movimiento" })); });
    expect(await screen.findByText("Se descontaron 2 dosis del lote.")).toBeTruthy();
    expect((await balance(lot.id)).quantity).toBe(0);
  });

  it("dos descuentos concurrentes que superan el saldo dejan un éxito y un rechazo comprensible", async () => {
    const { vaccine, lot } = await inventory(8);
    const results = await compete(lot.id, () => [
      registerStockMovement(movement(vaccine.id, -5)), registerStockMovement(movement(vaccine.id, -5, otherNurse.id)),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(StockRuleError);
    expect(rejected.reason.fields.quantity).toMatch(/dosis|stock/i);
    const state = await balance(lot.id); expect(state.quantity).toBe(3); expect(state.movements).toHaveLength(2);
  });

  it("dos descuentos concurrentes válidos se registran sin deadlock y llegan a cero", async () => {
    const { vaccine, lot } = await inventory(10);
    const results = await compete(lot.id, () => [
      registerStockMovement(movement(vaccine.id, -5)), registerStockMovement(movement(vaccine.id, -5, otherNurse.id)),
    ]);
    const failures = results.filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) => {
        const error = result.reason as { name?: string; code?: string; meta?: unknown };
        return { name: error.name, code: error.code, meta: error.meta };
      });
    expect(failures, JSON.stringify(failures)).toHaveLength(0);
    const state = await balance(lot.id); expect(state.quantity).toBe(0); expect(state.movements).toHaveLength(3);
    expect(state.movements.filter((entry) => entry.type === MovementType.AJUSTE).map((entry) => entry.actorId).sort())
      .toEqual([nurse.id, otherNurse.id].sort());
  });

  it("un fallo después de crear un lote revierte ese lote y no convierte errores ajenos en falta de stock", async () => {
    const { vaccine } = await inventory(3);
    await expect(registerStockMovement({ ...movement(vaccine.id, 2_147_483_648), movementType: MovementType.INGRESO,
      lotNumber: "LOTE-ROLLBACK", expiresAt: future() })).rejects.not.toBeInstanceOf(StockRuleError);
    expect(await prisma.vaccineLot.findUnique({ where: { vaccineId_lotNumber: { vaccineId: vaccine.id, lotNumber: "LOTE-ROLLBACK" } } })).toBeNull();
  });

  it("los movimientos persisten como append-only y el saldo permanece consistente", async () => {
    const { lot } = await inventory(3); const state = await balance(lot.id); const id = state.movements[0].id;
    await expect(prisma.stockMovement.update({ where: { id }, data: { quantity: 9 } })).rejects.toThrow(/append-only/);
    await expect(prisma.stockMovement.delete({ where: { id } })).rejects.toThrow(/append-only/);
    expect((await balance(lot.id)).quantity).toBe(3);
  });

  it("un descuento rechazado no altera alertas y una reposición conserva la resolución vigente", async () => {
    const { vaccine, lot } = await inventory(5, 2);
    await registerStockMovement(movement(vaccine.id, -3));
    const alerts = await prisma.stockAlert.findMany({ where: { vaccineId: vaccine.id } });
    expect(alerts).toHaveLength(1); expect(alerts[0]).toMatchObject({ status: AlertStatus.ACTIVA, stockWhenGenerated: 2 });
    await expect(registerStockMovement(movement(vaccine.id, -3))).rejects.toBeInstanceOf(StockRuleError);
    expect(await prisma.stockAlert.findMany({ where: { vaccineId: vaccine.id } })).toEqual(alerts);
    await registerStockMovement(movement(vaccine.id, 3));
    expect((await balance(lot.id)).quantity).toBe(5);
    expect(await prisma.stockAlert.findUnique({ where: { id: alerts[0].id } })).toMatchObject({ status: AlertStatus.RESUELTA, resolvedAt: expect.any(Date) });
  });

  it("un rol no autorizado no registra movimientos desde la acción", async () => {
    const { vaccine, lot } = await inventory(3); boundary.actor = patientA;
    const result = await createStockMovement({}, form(vaccine.id, "1"));
    expect(result.message).toMatch(/Solo las enfermeras/);
    expect((await balance(lot.id)).movements).toHaveLength(1);
  });
});
