// app/(portal)/paciente/obra-social/page.tsx
import CoberturaMessage from "@/app/ui/paciente/cobertura-message";
import ObraSocialForm from "@/app/ui/paciente/obra-social-form";
import { getCurrentActor } from "@/lib/actor";

export default async function ObraSocialPage() {
    const paciente = await getCurrentActor();

    return(
        <main className="flex flex-col bg-white p-6 rounded-lg gap-2">
            <section>
                <h1 className="text-2xl text-black font-bold m-1">
                    Mi Cobertura Médica
                </h1>
                <p className="text-gray-500 m-1">
                    Registrá o actualizá tu obra social o prepaga para agilizar la atención y facturación de tus consultas.
                </p>
            </section>
            <CoberturaMessage />
            <ObraSocialForm />
        </main>
    );
}