// app/(portal)/medico/disponibilidad/page.tsx
"use client";
import { useState } from "react";
import BloqueosAgenda from "@/app/ui/medico/disponibilidad/bloqueos-agenda";
import DisponibilidadForm from "@/app/ui/medico/disponibilidad/disponibilidad-form";

export default function DisponibilidadPage() {
    const [refreshKey, setRefreshKey] = useState(0);

    return (
        <section className="rounded-xl border bg-white">
            <div className="flex flex-row justify-between">
                <div className="flex flex-col m-4">
                    <h1 className="text-2xl text-black font-bold">
                        Disponibilidad mensual
                    </h1>
                    <p className="text-sm text-gray-400">
                        Defini los días y horarios en los que vas a atender durante el mes
                    </p>
                </div>
                <BloqueosAgenda
                    onConfirmed={() => setRefreshKey((key) => key + 1)}
                />
            </div>
            <DisponibilidadForm refreshKey={refreshKey} />
        </section>
    );
}