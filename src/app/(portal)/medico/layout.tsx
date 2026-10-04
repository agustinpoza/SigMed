import RoleShell from "../role-shell";

const items = [
  { href: "/medico", label: "Inicio" },
  { href: "/medico/agenda", label: "Hoja de trabajo" },
];

export default function MedicoLayout({ children }: LayoutProps<"/medico">) {
  return (
    <RoleShell role="Médico" items={items}>
      {children}
    </RoleShell>
  );
}
