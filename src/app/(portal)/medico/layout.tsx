import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";
import RoleShell from "../role-shell";
import { requireActor } from "@/lib/actor";
import { UserRole } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: {
    template: "%s | Medico",
    default: "Medico",
  },
  description: "Consultas de la jornada y organización de la atención propia"
};

const items = [
  { href: "/medico", label: "Inicio" },
  { href: "/medico/agenda", label: "Hoja de trabajo" },
];

export default async function MedicoLayout({ children }: LayoutProps<"/medico">) {
  await requireActor(UserRole.MEDICO);

  return (
    <RoleShell role="Médico" items={items}>
      {children}
    </RoleShell>
  );
}
