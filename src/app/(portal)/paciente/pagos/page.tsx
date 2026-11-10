import Link from "next/link";
import { getCurrentActor } from "@/lib/actor";
import { prisma } from "@/lib/db";
import { COVERAGE_BADGE_CLASSES, evaluarCobertura, } from "@/lib/coverage";
import { PAYMENT_STATUS_LABELS, obtenerDeudaPaciente, } from "@/lib/payments";
import { AGENDA_SPECIALITY_LABELS } from "@/lib/agenda";
import { AppointmentState, PaymentConcept, PaymentStatus } from "@/generated/prisma/enums";

export const metadata = {
  title: "Pagos y coberturas | SigMed",
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

const PAYMENT_BADGE_CLASSES: Record<PaymentStatus, string> = {
  PENDIENTE: "border-amber-300 bg-amber-50 text-amber-800",
  APROBADO: "border-emerald-300 bg-emerald-50 text-emerald-800",
  RECHAZADO: "border-red-300 bg-red-50 text-red-700",
  ANULADO: "border-zinc-300 bg-zinc-50 text-zinc-600",
};

const RESULT_MESSAGES: Record<string, string> = {
  aprobado: "El pago quedó aprobado y la consulta figura como abonada.",
  pendiente:
    "El pago quedó pendiente de confirmación. La consulta todavía no figura como abonada.",
  rechazado:
    "El pago fue rechazado. Podés volver a intentarlo desde el resumen de la consulta.",
};

type SearchParams = {
  pago?: string;
};

export default async function PagosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
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

  const [turnos, deuda] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        patientId: actor.id,
        OR: [
          { status: AppointmentState.CONFIRMADO },
          { status: AppointmentState.ATENDIDO },
          { payment: { isNot: null } },
        ],
      },
      include: {
        doctor: {
          include: { profile: { select: { firstName: true, lastName: true } } },
        },
        patient: { include: { insurance: true } },
        payment: true,
      },
      orderBy: { startsAt: "desc" },
    }),
    obtenerDeudaPaciente(actor.id),
  ]);

  const consultas = turnos.filter(
    (turno) => turno.payment?.concept !== PaymentConcept.INASISTENCIA,
  );
  const { pago } = await searchParams;
  const resultMessage = pago ? RESULT_MESSAGES[pago] : null;

  return (
    <section className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Pagos y coberturas
        </h1>
        <p className="text-sm text-zinc-600">
          Consultá el estado de tu cobertura, aboná consultas particulares y
          revisá tus deudas por inasistencia.
        </p>
      </header>

      {resultMessage ? (
        <p
          role="status"
          className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900"
        >
          {resultMessage}
        </p>
      ) : null}

      <section className="rounded-md border border-red-200 bg-red-50 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-red-900">
            Deuda por inasistencia
          </h2>
          <p className="text-lg font-bold text-red-900">
            {moneyFormatter.format(deuda.totalPending)}
          </p>
        </div>
        {deuda.pending.length === 0 ? (
          <p className="mt-1 text-sm text-red-800">
            No tenés deudas pendientes por inasistencias.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-red-800">
              El valor total de la consulta se imputa cuando el turno queda
              marcado como ausente.
            </p>
            <ul className="mt-2 divide-y divide-red-200 text-sm text-red-900">
              {deuda.pending.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap justify-between gap-2 py-2"
                >
                  <span>
                    {dateFormatter.format(item.startsAt)} · {item.doctorName} ·{" "}
                    {AGENDA_SPECIALITY_LABELS[item.speciality] ?? item.speciality}
                  </span>
                  <span className="font-semibold">
                    {moneyFormatter.format(item.amount)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-red-800">
              Regularizá el pago en administración.
            </p>
          </>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-zinc-900">Mis consultas</h2>

        {consultas.length === 0 ? (
          <p className="rounded-md border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-600">
            No tenés consultas pendientes de pago.
          </p>
        ) : (
          <ul className="grid gap-3">
            {consultas.map((turno) => {
              const coverage = evaluarCobertura(turno.patient);
              const payment = turno.payment;
              const alreadyPaid = payment?.status === PaymentStatus.APROBADO;
              const canPay =
                turno.status === AppointmentState.CONFIRMADO &&
                !coverage.covered &&
                coverage.state !== "PENDIENTE" &&
                !alreadyPaid;

              return (
                <li
                  key={turno.id}
                  className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-zinc-900">
                        {turno.doctor.profile.firstName}{" "}
                        {turno.doctor.profile.lastName}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        {AGENDA_SPECIALITY_LABELS[turno.doctor.speciality] ??
                          turno.doctor.speciality}{" "}
                        · Matrícula {turno.doctor.licenseNumber}
                      </p>
                      <p className="mt-1 text-sm text-zinc-700">
                        {dateFormatter.format(turno.startsAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${COVERAGE_BADGE_CLASSES[coverage.state]}`}
                      >
                        {coverage.label}
                      </span>
                      <span className="text-base font-bold text-zinc-900">
                        {moneyFormatter.format(Number(turno.doctor.consultFee))}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 text-sm text-zinc-600">{coverage.detail}</p>

                  {payment ? (
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                      <span className="font-medium">Pago:</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${PAYMENT_BADGE_CLASSES[payment.status]}`}
                      >
                        {PAYMENT_STATUS_LABELS[payment.status]}
                      </span>
                      {payment.status === PaymentStatus.APROBADO &&
                      payment.paidAt ? (
                        <span>{dateFormatter.format(payment.paidAt)}</span>
                      ) : null}
                      {payment.transactionCode ? (
                        <span className="text-xs text-zinc-500">
                          Código {payment.transactionCode}
                        </span>
                      ) : null}
                    </p>
                  ) : null}

                  {canPay ? (
                    <Link
                      href={`/paciente/pagos/${turno.id}`}
                      className="mt-3 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
                    >
                      Ver resumen y pagar
                    </Link>
                  ) : null}

                  {!canPay &&
                  !alreadyPaid &&
                  coverage.state !== "PENDIENTE" &&
                  !coverage.covered &&
                  turno.status !== AppointmentState.CONFIRMADO ? (
                    <p className="mt-2 text-xs text-zinc-500">
                      Esta consulta ya no admite pago online.
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-xs text-zinc-500">
        La pasarela de pago es simulada: el resultado que elijas se registra en
        el sistema con su estado real, sin mover dinero.
      </p>
    </section>
  );
}
