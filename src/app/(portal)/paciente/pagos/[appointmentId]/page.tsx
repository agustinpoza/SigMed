import Link from "next/link";
import { getCurrentActor } from "@/lib/actor";
import { AGENDA_SPECIALITY_LABELS } from "@/lib/agenda";
import { COVERAGE_BADGE_CLASSES } from "@/lib/coverage";
import {
  PAYMENT_STATUS_LABELS,
  PaymentRuleError,
  obtenerResumenPago,
} from "@/lib/payments";
import { PaymentForm } from "./payment-form";

export const metadata = {
  title: "Resumen de pago | SigMed",
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

export default async function PagoDetallePage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;
  const actor = await getCurrentActor();

  if (!actor || actor.role !== "PACIENTE") {
    return (
      <div className="rounded-md border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
        {actor
          ? "No tenés acceso a esta sección."
          : "No hay una sesión de paciente activa."}
      </div>
    );
  }

  let resumen;

  try {
    resumen = await obtenerResumenPago(appointmentId, actor.id);
  } catch (error) {
    if (error instanceof PaymentRuleError) {
      return (
        <div className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-zinc-900">
            No pudimos mostrar el resumen
          </h1>
          <p className="text-sm text-zinc-600">{error.message}</p>
          <Link
            href="/paciente/pagos"
            className="text-sm font-medium text-zinc-900 underline"
          >
            Volver a pagos
          </Link>
        </div>
      );
    }
    throw error;
  }

  const amountLabel = moneyFormatter.format(resumen.amount);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div>
        <Link
          href="/paciente/pagos"
          className="text-sm font-medium text-zinc-600 underline"
        >
          ← Volver a pagos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          Resumen antes de pagar
        </h1>
        <p className="text-sm text-zinc-600">
          Revisá los datos de la consulta particular y el monto antes de
          confirmar el pago.
        </p>
      </div>

      <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Profesional
            </dt>
            <dd className="text-zinc-900">{resumen.doctorName}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Especialidad
            </dt>
            <dd className="text-zinc-900">
              {AGENDA_SPECIALITY_LABELS[resumen.specialty] ??
                resumen.specialty}{" "}
              · Matrícula {resumen.licenseNumber}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Fecha y hora
            </dt>
            <dd className="text-zinc-900">
              {dateFormatter.format(resumen.startsAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Cobertura
            </dt>
            <dd className="mt-1">
              <span
                className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${COVERAGE_BADGE_CLASSES[resumen.coverage.state]}`}
              >
                {resumen.coverage.label}
              </span>
              <span className="mt-1 block text-xs text-zinc-500">
                {resumen.coverage.detail}
              </span>
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex items-baseline justify-between border-t border-zinc-200 pt-4">
          <span className="text-sm font-semibold text-zinc-700">
            Monto de la consulta
          </span>
          <span className="text-2xl font-bold text-zinc-900">{amountLabel}</span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          El monto corresponde al valor de consulta fijado por el profesional.
        </p>

        {resumen.payment ? (
          <p className="mt-3 rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            <span className="font-semibold">Estado del pago: </span>
            {PAYMENT_STATUS_LABELS[resumen.payment.status]}
            {resumen.payment.transactionCode
              ? ` · Código ${resumen.payment.transactionCode}`
              : ""}
            {resumen.payment.paidAt
              ? ` · ${dateFormatter.format(resumen.payment.paidAt)}`
              : ""}
          </p>
        ) : null}
      </div>

      {resumen.canPay ? (
        <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
          <PaymentForm
            appointmentId={resumen.appointmentId}
            amountLabel={amountLabel}
          />
        </div>
      ) : (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {resumen.blockedReason ?? "Esta consulta no admite pago online."}
        </p>
      )}
    </section>
  );
}
