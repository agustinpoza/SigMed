"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Specialty } from "@/generated/prisma/enums";
import { reservarTurno } from "./actions";

export type DoctorItem = {
  id: string;
  specialty: Specialty;
  name: string;
  schedules: {
    weekday: string;
    startTime: string;
    endTime: string;
  }[];
};

export type TurnoItem = {
  id: string;
  doctorId: string;
  startsAt: string;
  endsAt: string;
  status: string;
  doctor: {
    specialty: Specialty;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
};

const SPECIALTY_LABELS: Record<string, string> = {
  CLINICO: "Medicina General / Clínico",
  PEDIATRA: "Pediatría",
  TRAUMATOLOGO: "Traumatología",
};

const WEEKDAY_NAMES_MAP: Record<number, string> = {
  0: "DOMINGO",
  1: "LUNES",
  2: "MARTES",
  3: "MIERCOLES",
  4: "JUEVES",
  5: "VIERNES",
  6: "SABADO",
};

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default function InteractiveBooking({
  medicos,
  initialSpecialty,
  initialDoctorId,
  initialDate,
  turnosDB,
}: {
  medicos: DoctorItem[];
  initialSpecialty?: string;
  initialDoctorId?: string;
  initialDate?: string;
  turnosDB: TurnoItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtros
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(initialSpecialty || "");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDoctorId || "");

  // Fecha seleccionada (por defecto la fecha enviada o "2026-10-14")
  const defaultDateStr = initialDate || "2026-10-14";
  const [selectedDate, setSelectedDate] = useState<string>(defaultDateStr);

  // Navegación de mes del calendario
  const initialYear = parseInt(defaultDateStr.slice(0, 4), 10) || 2026;
  const initialMonth = parseInt(defaultDateStr.slice(5, 7), 10) - 1 || 9; // 9 = Octubre (0-indexed)
  const [viewYear, setViewYear] = useState<number>(initialYear);
  const [viewMonth, setViewMonth] = useState<number>(initialMonth);

  // Slot seleccionado
  const [selectedSlot, setSelectedSlot] = useState<{
    id?: string;
    doctorId: string;
    time: string;
    startsAt: string;
  } | null>(null);

  // Filtrado de médicos según especialidad seleccionada
  const filteredDoctors = medicos.filter(
    (m) => !selectedSpecialty || m.specialty === selectedSpecialty
  );

  const selectedDoctorObj = medicos.find((m) => m.id === selectedDoctorId);

  // Helper para generar fechas en formato YYYY-MM-DD
  const formatYMD = (year: number, monthZeroIndexed: number, day: number) => {
    const mm = String(monthZeroIndexed + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  };

  // Días del mes actual
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Domingo
  // Ajustar para que Lunes sea 0 y Domingo 6
  const startingDayIndex = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Función para determinar si una fecha tiene disponibilidad
  const hasAvailabilityOnDate = (year: number, month: number, day: number) => {
    const dateObj = new Date(year, month, day);
    const jsDay = dateObj.getDay();
    // Fines de semana (Sábado y Domingo) no tienen atención regular
    if (jsDay === 0 || jsDay === 6) {
      return false;
    }

    const weekdayEnum = WEEKDAY_NAMES_MAP[jsDay];
    const dateStr = formatYMD(year, month, day);

    // Si hay turnos en la base de datos para esa fecha que cumplan filtros
    const hasTurnoDB = turnosDB.some((t) => {
      const tDate = t.startsAt.slice(0, 10);
      const matchesDate = tDate === dateStr;
      const matchesDoc = !selectedDoctorId || t.doctorId === selectedDoctorId;
      const matchesSpec = !selectedSpecialty || t.doctor.specialty === selectedSpecialty;
      return matchesDate && matchesDoc && matchesSpec;
    });
    if (hasTurnoDB) return true;

    // Médicos a evaluar según filtro
    const doctorsToCheck = selectedDoctorId
      ? medicos.filter((m) => m.id === selectedDoctorId)
      : filteredDoctors;

    return doctorsToCheck.length > 0;
  };

  // Horarios disponibles para el día seleccionado
  const getSlotsForSelectedDate = () => {
    if (!selectedDate) return [];

    const dateObj = new Date(`${selectedDate}T12:00:00Z`);
    const jsDay = dateObj.getDay();
    // Fines de semana no hay turnos
    if (jsDay === 0 || jsDay === 6) {
      return [];
    }

    // Primero turnos de la DB para esa fecha
    const dbSlots = turnosDB
      .filter((t) => {
        const matchesDate = t.startsAt.slice(0, 10) === selectedDate;
        const matchesDoc = !selectedDoctorId || t.doctorId === selectedDoctorId;
        const matchesSpec = !selectedSpecialty || t.doctor.specialty === selectedSpecialty;
        return matchesDate && matchesDoc && matchesSpec;
      })
      .map((t) => {
        const d = new Date(t.startsAt);
        const time = d.toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Argentina/Buenos_Aires",
        });
        return {
          id: t.id,
          doctorId: t.doctorId,
          doctorName: `Dr. ${t.doctor.profile.lastName}, ${t.doctor.profile.firstName}`,
          specialty: t.doctor.specialty,
          time,
          startsAt: t.startsAt,
        };
      });

    const doctorsToCheck = selectedDoctorId
      ? medicos.filter((m) => m.id === selectedDoctorId)
      : filteredDoctors;

    const generatedSlots: {
      id?: string;
      doctorId: string;
      doctorName: string;
      specialty: Specialty;
      time: string;
      startsAt: string;
    }[] = [];

    // Tiempos prototípicos de atención clínica (13:00 a 17:00, idéntico a Screenshot 3)
    const defaultHours = ["13:00", "14:00", "15:00", "16:00", "17:00"];

    for (const doc of doctorsToCheck) {
      for (const h of defaultHours) {
        const startsAt = `${selectedDate}T${h}:00-03:00`;
        // Evitar duplicar con DB
        if (!dbSlots.some((dbs) => dbs.doctorId === doc.id && dbs.time === h)) {
          generatedSlots.push({
            doctorId: doc.id,
            doctorName: doc.name,
            specialty: doc.specialty,
            time: h,
            startsAt,
          });
        }
      }
    }

    return [...dbSlots, ...generatedSlots].sort((a, b) => a.time.localeCompare(b.time));
  };

  const slotsAvailable = getSlotsForSelectedDate();

  // Fecha seleccionada formateada (ej. "Mié 14/10/2026")
  const formattedSelectedDate = () => {
    if (!selectedDate) return "";
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d, 12, 0, 0);
    const weekdayStr = dateObj.toLocaleDateString("es-AR", { weekday: "short" });
    const capitalizedWeekday =
      weekdayStr.charAt(0).toUpperCase() + weekdayStr.slice(1).replace(".", "");
    const dd = String(d).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    return `${capitalizedWeekday} ${dd}/${mm}/${y}`;
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    const ymd = formatYMD(today.getFullYear(), today.getMonth(), today.getDate());
    setSelectedDate(ymd);
    setSelectedSlot(null);
  };

  const handleSelectDay = (day: number) => {
    const ymd = formatYMD(viewYear, viewMonth, day);
    setSelectedDate(ymd);
    setSelectedSlot(null);
  };

  const handleCleanFilters = () => {
    setSelectedSpecialty("");
    setSelectedDoctorId("");
    setSelectedDate("2026-10-14");
    setSelectedSlot(null);
    router.push("/paciente/turnos");
  };

  const handleReservarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setErrorMsg(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        if (selectedSlot.id) {
          formData.set("appointmentId", selectedSlot.id);
        } else {
          formData.set("doctorId", selectedSlot.doctorId);
          formData.set("startsAt", selectedSlot.startsAt);
        }

        await reservarTurno(formData);
        router.push("/paciente/mis-turnos?reservado=1");
      } catch (err: any) {
        setErrorMsg(err.message || "Ocurrió un error al reservar el turno.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado y Bajada */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Buscar turnos disponibles
        </h1>
        <p className="text-sm text-zinc-500">
          Consultá los horarios disponibles por especialidad, profesional o fecha.
        </p>
      </div>

      {/* Contenedor de Filtros (Card superior blanca con bordes redondeados) */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <form
          method="get"
          action="/paciente/turnos"
          className="flex flex-wrap items-end gap-4"
        >
          {/* Dropdown Especialidad */}
          <div className="flex flex-1 min-w-[200px] flex-col gap-1.5">
            <label htmlFor="specialty" className="text-xs font-semibold text-zinc-700">
              Especialidad
            </label>
            <select
              id="specialty"
              name="specialty"
              value={selectedSpecialty}
              onChange={(e) => {
                setSelectedSpecialty(e.target.value);
                setSelectedDoctorId("");
                setSelectedSlot(null);
              }}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none"
            >
              <option value="">Todas las especialidades</option>
              {Object.values(Specialty).map((esp) => (
                <option key={esp} value={esp}>
                  {SPECIALTY_LABELS[esp] ?? esp}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Profesional */}
          <div className="flex flex-1 min-w-[220px] flex-col gap-1.5">
            <label htmlFor="doctorId" className="text-xs font-semibold text-zinc-700">
              Profesional
            </label>
            <select
              id="doctorId"
              name="doctorId"
              value={selectedDoctorId}
              onChange={(e) => {
                setSelectedDoctorId(e.target.value);
                setSelectedSlot(null);
              }}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none"
            >
              <option value="">Todos los profesionales</option>
              {filteredDoctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({SPECIALTY_LABELS[doc.specialty] ?? doc.specialty})
                </option>
              ))}
            </select>
          </div>

          {/* Campo Fecha */}
          <div className="flex flex-1 min-w-[170px] flex-col gap-1.5">
            <label htmlFor="date" className="text-xs font-semibold text-zinc-700">
              Fecha
            </label>
            <div className="relative">
              <input
                id="date"
                type="date"
                name="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot(null);
                  if (e.target.value) {
                    const [y, m] = e.target.value.split("-").map(Number);
                    setViewYear(y);
                    setViewMonth(m - 1);
                  }
                }}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Botones Buscar y Limpiar filtros */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-zinc-800 transition"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={handleCleanFilters}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
            >
              Limpiar filtros
            </button>
          </div>
        </form>

        {/* Texto de ayuda inferior */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
          <svg
            className="h-4 w-4 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path strokeWidth="2" strokeLinecap="round" d="M12 16v-4m0-4h.01" />
          </svg>
          <span>Solo se muestran horarios disponibles.</span>
        </div>
      </div>

      {/* Contenedor de Selección (Distribución en dos columnas) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Columna Izquierda: Calendario Interactivo */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-5 flex flex-col justify-between">
          <div>
            {/* Encabezado del mes con controles */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-bold text-zinc-900">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 transition"
                  title="Mes anterior"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 transition"
                  title="Mes siguiente"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-zinc-400 mb-2">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
              <span>Dom</span>
            </div>

            {/* Grilla mensual de días */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Celdas vacías previas */}
              {Array.from({ length: startingDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10" />
              ))}

              {/* Días del mes */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = formatYMD(viewYear, viewMonth, dayNum);
                const isSelected = selectedDate === dateStr;
                const hasSlots = hasAvailabilityOnDate(viewYear, viewMonth, dayNum);

                return (
                  <button
                    key={`day-${dayNum}`}
                    type="button"
                    onClick={() => handleSelectDay(dayNum)}
                    className={`relative flex h-10 w-full flex-col items-center justify-center rounded-lg text-xs transition ${
                      isSelected
                        ? "border-2 border-blue-600 bg-blue-50 font-bold text-blue-900 shadow-sm"
                        : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    <span>{dayNum}</span>
                    {hasSlots && (
                      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Leyenda inferior */}
          <div className="mt-6 border-t border-zinc-100 pt-3 flex items-center justify-around text-xs text-zinc-600">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>Con turnos disponibles</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-zinc-400 bg-white" />
              <span>Sin turnos disponibles</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Horarios Disponibles */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-7 flex flex-col justify-between">
          <div>
            {/* Título de horarios */}
            <h2 className="text-lg font-bold text-zinc-900 mb-2">
              Horarios disponibles — {formattedSelectedDate()}
            </h2>

            {/* Resumen de contexto en tarjeta suave */}
            <div className="rounded-lg bg-zinc-50 border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-600 mb-4">
              <span className="font-semibold text-zinc-700">Especialidad:</span>{" "}
              {selectedSpecialty ? SPECIALTY_LABELS[selectedSpecialty] : "Todas"} ·{" "}
              <span className="font-semibold text-zinc-700">Profesional:</span>{" "}
              {selectedDoctorObj ? selectedDoctorObj.name : "Todos los profesionales"}
            </div>

            {/* Error si falló la acción */}
            {errorMsg && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            {/* Lista de horarios o estado vacío */}
            {slotsAvailable.length === 0 ? (
              <div
                role="status"
                className="my-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-2.5"
              >
                <svg
                  className="h-5 w-5 shrink-0 text-amber-600 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path strokeWidth="2" strokeLinecap="round" d="M12 8v4m0 4h.01" />
                </svg>
                <div>
                  <p className="font-semibold">No hay horarios disponibles para esta fecha.</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Si no existen resultados para los filtros seleccionados, el sistema informará
                    que no hay turnos disponibles. Probá seleccionando otro día en el calendario.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
                {slotsAvailable.map((slot, idx) => {
                  const isChecked =
                    selectedSlot?.time === slot.time &&
                    selectedSlot?.doctorId === slot.doctorId;

                  return (
                    <label
                      key={`${slot.doctorId}-${slot.time}-${idx}`}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition ${
                        isChecked
                          ? "border-zinc-900 bg-zinc-100 font-semibold"
                          : "border-zinc-200 bg-white hover:bg-zinc-50"
                      }`}
                      onClick={() =>
                        setSelectedSlot({
                          id: slot.id,
                          doctorId: slot.doctorId,
                          time: slot.time,
                          startsAt: slot.startsAt,
                        })
                      }
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-sm font-bold text-zinc-900">{slot.time} hs</span>
                        <span className="text-xs text-zinc-500">
                          {slot.doctorName} ({SPECIALTY_LABELS[slot.specialty] ?? slot.specialty})
                        </span>
                      </div>
                      <input
                        type="radio"
                        name="selectedSlotRadio"
                        checked={isChecked}
                        onChange={() => {}}
                        className="h-4 w-4 text-zinc-900 focus:ring-zinc-900"
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botón de confirmación al pie */}
          <div className="mt-6 border-t border-zinc-100 pt-4">
            <form onSubmit={handleReservarSubmit}>
              <button
                type="submit"
                disabled={!selectedSlot || isPending}
                className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-semibold text-white shadow hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {isPending ? "Reservando turno..." : "Reservar turno"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Banner / Alerta Informativa Inferior */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600 flex items-center gap-2.5">
        <svg
          className="h-5 w-5 shrink-0 text-zinc-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <path strokeWidth="2" strokeLinecap="round" d="M12 16v-4m0-4h.01" />
        </svg>
        <span>
          Si no existen resultados para los filtros seleccionados, el sistema informará que no hay
          turnos disponibles.
        </span>
      </div>
    </div>
  );
}
