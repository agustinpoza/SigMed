import Placeholder from "../../placeholder";

export default function HorariosPage() {
  return (
    <Placeholder
      title="Modificación de horarios"
      description="Selección de un profesional y edición de sus franjas de atención."
      tasks={[
        "1.5.1 · Elegir un médico y ver sus horarios",
        "1.5.2 · Cambiar esos horarios y guardarlos",
        "1.5.3 · Actualizar los turnos disponibles según el cambio",
        "CA1 · El cambio se refleja en la agenda publicada",
        "CA2 · El médico no puede modificar su propio horario",
      ]}
    />
  );
}
