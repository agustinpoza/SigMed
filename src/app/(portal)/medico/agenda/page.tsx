import Placeholder from "../../placeholder";

export default function AgendaPage() {
  return (
    <Placeholder
      title="Hoja de trabajo diaria"
      description="Grilla de los turnos del día con los datos del paciente y el estado de cada turno."
      tasks={[
        "1.4.1 · Pantalla con los turnos del día del médico",
        "1.4.2 · Estado de cada turno: reservado, cancelado, atendido",
        "CA1 · Solo los turnos propios, por día o semana",
        "CA2 · Datos del paciente y filtro por estado",
      ]}
    />
  );
}
