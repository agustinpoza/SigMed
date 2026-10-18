// src/lib/doctor-agenda.ts
// US-1.2 / RF-02: publicacion automatica de la agenda publica de consultas.
//
// La agenda publica es una transformacion directa de la configuracion de
// disponibilidad del medico (RF-01): sus franjas semanales (`horario_atencion`)
// y la duracion de consulta. El sistema reparte cada franja en turnos de esa
// duracion y publica solo los que quedan libres: sin turno reservado, sin
// bloqueo de agenda y en el futuro.
//
// Sin dependencias de Next, igual que vaccination.ts y stock.ts, para poder
// ejercitarla desde Server Components, Server Actions y scripts de prueba.

import { prisma } from "@/lib/db";
import { AppointmentState, Specialty, Weekday } from "@/generated/prisma/enums";

// ---------------------------------------------------------------------------
// Fechas: la sala trabaja en hora de Argentina (UTC-3, sin horario de verano)
// ---------------------------------------------------------------------------

const CLINIC_TZ = "-03:00";
const CLINIC_OFFSET_MS = -3 * 60 * 60 * 1000;

// Indice = Date.getUTCDay() (0 = domingo)
const WEEKDAY_BY_JS_DAY: Weekday[] = [
  Weekday.DOMINGO,
  Weekday.LUNES,
  Weekday.MARTES,
  Weekday.MIERCOLES,
  Weekday.JUEVES,
  Weekday.VIERNES,
  Weekday.SABADO,
];

/** Estados que ocupan un horario: todos menos CANCELADO. */
const OCCUPIED_STATUSES: AppointmentState[] = [
  AppointmentState.CONFIRMADO,
  AppointmentState.RESERVADO,
  AppointmentState.ATENDIDO,
  AppointmentState.AUSENTE,
];

function isDateOnly(fecha: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && !Number.isNaN(Date.parse(fecha));
}

/** "2026-10-06" + 545 min -> Date de 2026-10-06 09:05 hora Argentina */
function clinicDateTime(fecha: string, minutes: number): Date {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return new Date(`${fecha}T${hh}:${mm}:00${CLINIC_TZ}`);
}

/** Date -> "YYYY-MM-DD" en hora Argentina */
function toClinicDateString(d: Date): string {
  return new Date(d.getTime() + CLINIC_OFFSET_MS).toISOString().slice(0, 10);
}

/** Hoy en hora Argentina, "AAAA-MM-DD". Default del filtro por fecha. */
export function clinicToday(): string {
  return toClinicDateString(new Date());
}

function clinicWeekday(fecha: string): Weekday {
  // Mediodia en Argentina = 15:00 UTC, siempre el mismo dia calendario
  return WEEKDAY_BY_JS_DAY[new Date(`${fecha}T12:00:00${CLINIC_TZ}`).getUTCDay()];
}

/** Columnas @db.Time llegan como Date 1970-01-01THH:MM:00Z */
function timeToMinutes(value: Date): number {
  return value.getUTCHours() * 60 + value.getUTCMinutes();
}

function formatMinutes(minutes: number): string {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function dayRange(fecha: string) {
  return { gte: clinicDateTime(fecha, 0), lt: clinicDateTime(fecha, 24 * 60) };
}

// ---------------------------------------------------------------------------
// Derivacion de la agenda publica
// ---------------------------------------------------------------------------

export type DoctorSlot = { time: string; startsAt: Date };

type ScheduleRow = { startTime: Date; endTime: Date };
type BlockRow = { startsAt: Date; endsAt: Date };

/** Reparte cada franja del dia en turnos de `consultDuration` minutos. */
export function buildDoctorSlots(
  fecha: string,
  schedules: ScheduleRow[],
  consultDuration: number,
): DoctorSlot[] {
  if (consultDuration <= 0) return [];

  const slots: DoctorSlot[] = [];
  for (const s of schedules) {
    const start = timeToMinutes(s.startTime);
    const end = timeToMinutes(s.endTime);
    // El turno tiene que terminar dentro de la franja
    for (let m = start; m + consultDuration <= end; m += consultDuration) {
      slots.push({ time: formatMinutes(m), startsAt: clinicDateTime(fecha, m) });
    }
  }
  return slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

/** Publica solo los turnos libres: futuros, sin reserva y sin bloqueo. */
export function filterAvailableDoctorSlots(
  slots: DoctorSlot[],
  opts: {
    consultDuration: number;
    takenStarts: Date[];
    blocks: BlockRow[];
    now: Date;
  },
): DoctorSlot[] {
  const taken = new Set(opts.takenStarts.map((d) => d.getTime()));
  const slotMs = opts.consultDuration * 60_000;

  return slots.filter((slot) => {
    const start = slot.startsAt.getTime();
    if (start <= opts.now.getTime()) return false;
    if (taken.has(start)) return false;
    // Un bloqueo solapa el turno cuando empieza antes de que el turno termine
    // y termina despues de que el turno empieza.
    const end = start + slotMs;
    const blocked = opts.blocks.some(
      (b) => b.startsAt.getTime() < end && b.endsAt.getTime() > start,
    );
    return !blocked;
  });
}

/** Turnos disponibles publicados para un medico en una fecha. */
export async function getAvailableDoctorSlots(
  doctorId: string,
  fecha: string,
  now: Date = new Date(),
): Promise<DoctorSlot[]> {
  if (!isDateOnly(fecha)) return [];

  const [doctor, schedules, taken, blocks] = await Promise.all([
    prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { consultDuration: true },
    }),
    prisma.doctorSchedule.findMany({
      where: { doctorId, weekday: clinicWeekday(fecha) },
      select: { startTime: true, endTime: true },
    }),
    prisma.appointment.findMany({
      where: {
        doctorId,
        status: { in: OCCUPIED_STATUSES },
        startsAt: dayRange(fecha),
      },
      select: { startsAt: true },
    }),
    prisma.scheduleBlock.findMany({
      where: {
        doctorId,
        startsAt: { lt: clinicDateTime(fecha, 24 * 60) },
        endsAt: { gt: clinicDateTime(fecha, 0) },
      },
      select: { startsAt: true, endsAt: true },
    }),
  ]);

  if (!doctor) return [];

  const slots = buildDoctorSlots(fecha, schedules, doctor.consultDuration);
  return filterAvailableDoctorSlots(slots, {
    consultDuration: doctor.consultDuration,
    takenStarts: taken.map((t) => t.startsAt),
    blocks,
    now,
  });
}

// ---------------------------------------------------------------------------
// Datos para el selector de la agenda publica
// ---------------------------------------------------------------------------

export type DoctorOption = {
  id: string;
  name: string;
  specialty: Specialty;
};

/** Medicos con sus datos para el selector de la agenda publica. */
export async function listDoctors(): Promise<DoctorOption[]> {
  const doctors = await prisma.doctor.findMany({
    orderBy: [{ specialty: "asc" }, { profile: { lastName: "asc" } }],
    select: {
      id: true,
      specialty: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  });

  return doctors.map((doctor) => ({
    id: doctor.id,
    specialty: doctor.specialty,
    name: `${doctor.profile.lastName}, ${doctor.profile.firstName}`,
  }));
}

export const SPECIALTY_LABELS: Record<Specialty, string> = {
  [Specialty.CLINICO]: "Medicina General",
  [Specialty.PEDIATRA]: "Pediatría",
  [Specialty.TRAUMATOLOGO]: "Traumatología",
};
