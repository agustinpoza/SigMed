"use client";

import { startTransition, useActionState, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { createStockMovement, getLotAvailability, type LotAvailabilityResult, type MovementFormState } from "./actions";
import { MAX_STOCK_INPUT_QUANTITY } from "@/lib/stock-input";
import { LOT_AVAILABILITY_ERROR } from "@/lib/stock-messages";

const initialState: MovementFormState = {};
const initialValues = {
  vaccineId: "",
  movementType: "INGRESO",
  operation: "",
  lotNumber: "",
  expiresAt: "",
  quantity: "",
  reason: "",
};

export type VaccineOption = {
  id: string;
  name: string;
};

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
    >
      {pending ? "Registrando..." : "Registrar Movimiento"}
    </button>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-zinc-700">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

const controlClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900";

function LotAvailability({ vaccineId, lotNumber }: { vaccineId: string; lotNumber: string }) {
  const [result, setResult] = useState<LotAvailabilityResult | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const current = await getLotAvailability(vaccineId, lotNumber);
        if (active) setResult(current);
      } catch {
        if (active) setResult({ status: "error", message: LOT_AVAILABILITY_ERROR });
      }
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [vaccineId, lotNumber, retry]);

  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 sm:col-span-2">
      <p className="text-sm font-medium text-zinc-700">Stock disponible del lote</p>
      <p role={result?.status === "error" ? "alert" : "status"} className="mt-1 text-sm text-zinc-900">
        {!result ? "Consultando disponibilidad..."
          : result.status === "available" ? `${result.quantityAvailable} dosis`
            : result.status === "not-found" ? "No se encontró ese lote para la vacuna seleccionada."
              : result.message}
      </p>
      {result?.status === "error" ? (
        <button type="button" onClick={() => { setResult(null); setRetry((value) => value + 1); }}
          className="mt-2 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
          Reintentar consulta de stock
        </button>
      ) : null}
    </div>
  );
}

