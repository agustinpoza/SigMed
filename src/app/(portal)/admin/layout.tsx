import RoleShell from "../role-shell";
import { requireActor } from "@/lib/actor";
import { UserRole } from "@/generated/prisma/enums";

const items = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/horarios", label: "Horarios" },
  { href: "/admin/personal", label: "Alta de personal" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireActor(UserRole.ADMINISTRADOR);

  return (
    <RoleShell role="Administrador" items={items}>
      {children}
    </RoleShell>
  );
}
