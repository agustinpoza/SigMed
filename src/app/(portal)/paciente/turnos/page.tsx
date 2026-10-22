import { buscarTurnosDisponibles } from "@/lib/turnos";
import { prisma } from "@/lib/db";
import { Specialty } from "@/generated/prisma/client";
import InteractiveBooking from "./interactive-booking";

export default async function BusquedaTurnosPage({
  searchParams,
}: {
  searchParams: Promise<{ specialty?: string; doctorId?: string; date?: string; fecha?: string }>;
}) {
  const params = await searchParams;
  const dateParam = params.date || params.fecha || "2026-10-14";

  // Cargar lista de médicos con horarios para el selector y el calendario interactivo
  const medicos = await prisma.doctor.findMany({
    include: {
      profile: true,
      schedules: true,
    },
    orderBy: { profile: { lastName: "asc" } },
  });

  const turnosDB = await buscarTurnosDisponibles({
    specialty: params.specialty,
    doctorId: params.doctorId,
    date: dateParam,
  });

  const serializedDoctors = medicos.map((m) => ({
    id: m.id,
    specialty: m.specialty as Specialty,
    name: `Dr. ${m.profile.lastName}, ${m.profile.firstName}`,
    schedules: m.schedules.map((s) => ({
      weekday: s.weekday,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
    })),
  }));

  const serializedTurnos = turnosDB.map((t) => ({
    id: t.id,
    doctorId: t.doctorId,
    startsAt: t.startsAt.toISOString(),
    endsAt: t.endsAt.toISOString(),
    status: t.status,
    doctor: {
      specialty: t.doctor.specialty as Specialty,
      profile: {
        firstName: t.doctor.profile.firstName,
        lastName: t.doctor.profile.lastName,
      },
    },
  }));

  return (
    <section>
      <InteractiveBooking
        medicos={serializedDoctors}
        initialSpecialty={params.specialty}
        initialDoctorId={params.doctorId}
        initialDate={dateParam}
        turnosDB={serializedTurnos}
      />
    </section>
  );
}
