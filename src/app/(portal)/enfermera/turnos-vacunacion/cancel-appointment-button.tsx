"use client";

import { useActionState } from "react";
import { cancelVaccinationAppointment, type CancelState } from "./actions";
import { useEffect } from "react";
import Swal from "sweetalert2";

const initialState: CancelState = {};

export function CancelAppointmentButton({
  appointmentId,
  description,
}: {
  appointmentId: string;
  description: string;
}) {
  const [state, formAction, pending] = useActionState(
    cancelVaccinationAppointment,
    initialState,
  );
  
  useEffect(() => {
    if (state.error || state.message) {
      const success = Boolean(state.message);
      void Swal.fire({
        icon: success ? "success" : "error",
        title: success ? "Turno cancelado" : "No se pudo cancelar el turno",
        text: state.message ?? state.error,
        confirmButtonText: "Aceptar",
        buttonsStyling: false,
        customClass: {
          confirmButton: "bg-slate-600 text-white rounded-sm p-2 px-3 m-2",
        },
      });
    }
  }, [state]);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(
          `¿Cancelar el turno de ${description}? Si estaba confirmado, la dosis vuelve al stock.`,
        )) {
          event.preventDefault();
        }
      }}
      className="flex flex-col items-end gap-1"
    >
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Cancelando..." : "Cancelar"}
      </button>
      {state.error ? (
        <p role="alert" className="max-w-48 text-right text-xs text-red-600">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}