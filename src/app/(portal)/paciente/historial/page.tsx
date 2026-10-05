import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/dev-actor";

export const metadata = {
  title: "Mi historial clínico | SigMed",
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "America/Argentina/Buenos_Aires",
});

const specialtyNames: Record<string, string> = {
  CLINICO: "Clínica médica",
  PEDIATRA: "Pediatría",
  TRAUMATOLOGO: "Traumatología",
};

export default async function HistorialPage() {
  const actor = await getCurrentActor();

  if (!actor) {
    return (
      <div className="space-y-2">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Mi historial clínico
          </h1>
        </header>
        <p className="border-t border-zinc-200 pt-4 text-sm text-zinc-600" role="status">
          No hay una sesión de paciente activa.
        </p>
      </div>
    );
  }

  if (actor.role !== "PACIENTE") {
    return (
      <div className="space-y-2">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Mi historial clínico
          </h1>
        </header>
        <p className="border-t border-zinc-200 pt-4 text-sm text-zinc-600" role="status">
          No tenés acceso a esta sección.
        </p>
      </div>
    );
  }

  const records = await prisma.clinicalRecord.findMany({
    where: { appointment: { patientId: actor.id } },
    orderBy: { appointment: { startsAt: "desc" } },
    select: {
      id: true,
      diagnosis: true,
      treatment: true,
      indications: true,
      appointment: {
        select: {
          startsAt: true,
          attendanceAt: true,
          doctor: {
            select: {
              specialty: true,
              profile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Mi historial clínico
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Diagnósticos, tratamientos e indicaciones de tus atenciones.
          </p>
        </div>
        <p className="text-sm text-zinc-500" aria-live="polite">
          {records.length} {records.length === 1 ? "atención" : "atenciones"}
        </p>
      </header>

      {records.length === 0 ? (
        <p className="border-t border-zinc-200 pt-5 text-sm text-zinc-600" role="status">
          Todavía no hay atenciones registradas.
        </p>
      ) : (
        <ol className="divide-y divide-zinc-200 border-y border-zinc-200">
          {records.map((record) => {
            const appointmentDate =
              record.appointment.attendanceAt ?? record.appointment.startsAt;
            const doctorName = `${record.appointment.doctor.profile.firstName} ${record.appointment.doctor.profile.lastName}`;
            const specialty = specialtyNames[record.appointment.doctor.specialty];

            return (
              <li key={record.id} className="py-5 sm:py-6">
                <article className="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-8">
                  <div>
                    <time
                      dateTime={appointmentDate.toISOString()}
                      className="text-sm font-medium text-zinc-900"
                    >
                      {dateFormatter.format(appointmentDate)}
                    </time>
                    <p className="mt-1 text-sm text-zinc-600">{doctorName}</p>
                    <p className="text-sm text-zinc-500">{specialty}</p>
                  </div>

                  <dl className="grid gap-4">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Diagnóstico
                      </dt>
                      <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-900">
                        {record.diagnosis}
                      </dd>
                    </div>

                    {record.treatment ? (
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                          Tratamiento
                        </dt>
                        <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                          {record.treatment}
                        </dd>
                      </div>
                    ) : null}

                    {record.indications ? (
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                          Indicaciones
                        </dt>
                        <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                          {record.indications}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
