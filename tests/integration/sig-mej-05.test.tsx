// @vitest-environment jsdom
// SIG-MEJ-05: al reservar, el turno queda confirmado sin pedir confirmación de asistencia.
// Prisma, SQL, triggers, acciones y componentes son reales sobre una base aislada.
import { randomUUID } from "node:crypto";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import type { UserProfile } from "@/generated/prisma/client";
import { AppointmentState, Speciality, UserRole } from "@/generated/prisma/enums";
import { reservarTurno } from "@/app/(portal)/paciente/turnos/actions";
import InteractiveBooking from "@/app/(portal)/paciente/turnos/interactive-booking";
import MisTurnosPage from "@/app/(portal)/paciente/mis-turnos/page";

const boundary = vi.hoisted(() => {
  const jar = new Map<string, string>();
  return {
    actor: null as UserProfile | null,
    revalidate: vi.fn(),
    push: vi.fn(),
    jar,
    cookies: {
      get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
      set: (name: string, value: string) => void jar.set(name, value),
      delete: (name: string) => void jar.delete(name),
      has: (name: string) => jar.has(name),
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    },
  };
});

vi.mock("@/lib/actor", () => ({ getCurrentActor: async () => boundary.actor }));
vi.mock("next/cache", () => ({ revalidatePath: boundary.revalidate }));
vi.mock("next/headers", () => ({ cookies: async () => boundary.cookies }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: boundary.push }) }));

let patient: UserProfile, doctor: UserProfile;

/** Fecha YYYY-MM-DD de un día hábil futuro (el calendario no ofrece fines de semana). */
function futureWeekday(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

beforeAll(async () => {
  async function profile(role: UserRole, firstName: string, dni: string) {
    return prisma.userProfile.create({
      data: {
        firstName,
        lastName: "Mejora",
        dni,
        role,
        email: `${dni}-${randomUUID()}@example.invalid`,
        clerkUserId: `fixture-${dni}-${randomUUID()}`,
      },
    });
  }

  doctor = await profile(UserRole.MEDICO, "Bruno", "92000001");
  patient = await profile(UserRole.PACIENTE, "Carla", "92000002");

  await prisma.doctor.create({
    data: {
      id: doctor.id,
      licenseNumber: `MAT-${randomUUID()}`,
      speciality: Speciality.CLINICO,
      consultDuration: 30,
      consultFee: 100,
    },
  });
  await prisma.patient.create({ data: { id: patient.id } });
});

beforeEach(() => {
  boundary.actor = patient;
  boundary.jar.clear();
  boundary.revalidate.mockClear();
  boundary.push.mockClear();
});

afterEach(() => cleanup());

describe("SIG-MEJ-05: la reserva nace confirmada", () => {
  it("CA1: reservar desde el formulario deja el turno CONFIRMADO y lo muestra en Mis turnos", async () => {
    const date = futureWeekday(2);
    render(
      <InteractiveBooking
        medicos={[
          {
            id: doctor.id,
            speciality: Speciality.CLINICO,
            name: "Dr. Mejora, Bruno",
            schedules: [],
          },
        ]}
        initialDate={date}
        turnosDB={[]}
      />,
    );

    fireEvent.click(screen.getByText("13:00 hs"));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Reservar turno" }));
    });

    await waitFor(() =>
      expect(boundary.push).toHaveBeenCalledWith("/paciente/mis-turnos?reservado=1"),
    );

    const cookie = boundary.cookies.get("sigmed_recent_turnos");
    expect(cookie).toBeDefined();
    const recent = JSON.parse(cookie!.value)[0];
    expect(recent).toMatchObject({ status: AppointmentState.CONFIRMADO });

    const created = await prisma.appointment.findUniqueOrThrow({ where: { id: recent.id } });
    expect(created.status).toBe(AppointmentState.CONFIRMADO);

    cleanup();
    render(await MisTurnosPage());

    expect(screen.getByText("Confirmado")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Confirmar asistencia" })).toBeNull();
    expect(screen.getByRole("button", { name: "Darse de baja" })).toBeTruthy();
  });

  it("CA2: la reserva directa crea el turno CONFIRMADO sin pasar por RESERVADO", async () => {
    const formData = new FormData();
    formData.set("doctorId", doctor.id);
    formData.set("startsAt", `${futureWeekday(4)}T14:00:00-03:00`);

    const result = await reservarTurno(formData);
    expect(result.success).toBe(true);

    const created = await prisma.appointment.findUniqueOrThrow({
      where: { id: result.appointmentId },
    });
    expect(created.status).toBe(AppointmentState.CONFIRMADO);
    expect(created.status).not.toBe(AppointmentState.RESERVADO);
  });
});
