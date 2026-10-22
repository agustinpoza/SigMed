import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";
import RoleShell from "../role-shell";
import { requireArea } from "@/lib/actor";

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
  { href: "/medico/disponibilidad", label: "Disponibilidad" },
];

export default async function MedicoLayout({ children }: LayoutProps<"/medico">) {
  // El area medica se valida con el rol efectivo: el administrador entra aca
  // unicamente mediante el modo ejercicio.
  await requireArea("medico");

  return (
    <RoleShell role="Médico" items={items}>
      {children}
    </RoleShell>
  );
}
