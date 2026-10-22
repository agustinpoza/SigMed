import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/actor";
import { AppointmentState } from "@/generated/prisma/client";
import MisTurnosClient, { MyAppointment } from "./mis-turnos-client";

const SPECIALTY_LABELS: Record<string, string> = {
  CLINICO: "Clínica médica",
  PEDIATRA: "Pediatría",
  TRAUMATOLOGO: "Traumatología",
};

export default async function MisTurnosPage() {
  const actor = await getCurrentActor();

  // Leer turnos reservados recientemente en la sesión
  const cookieStore = await cookies();
  const recentCookie = cookieStore.get("sigmed_recent_turnos")?.value;
  let recentTurnos: MyAppointment[] = [];
  try {
    if (recentCookie) recentTurnos = JSON.parse(recentCookie);
  } catch {}

  // Consultar turnos reales del paciente en BD
  const turnosDB = actor
    ? await prisma.appointment.findMany({
        where: {
          patientId: actor.id,
        },
        include: {
          doctor: {
            include: { profile: true },
          },
        },
        orderBy: { startsAt: "asc" },
      })
    : [];

  let listTurnos: MyAppointment[] = turnosDB.map((t) => {
    const d = new Date(t.startsAt);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const time = d.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Argentina/Buenos_Aires",
    });

    return {
      id: t.id,
      doctorName: `${t.doctor.profile.firstName} ${t.doctor.profile.lastName}`,
      doctorLicense: t.doctor.licenseNumber,
      specialty: SPECIALTY_LABELS[t.doctor.specialty] ?? t.doctor.specialty,
      dateTime: `${day}/${month}/${year} - ${time}`,
      status: t.status,
    };
  });

  // Base prototípica de US-2.2
  const baseDemoTurnos: MyAppointment[] = [
    {
      id: "demo-turno-1",
      doctorName: "Sofía Duarte",
      doctorLicense: "MP-54210",
      specialty: "Pediatría",
      dateTime: "14/10/2026 - 13:00",
      status: "RESERVADO",
    },
    {
      id: "demo-turno-2",
      doctorName: "Martín Gómez",
      doctorLicense: "MP-41890",
      specialty: "Clínica médica",
      dateTime: "19/10/2026 - 14:00",
      status: "CONFIRMADO",
    },
    {
      id: "demo-turno-3",
      doctorName: "Sofía Duarte",
      doctorLicense: "MP-54210",
      specialty: "Pediatría",
      dateTime: "28/10/2026 - 17:00",
      status: "RESERVADO",
    },
  ];

  const currentList = listTurnos.length > 0 ? listTurnos : baseDemoTurnos;

  // Los turnos recién reservados se colocan prioritariamente al principio
  const finalTurnos: MyAppointment[] = [
    ...recentTurnos.filter((rt) => !currentList.some((cl) => cl.id === rt.id)),
    ...currentList.map((cl) => {
      const match = recentTurnos.find((rt) => rt.id === cl.id);
      return match ? { ...cl, status: match.status } : cl;
    }),
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Título y Bajada */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Mis turnos</h1>
        <p className="text-sm text-zinc-500">
          Consultá tus turnos reservados y confirmá tu asistencia.
        </p>
      </div>

      {/* Componente cliente con tabla y modales interactivos */}
      <MisTurnosClient initialTurnos={finalTurnos} />
    </div>
  );
}
