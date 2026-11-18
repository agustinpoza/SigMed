import { requireArea } from "@/lib/actor";
import { listVaccinesForCriticalConfig } from "@/services/vaccineService";
import CriticalLevelPanel from "./critical-level-panel";

export const metadata = {
  title: "Umbral crítico | SigMed",
};

export default async function UmbralCriticoPage() {
  await requireArea("enfermera");
  const vaccines = await listVaccinesForCriticalConfig();

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-start rounded-xl bg-linear-to-l from-slate-300 to-slate-200 px-3 py-2">
        <h1 className="text-2xl font-semibold tracking-tight text-black">
          Panel de configuración de stock crítico
        </h1>
        <p className="mt-1 text-sm text-gray-700">
          Definí el nivel de stock crítico de cada vacuna para saber cuándo hay que reponerla.
        </p>
      </header>
      {vaccines.length === 0 ? (
        <p className="text-sm text-zinc-600">No hay vacunas cargadas en el inventario.</p>
      ) : (
        <CriticalLevelPanel vaccines={vaccines} />
      )}
    </div>
  );
}
