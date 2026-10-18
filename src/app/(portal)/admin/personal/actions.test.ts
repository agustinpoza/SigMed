import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearPersonal } from "./actions";

const mocks = vi.hoisted(() => ({
  guard: vi.fn(),
  findFirst: vi.fn(),
  createProfile: vi.fn(),
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  revalidate: vi.fn(),
}));

class FakeClerkError extends Error {
  constructor(readonly errors: { code: string; message: string; longMessage?: string; meta?: { paramName?: string } }[]) {
    super("clerk");
  }
}

vi.mock("@/lib/db", () => ({
  prisma: { userProfile: { findFirst: mocks.findFirst, create: mocks.createProfile } },
  isUniqueViolation: (error: unknown) => (error as { code?: string })?.code === "P2002",
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/actor-guard", () => ({ requireAdministrador: mocks.guard }));
vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: async () => ({ users: { createUser: mocks.createUser, deleteUser: mocks.deleteUser } }),
}));
vi.mock("@clerk/nextjs/errors", () => ({
  isClerkAPIResponseError: (error: unknown) => error instanceof FakeClerkError,
}));

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    firstName: "Laura",
    lastName: "Méndez",
    dni: "31222333",
    email: "Laura.Mendez@Sigmed.dev",
    password: "clave-segura-123",
    role: "ENFERMERA",
    ...overrides,
  })) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.guard.mockResolvedValue({ actor: { id: "admin-1" } });
  mocks.findFirst.mockResolvedValue(null);
  mocks.createUser.mockResolvedValue({ id: "user_clerk_1" });
  mocks.createProfile.mockResolvedValue({});
  mocks.deleteUser.mockResolvedValue({});
});

describe("US-7.3: alta de personal", () => {
  it("CA1: crea la cuenta en Clerk y el usuario en la base con el rol elegido", async () => {
    const result = await crearPersonal({}, form());

    expect(result).toEqual({
      success: true,
      message: "Se creó la cuenta de Laura Méndez con rol Enfermera.",
    });
    expect(mocks.createUser).toHaveBeenCalledExactlyOnceWith({
      emailAddress: ["laura.mendez@sigmed.dev"],
      password: "clave-segura-123",
      firstName: "Laura",
      lastName: "Méndez",
      publicMetadata: { role: "ENFERMERA" },
      unsafeMetadata: { dni: "31222333" },
    });
    expect(mocks.createProfile).toHaveBeenCalledExactlyOnceWith({
      data: {
        firstName: "Laura",
        lastName: "Méndez",
        dni: "31222333",
        email: "laura.mendez@sigmed.dev",
        role: "ENFERMERA",
        clerkUserId: "user_clerk_1",
      },
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/admin/personal");
  });

  it("CA1: también da de alta médicos", async () => {
    await crearPersonal({}, form({ role: "MEDICO" }));
    expect(mocks.createProfile).toHaveBeenCalledWith({ data: expect.objectContaining({ role: "MEDICO" }) });
  });

  it.each(["PACIENTE", "ADMINISTRADOR", "", "OTRO"])("no permite el rol %s", async (role) => {
    const result = await crearPersonal({}, form({ role }));
    expect(result.errors?.role).toBe("Seleccioná un rol: Médico o Enfermera.");
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("CA2: un usuario no administrador no puede efectuar el alta", async () => {
    mocks.guard.mockResolvedValue({ error: "Solo los administradores pueden dar de alta personal." });
    const result = await crearPersonal({}, form());
    expect(result.message).toBe("Solo los administradores pueden dar de alta personal.");
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.createProfile).not.toHaveBeenCalled();
  });

  it.each([
    ["firstName", { firstName: "  " }],
    ["lastName", { lastName: "" }],
    ["dni", { dni: "12.345.678" }],
    ["dni", { dni: "123" }],
    ["email", { email: "no-es-un-correo" }],
    ["password", { password: "" }],
    ["password", { password: "corta" }],
  ])("valida %s antes de tocar Clerk o la base", async (field, overrides: Record<string, string>) => {
    const result = await crearPersonal({}, form(overrides));
    expect(result.errors?.[field]).toBeTruthy();
    expect(mocks.guard).not.toHaveBeenCalled();
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("nunca devuelve la contraseña al formulario", async () => {
    const result = await crearPersonal({}, form({ dni: "x" }));
    expect(result.values).not.toHaveProperty("password");
  });

  it.each([
    [{ dni: "31222333", email: "otro@sigmed.dev" }, "dni", "Ya existe un usuario con ese DNI."],
    [{ dni: "99999999", email: "laura.mendez@sigmed.dev" }, "email", "Ya existe una cuenta con ese correo electrónico."],
  ])("rechaza DNI o correo ya registrados en la base", async (existing, field, message) => {
    mocks.findFirst.mockResolvedValue(existing);
    const result = await crearPersonal({}, form());
    expect(result.errors).toEqual({ [field]: message });
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("traduce un correo ya usado en Clerk a error de campo", async () => {
    mocks.createUser.mockRejectedValue(new FakeClerkError([{ code: "form_identifier_exists", message: "taken" }]));
    const result = await crearPersonal({}, form());
    expect(result.errors).toEqual({ email: "Ya existe una cuenta con ese correo electrónico." });
    expect(mocks.createProfile).not.toHaveBeenCalled();
  });

  it("traduce una contraseña filtrada a error de campo", async () => {
    mocks.createUser.mockRejectedValue(new FakeClerkError([{ code: "form_password_pwned", message: "pwned" }]));
    const result = await crearPersonal({}, form());
    expect(result.errors?.password).toMatch(/filtraciones/);
  });

  it("si falla la base deshace la cuenta de Clerk", async () => {
    mocks.createProfile.mockRejectedValue({ code: "P2002" });
    const result = await crearPersonal({}, form());
    expect(mocks.deleteUser).toHaveBeenCalledExactlyOnceWith("user_clerk_1");
    expect(result.message).toBe("Ya existe un usuario con ese DNI o correo electrónico.");
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
