// app/(portal)/medico/disponibilidad/page.tsx
import DisponibilidadForm from "@/app/ui/medico/disponibilidad/disponibilidad-form";

export default function DisponibilidadPage() {

    return (
        <section className="rounded-xl border bg-white">
            <div className="flex flex-col m-1">
                <h1 className="text-2xl text-black font-bold">
                    Disponibilidad mensual
                </h1>
                <p className="text-sm text-gray-400">
                    Defini los días y horarios en los que vas a atender durante el mes
                </p>
            </div>
            <DisponibilidadForm />
        </section>
    );
}