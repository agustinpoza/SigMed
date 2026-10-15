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
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta</h1>
        <p className="text-sm text-zinc-600">
          Completá tus datos para registrarte en SigMed.
        </p>
      </header>

      <SignUpForm />

      <p className="text-sm text-zinc-500">
        ¿Ya tenés cuenta?{" "}
        <Link className="underline" href="/sign-in">
          Iniciar sesión
        </Link>
      </p>
    </main>
  );
}
