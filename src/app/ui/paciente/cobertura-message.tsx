// app/ui/paciente/cobertura-message.tsx
import { HiOutlineCheckCircle, HiOutlineInformationCircle, HiOutlineXCircle } from "react-icons/hi";

export default function CoberturaMessage() {

    return(
        <main>
            {/* Preguntar el estado de la cobertura del paciente */}
            <div className="flex flex-row justify-center items-center rounded-xl bg-green-100 p-2 border border-green-400">
                <HiOutlineCheckCircle className="size-5 text-emerald-600 font-semibold m-1"/>
                <p className="text-emerald-600">
                    <strong>Cobertura Activa: </strong> Tenés registrada la obra social <strong>Nombre (Plan)</strong>. 
                    Podés modificar los datos a continuación si cambiaste de plan o prestador.
                </p>
            </div>
            {/*
            <div className="flex flex-row justify-center items-center rounded-xl bg-yellow-100 p-2 border border-yellow-400">
                <HiOutlineInformationCircle className="size-5 text-amber-600 font-semibold m-1"/>
                <p className="text-amber-600">
                    <strong>Cobertura Pendiente: </strong> Tenés registrada la obra social <strong>Nombre (Plan)</strong>. 
                    Podés actualizar los datos a continuación si cambiaste de plan o prestador.
                </p>
            </div>
            <div className="flex flex-row justify-center items-center rounded-xl bg-red-100 p-2 border border-red-400">
                <HiOutlineXCircle className="size-5 text-red-600 font-semibold m-1"/>
                <p className="text-red-600">
                    <strong>Usted no tiene cobertura activa </strong>. 
                    Podés ingresar los datos los datos de tu cobertura a continuación.
                </p>
            </div>
            */}
        </main>
    );
}