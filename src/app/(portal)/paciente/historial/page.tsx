import { getCurrentActor } from "@/lib/actor";
import { obtenerHistorialPaciente } from "@/lib/clinical-records";
import ClinicalHistoryTable from "./clinical-history-table";

export const metadata = {
  title: "Mi historial clínico | SigMed",
};

export default async function HistorialPage() {
  const actor = await getCurrentActor();

  if (!actor || actor.role !== "PACIENTE") {
    return (
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-md border border-zinc-200 bg-white">
        <header className="border-b border-zinc-200 px-5 py-4 sm:px-6">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            Mi historial clínico
          </h1>
        </header>
        <p className="px-5 py-8 text-center text-sm text-zinc-600 sm:px-6">
          {!actor
            ? "No hay una sesión de paciente activa."
            : "No tenés acceso a esta sección."}
        </p>
      </div>
    );
  }

  const entries = await obtenerHistorialPaciente(actor.id);

  return (
    <section className="mx-auto w-full max-w-5xl overflow-hidden rounded-md border border-zinc-200 bg-white">
      <header className="border-b border-zinc-200 px-5 py-4 sm:px-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          Mi historial clínico
        </h1>
      </header>
      <ClinicalHistoryTable key={actor.id} records={entries} />
    </section>
  );
}
