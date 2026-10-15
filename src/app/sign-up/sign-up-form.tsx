"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";

type Step = "form" | "verify";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500";
const labelClass = "flex flex-col gap-1 text-sm font-medium text-zinc-700";
const errorClass = "text-xs text-red-600";
const primaryButtonClass =
  "rounded-md bg-slate-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50";
const secondaryButtonClass =
  "rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50";

export function SignUpForm() {
  const router = useRouter();
  const { signUp, errors, fetchStatus } = useSignUp();

  const [step, setStep] = useState<Step>("form");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dni, setDni] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isFetching = fetchStatus === "fetching";
  const fieldErrors = errors.fields;

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!/^\d{7,9}$/.test(dni)) {
      setError("Ingresá un DNI válido (solo números, 7 a 9 dígitos).");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const { error: createError } = await signUp.password({
      emailAddress,
      password,
      firstName,
      lastName,
      unsafeMetadata: { dni },
    });

    if (createError) {
      setError(createError.longMessage ?? createError.message);
      return;
    }

    const { error: sendError } = await signUp.verifications.sendEmailCode();

    if (sendError) {
      setError(sendError.longMessage ?? sendError.message);
      return;
    }

    setStep("verify");
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const { error: verifyError } = await signUp.verifications.verifyEmailCode({
      code,
    });

    if (verifyError) {
      setError(verifyError.longMessage ?? verifyError.message);
      return;
    }

    if (signUp.status !== "complete") {
      setError("No se pudo completar el registro. Volvé a intentar.");
      return;
    }

    await signUp.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          return;
        }

        const url = decorateUrl("/");

        if (url.startsWith("http")) {
          window.location.href = url;
        } else {
          router.push(url);
        }
      },
    });
  }

  async function handleResend() {
    setError(null);

    const { error: sendError } = await signUp.verifications.sendEmailCode();

    if (sendError) {
      setError(sendError.longMessage ?? sendError.message);
    }
  }

  if (signUp.status === "complete") {
    return null;
  }

  if (step === "verify") {
    return (
      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        <p className="text-sm text-zinc-600">
          Te enviamos un código de verificación a{" "}
          <strong>{signUp.emailAddress ?? emailAddress}</strong>.
        </p>

        <label className={labelClass}>
          Código de verificación
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            className={inputClass}
          />
          {fieldErrors.code ? (
            <span className={errorClass}>{fieldErrors.code.message}</span>
          ) : null}
        </label>

        {error ? <p className={errorClass}>{error}</p> : null}

        <button type="submit" disabled={isFetching} className={primaryButtonClass}>
          {isFetching ? "Verificando…" : "Verificar"}
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={isFetching}
          className={secondaryButtonClass}
        >
          Reenviar código
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleCreate} className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <label className={labelClass}>
          Nombre
          <input
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            autoComplete="given-name"
            required
            className={inputClass}
          />
          {fieldErrors.firstName ? (
            <span className={errorClass}>{fieldErrors.firstName.message}</span>
          ) : null}
        </label>

        <label className={labelClass}>
          Apellido
          <input
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            autoComplete="family-name"
            required
            className={inputClass}
          />
          {fieldErrors.lastName ? (
            <span className={errorClass}>{fieldErrors.lastName.message}</span>
          ) : null}
        </label>
      </div>

      <label className={labelClass}>
        DNI
        <input
          value={dni}
          onChange={(event) => setDni(event.target.value)}
          inputMode="numeric"
          autoComplete="off"
          required
          className={inputClass}
        />
      </label>

      <label className={labelClass}>
        Correo electrónico
        <input
          type="email"
          value={emailAddress}
          onChange={(event) => setEmailAddress(event.target.value)}
          autoComplete="email"
          required
          className={inputClass}
        />
        {fieldErrors.emailAddress ? (
          <span className={errorClass}>{fieldErrors.emailAddress.message}</span>
        ) : null}
      </label>

      <label className={labelClass}>
        Contraseña
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
          className={inputClass}
        />
        {fieldErrors.password ? (
          <span className={errorClass}>{fieldErrors.password.message}</span>
        ) : null}
      </label>

      <label className={labelClass}>
        Confirmar contraseña
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          required
          className={inputClass}
        />
      </label>

      {error ? <p className={errorClass}>{error}</p> : null}

      <button type="submit" disabled={isFetching} className={primaryButtonClass}>
        {isFetching ? "Creando cuenta…" : "Crear cuenta"}
      </button>

      <div id="clerk-captcha" />
    </form>
  );
}
