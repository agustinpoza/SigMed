import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireActor } from "@/lib/actor";
import { isUuid } from "@/lib/forms";
import { medicoAtendioAPaciente, obtenerHistorialPaciente } from "@/lib/clinical-records";
import { UserRole } from "@/generated/prisma/enums";
import ClinicalHistoryTable from "@/app/(portal)/paciente/historial/clinical-history-table";

export const metadata = {
  title: "Historial clínico del paciente",
};

export default async function HistorialPacientePage({
  params,
  searchParams,
}: PageProps<"/medico/pacientes/[pacienteId]/historial">) {
  const { pacienteId } = await params;
  const { registrado } = await searchParams;
  const actor = await requireActor(UserRole.MEDICO);

  if (!isUuid(pacienteId)) notFound();

  // CA2: el médico solo ve el historial de pacientes que atendió. Se responde
  // 404 para no revelar si el paciente existe.
  if (!(await medicoAtendioAPaciente(actor.id, pacienteId))) notFound();

  const [paciente, entries] = await Promise.all([
    prisma.patient.findUnique({
      where: { id: pacienteId },
      select: { profile: { select: { firstName: true, lastName: true, dni: true } } },
    }),
    obtenerHistorialPaciente(pacienteId),
  ]);

  if (!paciente) notFound();

  return (
    <section className="mx-auto w-full max-w-5xl overflow-hidden rounded-md border border-zinc-200 bg-white">
      <header className="border-b border-zinc-200 px-5 py-4 sm:px-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          Historial clínico de {paciente.profile.lastName}, {paciente.profile.firstName}
        </h1>
        <p className="text-sm text-zinc-600">DNI {paciente.profile.dni}</p>
      </header>
      {registrado ? (
        <p
          role="status"
          className="m-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 sm:mx-6"
        >
          La evolución médica se registró en la ficha del paciente.
        </p>
      ) : null}
      <ClinicalHistoryTable key={pacienteId} records={entries} />
    </section>
  );
}