export function MovementForm({ vaccines }: { vaccines: VaccineOption[] }) {
  const [values, setValues] = useState(initialValues);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [availabilityRevision, setAvailabilityRevision] = useState(0);
  const [state, dispatch, pending] = useActionState(
    async (previous: MovementFormState, data: FormData) => {
      const result = await createStockMovement(previous, data);
      // Releer el saldo si se conservan campos tras un rechazo; el éxito limpia
      // el formulario y la próxima selección consulta nuevamente el lote.
      setAvailabilityRevision((value) => value + 1);
      if (!result.errors && !result.values) setValues(initialValues);
      return result;
    },
    initialState,
  );
  const isAdjustment = values.movementType === "AJUSTE";
  function errorFor(field: keyof typeof initialValues) {
    return feedbackVisible && state.values?.[field] === values[field].trim()
      ? state.errors?.[field]
      : undefined;
  }
  function updateField(field: keyof typeof initialValues, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
  }
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setFeedbackVisible(true);
    startTransition(() => dispatch(data));
  }
  function resetForm() {
    setValues(initialValues);
    setFeedbackVisible(false);
  }
  const errors = {
    vaccineId: errorFor("vaccineId"),
    movementType: errorFor("movementType"),
    operation: isAdjustment ? errorFor("operation") : undefined,
    lotNumber: errorFor("lotNumber"),
    expiresAt: isAdjustment ? undefined : errorFor("expiresAt"),
    quantity: errorFor("quantity"),
    reason: isAdjustment ? errorFor("reason") : undefined,
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {feedbackVisible && state.message ? (
        <p
          role="status"
          className={
            state.values
              ? "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              : "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          }
        >
          {state.message}
        </p>
      ) : null}

      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
        <Field id="vaccineId" label="Seleccionar Vacuna del Catálogo" error={errors.vaccineId}>
          <select
            id="vaccineId"
            name="vaccineId"
            value={values.vaccineId}
            onChange={(event) => updateField("vaccineId", event.target.value)}
            aria-invalid={Boolean(errors.vaccineId)}
            aria-describedby={errors.vaccineId ? "vaccineId-error" : undefined}
            className={controlClass}
          >
            <option value="">Seleccionar...</option>
            {vaccines.map((vaccine) => (
              <option key={vaccine.id} value={vaccine.id}>
                {vaccine.name}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id="movementType"
          label="Tipo de movimiento"
          hint={
            isAdjustment
              ? "Corrección sobre un lote ya cargado. Elegí la operación e ingresá una cantidad positiva."
              : "Las salidas por turno se generan al aprobar un turno de vacunacion."
          }
          error={errors.movementType}
        >
          <select
            id="movementType"
            name="movementType"
            value={values.movementType}
            onChange={(event) => setValues((previous) => ({
              ...previous,
              movementType: event.target.value,
              operation: "",
            }))}
            aria-invalid={Boolean(errors.movementType)}
            aria-describedby={errors.movementType ? "movementType-error" : undefined}
            className={controlClass}
          >
            <option value="INGRESO">Ingreso</option>
            <option value="AJUSTE">Ajuste</option>
          </select>
        </Field>

        {isAdjustment ? (
          <fieldset
            className="sm:col-span-2"
            aria-invalid={Boolean(errors.operation)}
            aria-describedby={errors.operation ? "operation-error" : undefined}
          >
            <legend className="text-sm font-medium text-zinc-700">Operación</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {([
                ["SUMAR", "Sumar dosis"],
                ["DESCONTAR", "Descontar dosis"],
              ] as const).map(([operation, label]) => (
                <label key={operation} className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900">
                  <input
                    type="radio"
                    name="operation"
                    value={operation}
                    checked={values.operation === operation}
                    onChange={(event) => updateField("operation", event.target.value)}
                    aria-describedby={errors.operation ? "operation-error" : undefined}
                    className="size-4 accent-zinc-900"
                  />
                  {label}
                </label>
              ))}
            </div>
            {errors.operation ? (
              <p id="operation-error" role="alert" className="mt-1 text-xs text-red-600">{errors.operation}</p>
            ) : null}
          </fieldset>
        ) : null}

        <Field id="lotNumber" label="Lote" error={errors.lotNumber}>
          <input
            id="lotNumber"
            name="lotNumber"
            value={values.lotNumber}
            onChange={(event) => updateField("lotNumber", event.target.value)}
            aria-invalid={Boolean(errors.lotNumber)}
            aria-describedby={errors.lotNumber ? "lotNumber-error" : undefined}
            className={controlClass}
            placeholder="L-2026-001"
          />
        </Field>

        <Field
          id="expiresAt"
          label="Fecha de vencimiento"
          hint={
            isAdjustment
              ? "No se usa en ajustes: se aplica sobre un lote ya cargado."
              : "Solo se usa cuando el lote se carga por primera vez."
          }
          error={errors.expiresAt}
        >
          <input
            id="expiresAt"
            name="expiresAt"
            type="date"
            value={values.expiresAt}
            onChange={(event) => updateField("expiresAt", event.target.value)}
            disabled={isAdjustment}
            aria-invalid={Boolean(errors.expiresAt)}
            aria-describedby={errors.expiresAt ? "expiresAt-error" : undefined}
            className={`${controlClass} disabled:bg-zinc-100`}
          />
        </Field>

        <Field
          id="quantity"
          label="Cantidad"
          hint="Ingresá una cantidad entera positiva."
          error={errors.quantity}
        >
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            max={MAX_STOCK_INPUT_QUANTITY}
            step={1}
            value={values.quantity}
            onChange={(event) => updateField("quantity", event.target.value)}
            aria-invalid={Boolean(errors.quantity)}
            aria-describedby={errors.quantity ? "quantity-error" : "quantity-hint"}
            className={controlClass}
            placeholder="5"
          />
        </Field>

        <Field
          id="reason"
          label="Motivo"
          hint={isAdjustment ? "Obligatorio para ajustes." : "Opcional."}
          error={errors.reason}
        >
          <input
            id="reason"
            name="reason"
            value={values.reason}
            onChange={(event) => updateField("reason", event.target.value)}
            aria-invalid={Boolean(errors.reason)}
            aria-describedby={errors.reason ? "reason-error" : "reason-hint"}
            className={controlClass}
            placeholder={isAdjustment ? "Correccion de conteo" : "Recepcion de lote"}
          />
        </Field>

        {values.vaccineId && values.lotNumber.trim() ? (
          <LotAvailability
            key={JSON.stringify([values.vaccineId, values.lotNumber.trim(), availabilityRevision])}
            vaccineId={values.vaccineId}
            lotNumber={values.lotNumber.trim()}
          />
        ) : null}
      </fieldset>

      <div className="flex justify-end gap-3 border-t border-zinc-200 pt-4">
        <button
          type="button"
          disabled={pending}
          onClick={resetForm}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Cancelar
        </button>
        <SubmitButton pending={pending} />
      </div>
    </form>
  );
}
