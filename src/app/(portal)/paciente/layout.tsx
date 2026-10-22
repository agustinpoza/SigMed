import RoleShell from "../role-shell";
import { requireArea } from "@/lib/actor";

const items = [
  { href: "/paciente", label: "Inicio" },
  { href: "/paciente/turnos", label: "Buscar turnos" },
  { href: "/paciente/mis-turnos", label: "Mis turnos" },
  { href: "/paciente/historial", label: "Mi historial" },
];

export default async function PacienteLayout({ children }: LayoutProps<"/paciente">) {
  // El area de paciente se valida con el rol efectivo.
  await requireArea("paciente");

  return (
    <RoleShell role="Paciente" items={items}>
      {children}
    </RoleShell>
  );
}
