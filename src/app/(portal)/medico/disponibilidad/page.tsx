// app/(portal)/medico/disponibilidad/page.tsx
import DisponibilidadForm from "@/app/ui/medico/disponibilidad/disponibilidad-form";

export default function DisponibilidadPage() {

    return (
        <section>
            <div className="flex flex-col m-4">
                <h1 className="text-2xl text-black font-bold">
                    Disponibilidad mensual
                </h1>
                <p className="text-sm text-zinc-500">
                    Defini los días y horarios en los que vas a atender durante el mes
                </p>
            </div>
            <div className="rounded-xl border bg-white">
                <DisponibilidadForm />
            </div>
        </section>
    );
}