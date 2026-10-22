import { prisma } from "@/lib/db";

/**
 * Contextos que el administrador puede elegir para ejercer un rol (US-7.5).
 * El medico y el paciente se eligen de una lista porque sus areas leen por id
 * de ficha y el administrador no tiene una propia.
 */
export type EjercicioTarget = {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  detalle: string;
};

export async function listarMedicos(): Promise<EjercicioTarget[]> {
  const medicos = await prisma.doctor.findMany({
    orderBy: [{ profile: { lastName: "asc" } }, { profile: { firstName: "asc" } }],
    select: {
      id: true,
      specialty: true,
      licenseNumber: true,
      profile: { select: { firstName: true, lastName: true, dni: true } },
    },
  });

  return medicos.map((medico) => ({
    id: medico.id,
    nombre: medico.profile.firstName,
    apellido: medico.profile.lastName,
    dni: medico.profile.dni,
    detalle: `${medico.specialty} · ${medico.licenseNumber}`,
  }));
}

export async function listarPacientes(query: string): Promise<EjercicioTarget[]> {
  const q = query.trim();

  const pacientes = await prisma.patient.findMany({
    where: q
      ? {
          profile: {
            OR: [
              { dni: { startsWith: q } },
              { lastName: { contains: q, mode: "insensitive" } },
              { firstName: { contains: q, mode: "insensitive" } },
            ],
          },
        }
      : undefined,
    orderBy: [{ profile: { lastName: "asc" } }, { profile: { firstName: "asc" } }],
    take: 25,
    select: {
      id: true,
      profile: { select: { firstName: true, lastName: true, dni: true } },
    },
  });

  return pacientes.map((paciente) => ({
    id: paciente.id,
    nombre: paciente.profile.firstName,
    apellido: paciente.profile.lastName,
    dni: paciente.profile.dni,
    detalle: "Paciente",
  }));
}
