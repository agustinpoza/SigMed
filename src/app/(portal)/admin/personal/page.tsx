import { StaffForm } from "./staff-form";

export const metadata = {
  title: "Alta de personal",
};

// El layout de /admin ya exige rol ADMINISTRADOR; la acción vuelve a validarlo.
export default function AltaPersonalPage() {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col justify-start rounded-xl bg-linear-to-l from-slate-300 to-slate-200 px-3 py-2">
        <h1 className="text-2xl font-semibold tracking-tight text-black">Alta de personal</h1>
        <p className="text-sm text-gray-700">
          Creá la cuenta de un médico o una enfermera y asignale su rol.
        </p>
      </header>

      <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
        <StaffForm />
      </div>
    </section>
  );
}
