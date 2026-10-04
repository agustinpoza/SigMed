import Placeholder from "../../placeholder";

export default function InventarioPage() {
  return (
    <Placeholder
      title="Actualización de stock"
      description="Registro de movimientos por lote con historial de los últimos ingresos y egresos."
      tasks={[
        "3.2.1 · Cargar lote, vencimiento y cantidad",
        "3.2.2 · Sumar o descontar dosis",
        "3.2.3 · El stock nunca queda negativo",
        "CA2 · Trazabilidad inmutable de usuario, fecha y lote",
      ]}
    />
  );
}
