import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActor } from "@/lib/actor";
import { isUuid } from "@/lib/forms";
import { obtenerTurnoParaEvolucion } from "@/lib/clinical-records";
import { AppointmentState, UserRole } from "@/generated/prisma/enums";
import { EvolutionForm } from "./evolution-form";

export const metadata = {
  title: "Evolución médica",
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Argentina/Buenos_Aires",
});

function Aviso({ children, patientId }: { children: React.ReactNode; patientId?: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
      <p>{children}</p>
      <div className="flex gap-3">
        <Link href="/medico/agenda" className="font-medium text-zinc-900 underline">
          Volver a la hoja de trabajo
        </Link>
        {patientId ? (
          <Link
            href={`/medico/pacientes/${patientId}/historial`}
            className="font-medium text-zinc-900 underline"
          >
            Ver historial del paciente
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default async function EvolucionPage({ params }: PageProps<"/medico/evolucion/[turnoId]">) {
  const { turnoId } = await params;
  const actor = await requireActor(UserRole.MEDICO);

  if (!isUuid(turnoId)) notFound();

  // Solo se encuentran turnos del médico logueado: los ajenos dan 404.
  const turno = await obtenerTurnoParaEvolucion(turnoId, actor.id);
  if (!turno) notFound();

  const patient = `${turno.patient.profile.lastName}, ${turno.patient.profile.firstName}`;
  const doctor = `${turno.doctor.profile.lastName}, ${turno.doctor.profile.firstName}`;

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Evolución médica</h1>
        <p className="text-sm text-zinc-600">
          Cargá el diagnóstico, el tratamiento y las indicaciones en la ficha del paciente.
        </p>
      </header>

      {turno.clinicalRecord ? (
        <Aviso patientId={turno.patientId}>
          Este turno ya tiene una evolución registrada. Los registros clínicos no se
          modifican una vez guardados.
        </Aviso>
      ) : turno.status !== AppointmentState.ATENDIDO ? (
        <Aviso>
          Solo se puede registrar la evolución de un turno atendido. Marcá el turno
          como atendido desde la hoja de trabajo.
        </Aviso>
      ) : (
        <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
          <EvolutionForm
            turnoId={turno.id}
            patient={patient}
            appointmentDate={dateFormatter.format(turno.startsAt)}
            doctor={doctor}
          />
        </div>
      )}
    </section>
  );
}
