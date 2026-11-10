import { prisma } from "@/lib/db";
import {
  COVERAGE_BADGE_CLASSES,
  evaluarCobertura,
} from "@/lib/coverage";
import { CoverageForm } from "./coverage-form";

export const metadata = {
  title: "Validación de coberturas | SigMed",
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

// El layout de /admin ya exige rol ADMINISTRADOR; la acción vuelve a validarlo.
export default async function CoberturasPage() {
  const patients = await prisma.patient.findMany({
    include: {
      profile: true,
      insurance: true,
      coverageValidatedBy: {
        select: { firstName: true, lastName: true },
      },
    },
    orderBy: { profile: { lastName: "asc" } },
  });

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Validación de coberturas
        </h1>
        <p className="text-sm text-zinc-600">
          Registrá el resultado de la validación de la obra social de cada
          paciente. Una cobertura solo cuenta como válida si la obra social está
          aceptada, el afiliado está informado y la validación fue aprobada.
        </p>
      </header>

      <div className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
        <p>
          <strong className="text-emerald-800">Válida:</strong> la consulta queda
          cubierta.{" "}
          <strong className="text-red-700">No válida:</strong> la obra social
          rechazó la cobertura o no está aceptada.{" "}
          <strong className="text-orange-800">Inválida:</strong> faltan datos o
          son inconsistentes. En los dos últimos casos la consulta se abona como
          particular.
        </p>
      </div>

      {patients.length === 0 ? (
        <p className="rounded-md border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-600">
          Todavía no hay pacientes registrados.
        </p>
      ) : (
        <ul className="grid gap-3">
          {patients.map((patient) => {
            const coverage = evaluarCobertura(patient);
            const canValidate = Boolean(
              patient.insurance && patient.memberNumber?.trim(),
            );

            return (
              <li
                key={patient.id}
                className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900">
                      {patient.profile.lastName}, {patient.profile.firstName}
                    </h2>
                    <p className="text-xs text-zinc-500">
                      DNI {patient.profile.dni} · {patient.profile.email}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${COVERAGE_BADGE_CLASSES[coverage.state]}`}
                  >
                    {coverage.label}
                  </span>
                </div>

                <p className="mt-2 text-sm text-zinc-600">{coverage.detail}</p>

                <dl className="mt-2 grid gap-1 text-xs text-zinc-500 sm:grid-cols-2">
                  <div>
                    <dt className="inline font-semibold">Obra social: </dt>
                    <dd className="inline">
                      {patient.insurance
                        ? `${patient.insurance.name}${patient.insurance.accepted ? "" : " (no aceptada)"}`
                        : "Sin registrar"}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold">Afiliado: </dt>
                    <dd className="inline">{patient.memberNumber ?? "Sin informar"}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold">Plan: </dt>
                    <dd className="inline">{patient.plan ?? "Sin informar"}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold">Última validación: </dt>
                    <dd className="inline">
                      {patient.coverageValidatedAt
                        ? `${dateFormatter.format(patient.coverageValidatedAt)}${
                            patient.coverageValidatedBy
                              ? ` · ${patient.coverageValidatedBy.firstName} ${patient.coverageValidatedBy.lastName}`
                              : ""
                          }`
                        : "Sin registrar"}
                    </dd>
                  </div>
                </dl>

                {patient.coverageValidationNote ? (
                  <p className="mt-2 rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                    Nota: {patient.coverageValidationNote}
                  </p>
                ) : null}

                {canValidate ? (
                  <CoverageForm
                    key={`${patient.id}-${patient.coverageStatus ?? "sin-estado"}-${patient.coverageValidatedAt?.getTime() ?? 0}`}
                    patientId={patient.id}
                    currentStatus={patient.coverageStatus}
                    currentNote={patient.coverageValidationNote}
                  />
                ) : (
                  <p className="mt-3 border-t border-zinc-200 pt-3 text-xs text-orange-700">
                    No se puede validar: falta la obra social o el número de
                    afiliado. La consulta se considera particular.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
