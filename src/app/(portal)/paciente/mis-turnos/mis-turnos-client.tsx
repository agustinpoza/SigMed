"use client";

import React, { useState, useTransition } from "react";
import {
  confirmarTurno,
  cancelarTurno,
  reprogramarTurno,
  obtenerHorariosAlternativosAction,
} from "@/app/(portal)/paciente/turnos/actions";
import type { HorarioAlternativo } from "@/lib/agenda";

export type MyAppointment = {
  id: string;
  doctorId?: string;
  doctorName: string;
  doctorLicense?: string;
  specialty: string;
  dateTime: string;
  startsAtISO?: string;
  status: "RESERVADO" | "CONFIRMADO" | "ATENDIDO" | "AUSENTE" | "CANCELADO" | string;
};

export default function MisTurnosClient({
  initialTurnos,
  initialHorariosPorMedico = {},
}: {
  initialTurnos: MyAppointment[];
  initialHorariosPorMedico?: Record<string, HorarioAlternativo[]>;
}) {
  const [turnos, setTurnos] = useState<MyAppointment[]>(initialTurnos);
  const [horariosPorMedico, setHorariosPorMedico] =
    useState<Record<string, HorarioAlternativo[]>>(initialHorariosPorMedico);

  // Estado del modal de detalle y reprogramación (US-2.5)
  const [activeModalTurno, setActiveModalTurno] = useState<MyAppointment | null>(null);
  const [isReprogramando, setIsReprogramando] = useState<boolean>(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Estado del modal SigMed de confirmación de cancelación (US-2.4)
  const [turnoACancelar, setTurnoACancelar] = useState<MyAppointment | null>(null);

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenModal = (turno: MyAppointment) => {
    setActiveModalTurno(turno);
    setIsReprogramando(false);
    setSelectedScheduleId("");
    setModalError(null);
  };

  const handleCloseModal = () => {
    setActiveModalTurno(null);
    setIsReprogramando(false);
    setSelectedScheduleId("");
    setModalError(null);
  };

  const handleConfirmar = (id: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setPendingId(id);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("appointmentId", id);
        await confirmarTurno(formData);

        setTurnos((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: "CONFIRMADO" } : t)),
        );
        setSuccessMsg(
          "¡Turno confirmado con éxito! Se ha enviado un correo electrónico con los detalles de tu consulta.",
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "No se pudo confirmar el turno.";
        setErrorMsg(msg);
      } finally {
        setPendingId(null);
      }
    });
  };

  // US-2.4: Abre el cartel / modal de confirmación propio de SigMed
  const handleSolicitarCancelacion = (turno: MyAppointment) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setTurnoACancelar(turno);
  };

  // US-2.4: Ejecuta la cancelación confirmada desde el cartel de SigMed
  const handleConfirmarCancelacion = () => {
    if (!turnoACancelar) return;
    const id = turnoACancelar.id;

    setErrorMsg(null);
    setSuccessMsg(null);
    setPendingId(`${id}-cancelar`);

    startTransition(async () => {
      try {
        await cancelarTurno(id);

        setTurnos((prev) => prev.filter((t) => t.id !== id));
        setTurnoACancelar(null);
        if (activeModalTurno?.id === id) {
          handleCloseModal();
        }
        setSuccessMsg(
          "El turno ha sido cancelado correctamente y el horario fue liberado en la agenda pública.",
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "No se pudo cancelar el turno.";
        setTurnoACancelar(null);
        setErrorMsg(msg);
      } finally {
        setPendingId(null);
      }
    });
  };

  // US-2.5: Abrir vista de horarios alternativos disponibles para el profesional
  const handleIniciarReprogramacion = async () => {
    if (!activeModalTurno) return;
    setModalError(null);
    setIsReprogramando(true);
    setSelectedScheduleId("");

    const docId = activeModalTurno.doctorId;
    if (!docId) return;

    // Refrescar horarios disponibles del profesional desde el servidor
    setLoadingSlots(true);
    try {
      const slots = await obtenerHorariosAlternativosAction(docId, activeModalTurno.id);
      setHorariosPorMedico((prev) => ({ ...prev, [docId]: slots }));
    } catch {
      // Si falla la recarga dinámica, se mantienen los horarios pre-cargados
    } finally {
      setLoadingSlots(false);
    }
  };

  // US-2.5: Confirmar reprogramación invocando Server Action reprogramarTurno(oldAppointmentId, newScheduleId)
  const handleConfirmarReprogramacion = () => {
    if (!activeModalTurno) return;
    if (!selectedScheduleId) {
      setModalError("Debés seleccionar un horario alternativo disponible.");
      return;
    }

    setModalError(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPendingId(`${activeModalTurno.id}-reprogramar`);

    startTransition(async () => {
      try {
        const res = await reprogramarTurno(activeModalTurno.id, selectedScheduleId);

        setTurnos((prev) =>
          prev.map((t) =>
            t.id === activeModalTurno.id
              ? {
                  id: res.newAppointment.id,
                  doctorId: res.newAppointment.doctorId,
                  doctorName: res.newAppointment.doctorName,
                  doctorLicense: res.newAppointment.doctorLicense,
                  specialty: res.newAppointment.specialty,
                  dateTime: res.newAppointment.dateTime,
                  startsAtISO: res.newAppointment.startsAtISO,
                  status: res.newAppointment.status,
                }
              : t,
          ),
        );

        handleCloseModal();
        setSuccessMsg(
          "¡Turno reprogramado con éxito! El turno anterior fue liberado y tu nuevo horario quedó confirmado.",
        );
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "No se pudo reprogramar el turno.";
        setModalError(msg);
      } finally {
        setPendingId(null);
      }
    });
  };

  const slotsAlternativosModal: HorarioAlternativo[] = activeModalTurno?.doctorId
    ? (horariosPorMedico[activeModalTurno.doctorId] ?? []).filter(
        (slot) => slot.startsAt !== activeModalTurno.startsAtISO,
      )
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Mensajes de feedback */}
      {successMsg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center justify-between">
          <span>{successMsg}</span>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
          >
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-xs font-bold text-red-700 hover:text-red-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabla de Turnos (Card central blanca con estética SigMed) */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 bg-[#eef1f5] text-xs font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-6 py-4">PROFESIONAL</th>
                <th className="px-6 py-4">ESPECIALIDAD</th>
                <th className="px-6 py-4">FECHA Y HORA</th>
                <th className="px-6 py-4">ESTADO</th>
                <th className="px-6 py-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {turnos.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-slate-500 italic"
                  >
                    No tenés turnos programados en este momento.
                  </td>
                </tr>
              ) : (
                turnos.map((t) => {
                  const isReservado = t.status === "RESERVADO";
                  const isConfirmado = t.status === "CONFIRMADO";
                  const isAtendido = t.status === "ATENDIDO";
                  const isAusente = t.status === "AUSENTE";
                  const puedeCancelar = isReservado || isConfirmado;

                  return (
                    <tr key={t.id} className="hover:bg-[#eef1f5]/50 transition">
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {t.doctorName}
                      </td>
                      <td className="px-6 py-4 text-slate-700">{t.specialty}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{t.dateTime}</td>
                      <td className="px-6 py-4">
                        {isReservado && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Reservado
                          </span>
                        )}
                        {isConfirmado && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Confirmado
                          </span>
                        )}
                        {isAtendido && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-[#eef1f5] px-2.5 py-1 text-xs font-semibold text-slate-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                            Atendido
                          </span>
                        )}
                        {isAusente && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            Ausente
                          </span>
                        )}
                        {!isReservado && !isConfirmado && !isAtendido && !isAusente && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-[#eef1f5] px-2.5 py-1 text-xs font-medium text-slate-700">
                            {t.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {isReservado && (
                            <button
                              type="button"
                              onClick={() => handleConfirmar(t.id)}
                              disabled={
                                isPending &&
                                (pendingId === t.id || pendingId === `${t.id}-cancelar`)
                              }
                              className="inline-flex items-center rounded-md bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-zinc-800 disabled:opacity-50 transition cursor-pointer"
                            >
                              {isPending && pendingId === t.id
                                ? "Confirmando..."
                                : "Confirmar asistencia"}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenModal(t)}
                            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-[#eef1f5] transition cursor-pointer"
                          >
                            Ver detalle
                          </button>

                          {puedeCancelar && (
                            <button
                              type="button"
                              onClick={() => handleSolicitarCancelacion(t)}
                              disabled={
                                isPending &&
                                (pendingId === t.id || pendingId === `${t.id}-cancelar`)
                              }
                              className="inline-flex items-center rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 shadow-xs hover:bg-red-100 disabled:opacity-50 transition cursor-pointer"
                            >
                              {isPending && pendingId === `${t.id}-cancelar`
                                ? "Cancelando..."
                                : "Cancelar turno"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mensaje de ayuda al pie de la tabla */}
        <div className="border-t border-slate-200 bg-[#eef1f5] px-6 py-3.5 text-xs text-slate-700 flex items-center gap-2">
          <svg
            className="h-4 w-4 text-slate-500 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path strokeWidth="2" strokeLinecap="round" d="M12 16v-4m0-4h.01" />
          </svg>
          <span>
            Los turnos reservados o confirmados pueden cancelarse o reprogramarse desde el
            detalle de la consulta.
          </span>
        </div>
      </div>

      {/* US-2.4: Cartel / Modal de confirmación de cancelación con estética del sistema SigMed */}
      {turnoACancelar && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-cancelar-titulo"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                  SigMed
                </span>
                <h3
                  id="modal-cancelar-titulo"
                  className="text-base font-bold text-slate-800"
                >
                  Cancelar turno
                </h3>
              </div>
              <button
                type="button"
                aria-label="Cerrar cartel de cancelación"
                onClick={() => setTurnoACancelar(null)}
                disabled={isPending && pendingId === `${turnoACancelar.id}-cancelar`}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none font-normal transition cursor-pointer disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-700">
              <p className="leading-relaxed text-slate-800 font-medium">
                ¿Estás seguro de que deseas cancelar este turno? El horario será liberado y
                volverá a estar disponible en la agenda pública.
              </p>

              <div className="rounded-xl border border-slate-200 bg-[#eef1f5] p-3.5 text-xs text-slate-700 space-y-1">
                <p>
                  <span className="font-semibold text-slate-800">Profesional:</span>{" "}
                  {turnoACancelar.doctorName}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Especialidad:</span>{" "}
                  {turnoACancelar.specialty}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Fecha y Hora:</span>{" "}
                  {turnoACancelar.dateTime.endsWith("hs")
                    ? turnoACancelar.dateTime
                    : `${turnoACancelar.dateTime} hs`}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setTurnoACancelar(null)}
                disabled={isPending && pendingId === `${turnoACancelar.id}-cancelar`}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#eef1f5] disabled:opacity-50 transition cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmarCancelacion}
                disabled={isPending && pendingId === `${turnoACancelar.id}-cancelar`}
                className="rounded-lg bg-zinc-900 px-5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 transition cursor-pointer"
              >
                {isPending && pendingId === `${turnoACancelar.id}-cancelar`
                  ? "Cancelando..."
                  : "Confirmar cancelación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* US-2.5: Modal "Detalle de la consulta médica" respetando el diseño exacto */}
      {activeModalTurno && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-detalle-titulo"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            {/* Encabezado del modal */}
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3.5">
              <h3
                id="modal-detalle-titulo"
                className="text-base font-bold text-slate-800"
              >
                Detalle de la consulta médica
              </h3>
              <button
                type="button"
                aria-label="Cerrar modal"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none font-normal transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Datos de la consulta médica */}
            <div className="space-y-3.5 text-sm text-slate-700">
              <div>
                <span className="block text-xs font-semibold text-slate-400">
                  Profesional
                </span>
                <p className="text-sm font-bold text-slate-800">
                  {activeModalTurno.doctorName}
                </p>
                <p className="text-xs text-slate-400">
                  Matrícula: {activeModalTurno.doctorLicense || "MP-1002"}
                </p>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-400">
                  Especialidad
                </span>
                <p className="font-normal text-slate-700">{activeModalTurno.specialty}</p>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-400">
                  Fecha y Hora
                </span>
                <p className="font-normal text-slate-700">
                  {activeModalTurno.dateTime.endsWith("hs")
                    ? activeModalTurno.dateTime
                    : `${activeModalTurno.dateTime} hs`}
                </p>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-400">
                  Lugar de atención
                </span>
                <p className="font-normal text-slate-700">
                  Sede Central SigMed — Consultorio 3
                </p>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-400">
                  Estado del turno
                </span>
                <p className="font-normal text-slate-700 capitalize">
                  {activeModalTurno.status.toLowerCase()}
                </p>
              </div>
            </div>

            {/* Vista desplegable de reprogramación con horarios alternativos disponibles */}
            {isReprogramando && (
              <div className="mt-5 rounded-xl border border-slate-200 bg-[#eef1f5] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-2.5">
                  Seleccioná un horario alternativo disponible
                </p>

                {modalError && (
                  <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {modalError}
                  </div>
                )}

                {loadingSlots ? (
                  <p className="py-3 text-xs text-slate-600">
                    Consultando horarios disponibles del profesional...
                  </p>
                ) : slotsAlternativosModal.length === 0 ? (
                  <p className="py-2 text-xs text-slate-600">
                    No se encontraron otros horarios disponibles próximos para este
                    profesional.
                  </p>
                ) : (
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {slotsAlternativosModal.map((slot) => {
                      const isSelected = selectedScheduleId === slot.scheduleId;
                      return (
                        <label
                          key={slot.scheduleId}
                          onClick={() => setSelectedScheduleId(slot.scheduleId)}
                          className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-xs transition ${
                            isSelected
                              ? "border-slate-900 bg-white font-semibold text-slate-800 shadow-xs"
                              : "border-slate-200 bg-white/80 text-slate-700 hover:bg-white"
                          }`}
                        >
                          <span>{slot.label}</span>
                          <input
                            type="radio"
                            name="newScheduleId"
                            value={slot.scheduleId}
                            checked={isSelected}
                            onChange={() => setSelectedScheduleId(slot.scheduleId)}
                            className="h-3.5 w-3.5 accent-zinc-900"
                          />
                        </label>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3.5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsReprogramando(false);
                      setSelectedScheduleId("");
                      setModalError(null);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancelar cambio
                  </button>
                  <button
                    type="button"
                    disabled={
                      !selectedScheduleId ||
                      (isPending &&
                        pendingId === `${activeModalTurno.id}-reprogramar`)
                    }
                    onClick={handleConfirmarReprogramacion}
                    className="rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-40 transition cursor-pointer"
                  >
                    {isPending && pendingId === `${activeModalTurno.id}-reprogramar`
                      ? "Reprogramando..."
                      : "Confirmar reprogramación"}
                  </button>
                </div>
              </div>
            )}

            {/* Botones inferiores según diseño: "Reprogramar turno" (outline) y "Cerrar" (sólido oscuro) */}
            <div className="mt-6 flex items-center justify-end gap-3">
              {(activeModalTurno.status === "CONFIRMADO" ||
                activeModalTurno.status === "RESERVADO") &&
                !isReprogramando && (
                  <button
                    type="button"
                    onClick={handleIniciarReprogramacion}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#eef1f5] transition cursor-pointer"
                  >
                    Reprogramar turno
                  </button>
                )}
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-lg bg-zinc-900 px-5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
