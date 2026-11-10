import { AGENDA_SPECIALTY_LABELS } from "@/lib/agenda";
import {
  PAYMENT_STATUS_LABELS,
  listarCargosInasistencia,
} from "@/lib/payments";
import { PaymentStatus } from "@/generated/prisma/enums";
import { condonarInasistencia, registrarCobroInasistencia } from "./actions";

export const metadata = {
  title: "Inasistencias y deudas | SigMed",
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

const STATUS_CLASSES: Record<PaymentStatus, string> = {
  PENDIENTE: "border-amber-300 bg-amber-50 text-amber-800",
  APROBADO: "border-emerald-300 bg-emerald-50 text-emerald-800",
  RECHAZADO: "border-red-300 bg-red-50 text-red-700",
  ANULADO: "border-zinc-300 bg-zinc-50 text-zinc-600",
};

// El layout de /admin ya exige rol ADMINISTRADOR; las acciones lo revalidan.
export default async function InasistenciasPage() {
  const cargos = await listarCargosInasistencia();

  const pendientes = cargos.filter(
    (cargo) => cargo.status === PaymentStatus.PENDIENTE,
  );
  const totalPendiente = pendientes.reduce(
    (total, cargo) => total + Number(cargo.amount),
    0,
  );

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Inasistencias y deudas
        </h1>
        <p className="text-sm text-zinc-600">
          Cuando un turno se marca como ausente, el sistema imputa al paciente la
          deuda por el valor total de la consulta del profesional. No se generan
          cargos duplicados ni se cobra a turnos atendidos.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            Deudas pendientes
          </p>
          <p className="text-2xl font-bold text-amber-900">
            {moneyFormatter.format(totalPendiente)}
          </p>
          <p className="text-xs text-amber-800">
            {pendientes.length} cargo{pendientes.length === 1 ? "" : "s"} por
            cobrar
          </p>
        </div>
        <div className="rounded-md border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Cargos registrados
          </p>
          <p className="text-2xl font-bold text-zinc-900">{cargos.length}</p>
          <p className="text-xs text-zinc-500">
            Incluye deudas cobradas, pendientes y condonadas.
          </p>
        </div>
      </div>

      {cargos.length === 0 ? (
        <p className="rounded-md border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-600">
          Todavía no se registraron inasistencias con deuda.
        </p>
      ) : (
        <ul className="grid gap-3">
          {cargos.map((cargo) => (
            <li
              key={cargo.id}
              className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">
                    {cargo.appointment.patient.profile.lastName},{" "}
                    {cargo.appointment.patient.profile.firstName}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    DNI {cargo.appointment.patient.profile.dni} · Turno del{" "}
                    {dateFormatter.format(cargo.appointment.startsAt)}
                  </p>
                  <p className="mt-1 text-sm text-zinc-700">
                    {cargo.appointment.doctor.profile.firstName}{" "}
                    {cargo.appointment.doctor.profile.lastName} ·{" "}
                    {AGENDA_SPECIALTY_LABELS[
                      cargo.appointment.doctor.specialty
                    ] ?? cargo.appointment.doctor.specialty}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[cargo.status]}`}
                  >
                    {PAYMENT_STATUS_LABELS[cargo.status]}
                  </span>
                  <span className="text-lg font-bold text-zinc-900">
                    {moneyFormatter.format(Number(cargo.amount))}
                  </span>
                </div>
              </div>

              {cargo.paidAt ? (
                <p className="mt-2 text-xs text-emerald-700">
                  Cobrada el {dateFormatter.format(cargo.paidAt)}
                </p>
              ) : null}

              {cargo.status === PaymentStatus.PENDIENTE ? (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-200 pt-3">
                  <form action={registrarCobroInasistencia}>
                    <input type="hidden" name="paymentId" value={cargo.id} />
                    <button
                      type="submit"
                      className="rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-zinc-700"
                    >
                      Registrar cobro
                    </button>
                  </form>
                  <form action={condonarInasistencia}>
                    <input type="hidden" name="paymentId" value={cargo.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                    >
                      Condonar deuda
                    </button>
                  </form>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
