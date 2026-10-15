import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SignUpForm } from "../sign-up-form";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-md sm:p-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Crear cuenta
          </h1>
          <p className="text-sm text-zinc-600">
            Completá tus datos para registrarte en SigMed.
          </p>
        </header>

        <div className="mt-6">
          <SignUpForm />
        </div>

        <p className="mt-6 text-sm text-zinc-600">
          ¿Ya tenés cuenta?{" "}
          <Link
            className="font-medium text-slate-700 underline hover:text-slate-900"
            href="/sign-in"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
