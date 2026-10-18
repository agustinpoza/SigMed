import { describe, expect, it, vi } from "vitest";

// US-1.2: la derivacion de la agenda publica es logica pura; se evita
// instanciar el cliente real de Prisma.
vi.mock("@/lib/db", () => ({ prisma: {} }));

import {
  buildDoctorSlots,
  clinicToday,
  filterAvailableDoctorSlots,
} from "@/lib/doctor-agenda";

const fecha = "2040-10-16";
/** Valor de una columna @db.Time: Date en 1970-01-01THH:MM:00Z */
const t = (hhmm: string) => new Date(`1970-01-01T${hhmm}:00.000Z`);
/** Un instante del dia en hora de Argentina. */
const at = (hhmm: string) => new Date(`${fecha}T${hhmm}:00-03:00`);
const times = (slots: { time: string }[]) => slots.map((s) => s.time);

describe("US-1.2: derivacion de la agenda publica (RF-02)", () => {
  describe("buildDoctorSlots", () => {
    it("reparte cada franja en turnos de la duracion de consulta", () => {
      const slots = buildDoctorSlots(
        fecha,
        [{ startTime: t("09:00"), endTime: t("11:00") }],
        30,
      );
      expect(times(slots)).toEqual(["09:00", "09:30", "10:00", "10:30"]);
      expect(slots[0].startsAt.toISOString()).toBe(at("09:00").toISOString());
    });

    it("descarta el ultimo turno si no entra completo en la franja", () => {
      const slots = buildDoctorSlots(
        fecha,
        [{ startTime: t("09:00"), endTime: t("09:50") }],
        30,
      );
      expect(times(slots)).toEqual(["09:00"]);
    });

    it("ordena por horario los turnos de varias franjas", () => {
      const slots = buildDoctorSlots(
        fecha,
        [
          { startTime: t("15:00"), endTime: t("16:00") },
          { startTime: t("09:00"), endTime: t("10:00") },
        ],
        30,
      );
      expect(times(slots)).toEqual(["09:00", "09:30", "15:00", "15:30"]);
    });

    it("no genera turnos con una duracion invalida", () => {
      const slots = buildDoctorSlots(
        fecha,
        [{ startTime: t("09:00"), endTime: t("10:00") }],
        0,
      );
      expect(slots).toEqual([]);
    });
  });

  describe("filterAvailableDoctorSlots", () => {
    const slots = buildDoctorSlots(
      fecha,
      [{ startTime: t("09:00"), endTime: t("11:00") }],
      30,
    );
    const base = { consultDuration: 30, takenStarts: [], blocks: [], now: at("00:00") };

    it("excluye los turnos ya reservados", () => {
      const free = filterAvailableDoctorSlots(slots, {
        ...base,
        takenStarts: [at("10:00")],
      });
      expect(times(free)).toEqual(["09:00", "09:30", "10:30"]);
    });

    it("excluye los turnos pasados", () => {
      const free = filterAvailableDoctorSlots(slots, { ...base, now: at("09:30") });
      expect(times(free)).toEqual(["10:00", "10:30"]);
    });

    it("excluye los turnos que solapan un bloqueo de agenda", () => {
      const free = filterAvailableDoctorSlots(slots, {
        ...base,
        blocks: [{ startsAt: at("09:30"), endsAt: at("10:30") }],
      });
      expect(times(free)).toEqual(["09:00", "10:30"]);
    });

    it("un bloqueo puntual excluye solo el turno que cubre", () => {
      const free = filterAvailableDoctorSlots(slots, {
        ...base,
        blocks: [{ startsAt: at("09:30"), endsAt: at("10:00") }],
      });
      expect(times(free)).toEqual(["09:00", "10:00", "10:30"]);
    });
  });

  describe("clinicToday", () => {
    it("devuelve una fecha AAAA-MM-DD", () => {
      expect(clinicToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
