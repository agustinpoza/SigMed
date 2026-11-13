// app/(portal)/medico/perfil/page.tsx
import PerfilForm from "@/app/ui/medico/perfil/perfil-form";
import { getCurrentActor } from "@/lib/actor";
import { UserRole } from "@/generated/prisma/enums";
import { Speciality } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

const SPECIALITY_LABELS: Record<Speciality, string> = {
  CLINICO: "Clínica médica",
  PEDIATRA: "Pediatría",
  TRAUMATOLOGO: "Traumatología",
};

export default async function PerfilPage() {
    const medico = await getCurrentActor();

    if (!medico || medico.role !== UserRole.MEDICO) {
        return (
            <p className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
                No tenés permiso para acceder a esta sección. Solo está disponible
                para médicos.
            </p>
        );
    }

    const fichaMedica = await prisma.doctor.findUnique({
        where: { id: medico.id },
        select: { speciality: true, licenseNumber: true, consultFee: true },
    });

    if (!fichaMedica) {
        return (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
                No se encontró la ficha profesional de este médico.
            </p>
        );
    }

    return (
        <div className="flex flex-col">
            <div className="flex flex-col justify-start bg-linear-to-l from-slate-300 to-slate-200 rounded-xl px-3 py-2 my-4">
                <h1 className="text-2xl font-bold tracking-tight text-black">
                    Mi perfil
                </h1>
                <p className="text-sm text-gray-500">
                    Consulta y modifica el valor de tu consulta particular. Los turnos particulares se calculan con tu valor ingresado, no con una tarifa general.
                </p>
            </div>
            <div className="rounded-xl border border-gray-400 bg-white">
                <PerfilForm
                    medico={{
                        nombre: `${medico.firstName} ${medico.lastName}`,
                        dni: medico.dni,
                        especialidad:
                            SPECIALITY_LABELS[fichaMedica.speciality] ??
                            fichaMedica.speciality,
                        matricula: fichaMedica.licenseNumber,
                        valorConsulta: Number(fichaMedica.consultFee),
                    }}
                />
            </div>
        </div>
    );
}