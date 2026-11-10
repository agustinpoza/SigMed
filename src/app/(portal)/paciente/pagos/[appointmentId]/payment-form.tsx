"use client";

import { useActionState, useEffect } from "react";
import { pagarConsulta, type PaymentFormState } from "../actions";
import Swal from "sweetalert2";

const initialState: PaymentFormState = {};

const RESULT_OPTIONS = [
  {
    value: "APROBADO",
    label: "Aprobado",
    detail: "La pasarela confirma el cobro y la consulta queda abonada.",
  },
  {
    value: "RECHAZADO",
    label: "Rechazado",
    detail: "La pasarela rechaza el intento; la consulta sigue impaga.",
  },
  {
    value: "PENDIENTE",
    label: "Pendiente",
    detail: "La pasarela deja la operación en revisión; no cuenta como pago.",
  },
] as const;

export function PaymentForm({
  appointmentId,
  amountLabel,
}: {
  appointmentId: string;
  amountLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    pagarConsulta,
    initialState,
  );

  useEffect(() => {
    if (state.error) {
      void Swal.fire({
        icon: "error",
        title: "No se pudo procesar el pago",
        text: state.error,
        confirmButtonText: "Aceptar",
        buttonsStyling: false,
        customClass: {
          confirmButton: "bg-slate-600 text-white rounded-sm p-2 px-3 m-2",
        },
      });
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="appointmentId" value={appointmentId} />

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.error}
        </p>
      ) : null}

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-zinc-900">
          Resultado simulado de la pasarela
        </legend>
        {RESULT_OPTIONS.map((option, index) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-start gap-3 rounded-md border border-zinc-200 bg-white p-3 text-sm hover:bg-zinc-50"
          >
            <input
              type="radio"
              name="result"
              value={option.value}
              defaultChecked={index === 0}
              className="mt-1"
            />
            <span>
              <span className="block font-medium text-zinc-900">
                {option.label}
              </span>
              <span className="block text-xs text-zinc-500">
                {option.detail}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {pending ? "Procesando pago..." : `Confirmar pago de ${amountLabel}`}
      </button>

      <p className="text-xs text-zinc-500">
        Al confirmar se registra la transacción simulada. No se mueve dinero
        real y no se contacta a ninguna pasarela externa.
      </p>
    </form>
  );
}
