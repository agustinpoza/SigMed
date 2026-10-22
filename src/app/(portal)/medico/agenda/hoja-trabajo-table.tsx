"use client";

import React, { useState, useTransition } from "react";
import { registrarAsistencia } from "./actions";

export type DoctorTurnoRow = {
  id: string;
  time: string;
  patientName: string;
  specialty: string;
  status: "ATENDIDO" | "AUSENTE" | "PENDIENTE" | "RESERVADO" | "CONFIRMADO" | string;
};

export default function HojaTrabajoTable({
  initialTurnos,
  formattedDate,
}: {
  initialTurnos: DoctorTurnoRow[];
  formattedDate: string;
}) {
  const [turnos, setTurnos] = useState<DoctorTurnoRow[]>(initialTurnos);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCambiarAsistencia = (appointmentId: string, nuevoEstado: "ATENDIDO" | "AUSENTE") => {
    setPendingId(`${appointmentId}-${nuevoEstado}`);
    setFeedbackMsg(null);

    // Actualización optimista inmediata en interfaz
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
        {/* Cabecera de la tarjeta: Título y Selector de Fecha con Buscar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
          <h2 className="text-base font-bold text-zinc-900">
            Mis turnos — {formattedDate}
          </h2>

          <form method="get" className="flex items-center gap-2 sm:gap-3">
            <label htmlFor="fecha" className="text-xs font-medium text-zinc-500">
              Fecha
            </label>
            <input
              id="fecha"
              type="text"
              name="fecha"
              defaultValue={formattedDate}
              className="w-28 rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-center text-xs text-zinc-900 shadow-xs focus:border-zinc-900 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-1 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition cursor-pointer"
            >
              Buscar
            </button>
          </form>
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
