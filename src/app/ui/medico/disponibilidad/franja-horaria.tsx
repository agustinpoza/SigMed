// app/ui/medico/disponibilidad/franja-horaria.tsx
import { HiOutlineInformationCircle } from "react-icons/hi";

interface FranjaHorariaProps {
    horaInicio: string;
    onChangeInicio: (value: string) => void;
    horaFin: string;
    onChangeFin: (value: string) => void;
    deshabilitado: boolean;
    error: string | null;
    onGuardar: () => void;
}

export default function FranjaHoraria({ horaInicio, onChangeInicio, horaFin, onChangeFin, deshabilitado, error, onGuardar }: FranjaHorariaProps) {

    return (
        <section>
            <h2 className="text-xl text-black font-semibold m-1">
                Configuración de franja horaria
            </h2>
            <div className="grid grid-cols-2 gap-1">
                {/* Selector hora inicial */}
                <div className="flex flex-col m-1 gap-1">
                    <label htmlFor="hora-inicio" className="text-black">
                        Hora inicio
                    </label>
                    <input
                        id="hora-inicio"
                        type="time"
                        value={horaInicio}
                        onChange={(e) => onChangeInicio(e.target.value)}
                        className="rounded-sm text-black border border-gray-400 bg-white p-1"
                    />
                </div>
                {/* Selector hora final */}
                <div className="flex flex-col m-1 gap-1">
                    <label htmlFor="hora-fin" className="text-black">
                        Hora fin
                    </label>
                    <input
                        id="hora-fin"
                        type="time"
                        value={horaFin}
                        onChange={(e) => onChangeFin(e.target.value)}
                        className="rounded-sm text-black border border-gray-400 bg-white p-1"
                    />
                </div>
                {/* Selector duracion */}
            </div>

            {error && (
                <p role="alert" className="text-xs text-red-600">
                    {error}
                </p>
            )}

            <button
                onClick={onGuardar}
                disabled={deshabilitado}
                className="justify-center rounded-lg text-gray-200 bg-slate-600 w-full m-2 p-2"
            >
                Guardar disponibilidad
            </button>
            <div className="flex flex-row rounded-md border border-blue-800 bg-blue-200 w-full m-2 p-2">
                <HiOutlineInformationCircle className="text-lg text-blue-800"/>
                <p className="text-sm text-blue-800 ml-1">
                    Una vez guardad la disponibilidad mensual, solo un administrador podrá modificarla.
                </p>
            </div>
        </section>
    );
}