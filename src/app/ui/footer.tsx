// app/ui/footer.tsx
import Image from "next/image";

export default function Footer() {

  return (
    <footer className="bg-slate-800 text-gray-400 p-2 w-full mt-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center">
            <div className="flex flex-col m-1 sm:m-0 items-center text-sm text-gray-400">
                <p>Comision 9</p>
                <p><strong>Proyectos de Sistemas de Software</strong></p>
                <p>DCIC - Universidad Nacional del Sur</p>
                <p>Bahía Blanca</p>
            </div>
            <div className="flex items-center justify-center">
                <Image
                    className="h-auto m-2"
                    src="/logoDCIC.png"
                    alt="Logo DCIC"
                    loading="eager"
                    width={100}
                    height={44}
                />
            </div>
            <div className="grid grid-cols-2 gap-2 justify-self-center">
                <div className="flex flex-col text-sm justify-center place-content-center m-1 sm:m-0">
                    <div className="flex justify-start text-gray-400 gap-1"> 
                        Tomas de la Iglesia
                    </div>
                    <div className="flex justify-start text-gray-400 gap-1"> 
                        Ignacio Iommi
                    </div>
                    <div className="flex justify-start text-gray-400 gap-1"> 
                        Nicolas Julian
                    </div>
                    <div className="flex justify-start text-gray-400 gap-1"> 
                        Gonzalo Perez
                    </div>
                </div>
                <div className="flex flex-col text-sm justify-center place-content-center m-1 sm:m-0">
                    <div className="flex justify-start text-gray-400 gap-1"> 
                        Agustin Poza
                    </div>
                    <div className="flex justify-start text-gray-400 gap-1"> 
                        Juan Ignacio Sanchez
                    </div>
                    <div className="flex justify-start text-gray-400 gap-1"> 
                        Pierino Spina
                    </div>
                    <div className="flex justify-start text-gray-400 gap-1"> 
                        Francisco Uyua
                    </div>
                </div>
            </div>
        </div>
    </footer>
  );
}