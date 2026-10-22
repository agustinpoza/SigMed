import RoleShell from "../role-shell";
import { requireArea } from "@/lib/actor";

const items = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/horarios", label: "Horarios" },
  { href: "/admin/personal", label: "Alta de personal" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // El area de administracion se valida con el rol real: el administrador
  // siempre vuelve a su panel, incluso mientras ejerce otro rol.
  await requireArea("admin");

  return (
    <RoleShell role="Administrador" items={items}>
      {children}
    </RoleShell>
  );
}
