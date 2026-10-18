import RoleShell from "../role-shell";
import { requireActor } from "@/lib/actor";
import { UserRole } from "@/generated/prisma/enums";

const items = [
  { href: "/paciente", label: "Inicio" },
  { href: "/paciente/turnos", label: "Buscar turnos" },
  { href: "/paciente/historial", label: "Mi historial" },
];

export default async function PacienteLayout({ children }: LayoutProps<"/paciente">) {
  await requireActor(UserRole.PACIENTE);

  return (
    <RoleShell role="Paciente" items={items}>
      {children}
    </RoleShell>
  );
}
