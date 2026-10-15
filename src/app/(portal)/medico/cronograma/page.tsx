// app/(portal)/medico/cronograma/page.tsx

export default function CronogramaPage() {

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
            <div className="flex flex-row border-y border-gray-400">
                <div className="flex flex-col">
                    <p className="text-black font-semibold">
                        Calendario del mes
                    </p>
                </div>
                <div>
                    <p className="text-black font-semibold">
                        Configuración de franja horaria
                    </p>
                </div>
            </div>
            <div>
                <span>
                    Resumen de disponibilidad cargada
                </span>
            </div>
        </section>
    );
}