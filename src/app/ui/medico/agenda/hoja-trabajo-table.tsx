// app/ui/medico/agenda/hoja-trabajo-table.tsx
"use client";
import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registrarAsistencia } from "@/app/(portal)/medico/agenda/actions";

export type DoctorTurnoRow = {
  id: string;
  time: string;
  patientName: string;
  specialty: string;
  status: "ATENDIDO" | "AUSENTE" | "CONFIRMADO" | "RESERVADO" | "PENDIENTE" | string;
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

const WEEKDAY_NAMES = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

export default function HojaTrabajoTable({
  initialTurnos,
  formattedDate,
  isoDate,
  availableDates = [],
}: {
  initialTurnos: DoctorTurnoRow[];
  formattedDate: string;
  isoDate: string;
  availableDates?: string[];
}) {
  const router = useRouter();
  const [turnos, setTurnos] = useState<DoctorTurnoRow[]>(initialTurnos);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Estado del calendario cliqueable
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Parsear fecha actual seleccionada para inicializar vista de mes del calendario
  const [selYear, selMonth, selDay] = isoDate.split("-").map(Number);
  const [calYear, setCalYear] = useState<number>(selYear || 2026);
  const [calMonth, setCalMonth] = useState<number>(selMonth ? selMonth - 1 : 9);

  // Cerrar el popover al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    }
    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendar]);

  // Actualizar lista si cambian las props iniciales (ej. al navegar entre fechas)
  useEffect(() => {
    setTurnos(initialTurnos);
  }, [initialTurnos]);

  const handleCambiarAsistencia = (appointmentId: string, nuevoEstado: "ATENDIDO" | "AUSENTE") => {
    setPendingId(`${appointmentId}-${nuevoEstado}`);
    setFeedbackMsg(null);

    // Optimistic update
    setTurnos((prev) =>
      prev.map((t) => (t.id === appointmentId ? { ...t, status: nuevoEstado } : t))
    );

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("appointmentId", appointmentId);
        formData.set("estado", nuevoEstado);

        await registrarAsistencia(formData);

        setFeedbackMsg({
          type: "success",
          text: `Asistencia actualizada: el paciente fue marcado como ${nuevoEstado.toLowerCase()}.`,
        });
      } catch (err: any) {
        if (!appointmentId.startsWith("demo-")) {
          setFeedbackMsg({
            type: "error",
            text: err.message || "Error al registrar asistencia.",
          });
        }
      } finally {
        setPendingId(null);
      }
    });
  };

  // Navegación del calendario
  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((prev) => prev - 1);
    } else {
      setCalMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((prev) => prev + 1);
    } else {
      setCalMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mm = String(calMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const newFormattedDate = `${dd}/${mm}/${calYear}`;
    setShowCalendar(false);
    router.push(`/medico/agenda?fecha=${newFormattedDate}`);
  };

  // Generar cuadrícula de días para el mes visible
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(calYear, calMonth, 1).getDay(); // 0 = Domingo
  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayWeekday; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mensaje de feedback / toast */}
      {feedbackMsg && (
        <div
          className={`rounded-lg p-3 text-xs flex items-center justify-between border ${
            feedbackMsg.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="font-bold hover:opacity-75 cursor-pointer ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tarjeta principal contenedora */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        {/* Cabecera de la tarjeta: Título y Selector de Fecha con Calendario Cliqueable y Buscar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
          <h2 className="text-base font-bold text-zinc-900">
            Mis turnos — {formattedDate}
          </h2>

          <div className="relative flex items-center gap-2 sm:gap-3" ref={calendarRef}>
            <form method="get" action="/medico/agenda" className="flex items-center gap-2 sm:gap-3">
              <label htmlFor="fecha" className="text-xs font-medium text-zinc-500">
                Fecha
              </label>

              <div className="relative flex items-center">
                <input
                  id="fecha"
                  type="text"
                  name="fecha"
                  defaultValue={formattedDate}
                  onClick={() => setShowCalendar((prev) => !prev)}
                  readOnly
                  className="w-28 rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-center text-xs text-zinc-900 shadow-xs focus:border-zinc-900 focus:outline-none cursor-pointer hover:border-zinc-400"
                />
                <button
                  type="button"
                  onClick={() => setShowCalendar((prev) => !prev)}
                  className="absolute right-1 text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
                  title="Abrir calendario para buscar fecha"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                    <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round" />
                    <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round" />
                    <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
                  </svg>
                </button>
              </div>

              <button
                type="submit"
                className="rounded-md bg-zinc-900 px-4 py-1 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition cursor-pointer"
              >
                Buscar
              </button>
            </form>

            {/* Popover de Calendario Cliqueable */}
            {showCalendar && (
              <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-zinc-200 bg-white p-4 shadow-xl">
                {/* Header del Calendario: Mes y Controles de Navegación */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <span className="text-xs font-bold text-zinc-900">
                    {MONTH_NAMES[calMonth]} {calYear}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition"
                      title="Mes anterior"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition"
                      title="Mes siguiente"
                    >
                      ›
                    </button>
                  </div>
                </div>

                {/* Encabezados de días de la semana */}
                <div className="grid grid-cols-7 pt-2 text-center text-[10px] font-semibold text-zinc-400">
                  {WEEKDAY_NAMES.map((w, idx) => (
                    <div key={idx} className="py-1">
                      {w}
                    </div>
                  ))}
                </div>

                {/* Cuadrícula de Días */}
                <div className="grid grid-cols-7 gap-1 pt-1 text-xs">
                  {daysArray.map((day, idx) => {
                    if (day === null) {
                      return <div key={`empty-${idx}`} className="h-8 w-8" />;
                    }

                    const mm = String(calMonth + 1).padStart(2, "0");
                    const dd = String(day).padStart(2, "0");
                    const currentDayIso = `${calYear}-${mm}-${dd}`;
                    const isSelected = currentDayIso === isoDate;
                    const hasAppointments = availableDates.includes(currentDayIso);

                    return (
                      <button
                        key={`day-${day}`}
                        type="button"
                        onClick={() => handleSelectDay(day)}
                        className={`relative flex h-8 w-8 flex-col items-center justify-center rounded-lg text-xs transition cursor-pointer ${
                          isSelected
                            ? "bg-zinc-900 text-white font-bold shadow-xs"
                            : hasAppointments
                            ? "bg-zinc-100/90 text-zinc-900 font-semibold hover:bg-zinc-200"
                            : "text-zinc-700 hover:bg-zinc-100"
                        }`}
                        title={
                          hasAppointments
                            ? `Día ${day} — Turnos disponibles programados`
                            : `Seleccionar día ${day}`
                        }
                      >
                        <span>{day}</span>
                        {/* Indicador de turnos disponibles en ese día */}
                        {hasAppointments && (
                          <span
                            className={`h-1 w-1 rounded-full ${
                              isSelected ? "bg-white" : "bg-emerald-600"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Ayuda al pie del calendario */}
                <div className="mt-3 border-t border-zinc-100 pt-2 flex items-center justify-between text-[10px] text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    <span>Días con turnos</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const d = String(today.getDate()).padStart(2, "0");
                      const m = String(today.getMonth() + 1).padStart(2, "0");
                      const y = today.getFullYear();
                      handleSelectDay(today.getDate());
                      setCalMonth(today.getMonth());
                      setCalYear(y);
                    }}
                    className="font-medium text-zinc-700 hover:text-zinc-900 underline cursor-pointer"
                  >
                    Hoy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabla de Hoja de Trabajo */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-700">
            <thead className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="pb-4 font-semibold">HORA</th>
                <th className="pb-4 font-semibold">PACIENTE</th>
                <th className="pb-4 font-semibold">ESPECIALIDAD</th>
                <th className="pb-4 font-semibold">ESTADO</th>
                <th className="pb-4 font-semibold text-center">ASISTENCIA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {turnos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-zinc-500 italic">
                    No hay turnos asignados para esta fecha.
                  </td>
                </tr>
              ) : (
                turnos.map((t) => {
                  const isAtendido = t.status === "ATENDIDO";
                  const isAusente = t.status === "AUSENTE";
                  const isPendiente =
                    t.status === "PENDIENTE" ||
                    t.status === "CONFIRMADO" ||
                    t.status === "RESERVADO";

                  return (
                    <tr key={t.id} className="hover:bg-zinc-50/50 transition">
                      {/* HORA */}
                      <td className="py-4 text-sm text-zinc-900 font-normal">{t.time}</td>

                      {/* PACIENTE */}
                      <td className="py-4 text-sm text-zinc-900 font-normal">
                        {t.patientName}
                      </td>

                      {/* ESPECIALIDAD */}
                      <td className="py-4 text-sm text-zinc-900 font-normal">{t.specialty}</td>

                      {/* ESTADO */}
                      <td className="py-4">
                        {isAtendido && (
                          <span className="inline-flex items-center rounded-full bg-zinc-900 px-3.5 py-1 text-xs font-semibold text-white">
                            Atendido
                          </span>
                        )}
                        {isAusente && (
                          <span className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-3.5 py-1 text-xs font-medium text-zinc-600">
                            Ausente
                          </span>
                        )}
                        {isPendiente && (
                          <span className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-3.5 py-1 text-xs font-medium text-zinc-600">
                            Pendiente
                          </span>
                        )}
                        {!isAtendido && !isAusente && !isPendiente && (
                          <span className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-3.5 py-1 text-xs font-medium text-zinc-600">
                            {t.status}
                          </span>
                        )}
                      </td>

                      {/* ASISTENCIA */}
                      <td className="py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCambiarAsistencia(t.id, "ATENDIDO")}
                            disabled={isPending && pendingId === `${t.id}-ATENDIDO`}
                            className={`rounded-md px-4 py-1 text-xs font-medium transition cursor-pointer ${
                              isAtendido
                                ? "bg-zinc-900 text-white shadow-xs"
                                : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                            }`}
                          >
                            Atendido
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCambiarAsistencia(t.id, "AUSENTE")}
                            disabled={isPending && pendingId === `${t.id}-AUSENTE`}
                            className={`rounded-md px-4 py-1 text-xs font-medium transition cursor-pointer ${
                              isAusente
                                ? "bg-zinc-900 text-white shadow-xs"
                                : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                            }`}
                          >
                            Ausente
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Contador al pie de la tabla */}
        <div className="pt-6 text-xs text-zinc-500">
          <span>
            {turnos.length > 0
              ? `1-${turnos.length} de ${turnos.length} resultados`
              : "0 resultados"}
          </span>
        </div>
      </div>

      {/* Cuadro informativo inferior */}
      <div className="rounded-xl bg-zinc-200/80 px-4 py-3.5 text-xs text-zinc-700 font-normal">
        Solo se muestran los turnos asignados a tu usuario.
      </div>
    </div>
  );
}
