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
      <div className="flex flex-col gap-6">
        <header className="flex flex-col justify-start rounded-xl bg-linear-to-l from-slate-300 to-slate-200 px-3 py-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Mi historial clínico
          </h1>
        </header>
        <p className="w-full rounded-md border border-zinc-200 bg-white px-5 py-8 text-center text-sm text-zinc-600 sm:px-6">
          {!actor
            ? "No hay una sesión de paciente activa."
            : "No tenés acceso a esta sección."}
        </p>
      </div>
    );
  }

  const entries = await obtenerHistorialPaciente(actor.id);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col justify-start rounded-xl bg-linear-to-l from-slate-300 to-slate-200 px-3 py-2">
        <h1 className="text-2xl font-bold tracking-tight text-black">
          Mi historial clínico
        </h1>
        <p className="text-sm text-gray-700">
          Consultá tu historial clínico registrado.
        </p>
      </header>
      <section className="w-full rounded-md border border-zinc-200 bg-white">
        <ClinicalHistoryTable key={actor.id} records={entries} />
      </section>
    </div>
  );
}
