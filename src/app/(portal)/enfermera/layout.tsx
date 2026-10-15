import RoleShell from "../role-shell";
import { requireActor } from "@/lib/actor";
import { UserRole } from "@/generated/prisma/enums";

const items = [
  { href: "/enfermera", label: "Inicio" },
  { href: "/enfermera/vacunas", label: "Catálogo de vacunas" },
  { href: "/enfermera/inventario", label: "Stock" },
  { href: "/enfermera/turnos-vacunacion", label: "Turnos de vacunación" },
];

export default async function EnfermeraLayout({ children }: LayoutProps<"/enfermera">) {
  await requireActor(UserRole.ENFERMERA);

  return (
    <RoleShell role="Enfermera" items={items}>
      {children}
    </RoleShell>
  );
}
