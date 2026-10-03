import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [userProfiles, doctors, patients, schedules, appointments, vaccines, lots, movements, records] =
      await Promise.all([
        prisma.userProfile.count(),
        prisma.doctor.count(),
        prisma.patient.count(),
        prisma.doctorSchedule.count(),
        prisma.appointment.count(),
        prisma.vaccine.count(),
        prisma.vaccineLot.count(),
        prisma.stockMovement.count(),
        prisma.clinicalRecord.count(),
      ]);

    return NextResponse.json({
      status: "ok",
      database: "connected",
      counts: {
        user_profile: userProfiles,
        doctor: doctors,
        patient: patients,
        doctor_schedule: schedules,
        appointment: appointments,
        vaccine: vaccines,
        vaccine_lot: lots,
        stock_movement: movements,
        clinical_record: records,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[health] fallo al consultar la base:", error);

    return NextResponse.json(
      {
        status: "error",
        database: "unreachable",
        message: "No se pudo consultar la base de datos. Revisar DATABASE_URL.",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}