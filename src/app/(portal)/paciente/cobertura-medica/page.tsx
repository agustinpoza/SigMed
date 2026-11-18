// app/(portal)/paciente/cobertura-medica/page.tsx
import CoberturaMessage from "@/app/ui/paciente/cobertura-message";
import CoberturaForm from "@/app/ui/paciente/cobertura-form";
import { getCurrentActor } from "@/lib/actor";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function ObraSocialPage() {
    const actor = await getCurrentActor();
    if (!actor)
        redirect("/sign-in");

    const paciente = await prisma.patient.findUnique({
        where: { id: actor.id },
        select: {
            insuranceId: true,
            memberNumber: true,
            plan: true,
            coverageStatus: true,
            insurance: { select: { name: true } },
        },
    });

    const prestadores = await prisma.insuranceProvider.findMany({
        where: {accepted: true},
        select: { id: true, name: true, accepted: true },
        orderBy: { name: "asc" },
    });

    if (!paciente) {
        return (
        <main>
            <p role="alert" className="text-2xl text-black font-bold m-1">
                No se encontró el registro del paciente. Intentá nuevamente o contactá con administración.
            </p>
        </main>
        );
    };

    return(
        <main className="flex flex-col gap-2">
            <section className="flex flex-col justify-start rounded-xl bg-linear-to-l from-slate-300 to-slate-200 px-3 py-2">
                <h1 className="text-2xl text-black font-bold">
                    Mi Cobertura Médica
                </h1>
                <p className="text-sm text-gray-700">
                    Registrá o actualizá tu obra social o prepaga para agilizar la atención y facturación de tus consultas.
                </p>
            </section>
            <div className="flex flex-col bg-white p-4 rounded-lg gap-2">
                <CoberturaMessage nombreCobertura={paciente.insurance?.name ?? null} plan={paciente.plan} estado={paciente.coverageStatus} />
                <CoberturaForm idCobertura={paciente.insuranceId} nAfiliado={paciente.memberNumber} planCobertura={paciente.plan} prestadores={prestadores} />
            </div>
        </main>
        );
}