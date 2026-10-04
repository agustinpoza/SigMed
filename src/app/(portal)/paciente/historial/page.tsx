import Placeholder from "../../placeholder";

export default function HistorialPage() {
  return (
    <Placeholder
      title="Mi historial clínico"
      description="Consultas ordenadas por fecha con diagnóstico, tratamiento e indicaciones."
      tasks={[
        "5.2.1 · Sección Mi historial para el paciente",
        "5.2.2 · Consultas ordenadas por fecha",
        "5.2.3 · Cada paciente ve solo su historial",
        "CA2 · Solo los registros clínicos propios",
      ]}
    />
  );
}
