import RoleShell from "../role-shell";
import { requireArea } from "@/lib/actor";

const items = [
  { href: "/enfermera", label: "Inicio" },
  { href: "/enfermera/vacunas", label: "Catálogo de vacunas" },
  { href: "/enfermera/stock", label: "Stock" },
  { href: "/enfermera/umbral-critico", label: "Umbral crítico" },
  { href: "/enfermera/turnos-vacunacion", label: "Turnos de vacunación" },
];

export default async function EnfermeraLayout({ children }: LayoutProps<"/enfermera">) {
  // El area de enfermeria se valida con el rol efectivo.
  await requireArea("enfermera");

  return (
    <RoleShell role="Enfermera" items={items}>
      {children}
    </RoleShell>
  );
}
