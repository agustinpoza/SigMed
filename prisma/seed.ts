import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import {
  AppointmentStatus,
  AppointmentType,
  MovementType,
  Role,
} from "../src/generated/prisma/enums";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

const TABLES = [
  "clinical_record",
  "stock_movement",
  "appointment",
  "vaccine_lot",
  "vaccine",
  "doctor_schedule",
  "doctor",
  "patient",
  "user_profile",
];

function timeOnly(value: string) {
  return new Date(`1970-01-01T${value}Z`);
}

function dayAt(offsetDays: number, hour: number, minute = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  date.setUTCHours(hour, minute, 0, 0);
  return date;
}

function dateOnly(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function main() {
  console.log("Limpiando datos previos...");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${TABLES.join(", ")} CASCADE`);

  console.log("Creando user_profile...");

  const admin = await prisma.userProfile.create({
    data: {
      email: "admin@sigmed.dev",
      dni: "30111222",
      firstName: "Ana",
      lastName: "Rios",
      role: Role.ADMINISTRADOR,
    },
  });

  const nurse = await prisma.userProfile.create({
    data: {
      email: "enfermera@sigmed.dev",
      dni: "30222333",
      firstName: "Lucia",
      lastName: "Ferreyra",
      role: Role.ENFERMERA,
    },
  });

  const doctorProfileA = await prisma.userProfile.create({
    data: {
      email: "medico1@sigmed.dev",
      dni: "30333444",
      firstName: "Martin",
      lastName: "Gomez",
      role: Role.MEDICO,
    },
  });

  const doctorProfileB = await prisma.userProfile.create({
    data: {
      email: "medico2@sigmed.dev",
      dni: "30444555",
      firstName: "Sofia",
      lastName: "Duarte",
      role: Role.MEDICO,
    },
  });

  const patientProfileA = await prisma.userProfile.create({
    data: {
      email: "paciente1@sigmed.dev",
      dni: "30555666",
      firstName: "Juan",
      lastName: "Perez",
      birthDate: dateOnly(new Date("1985-04-12T00:00:00Z")),
      role: Role.PACIENTE,
    },
  });

  const patientProfileB = await prisma.userProfile.create({
    data: {
      email: "paciente2@sigmed.dev",
      dni: "30666777",
      firstName: "Marta",
      lastName: "Lopez",
      birthDate: dateOnly(new Date("1992-11-30T00:00:00Z")),
      role: Role.PACIENTE,
    },
  });

  const patientProfileC = await prisma.userProfile.create({
    data: {
      email: "paciente3@sigmed.dev",
      dni: "30777888",
      firstName: "Diego",
      lastName: "Sosa",
      birthDate: dateOnly(new Date("1978-01-22T00:00:00Z")),
      role: Role.PACIENTE,
    },
  });

  console.log("Creando doctor y patient...");

  const doctorA = await prisma.doctor.create({
    data: { profileId: doctorProfileA.id, licenseNumber: "MP-1001" },
  });

  const doctorB = await prisma.doctor.create({
    data: { profileId: doctorProfileB.id, licenseNumber: "MP-1002" },
  });

  const patientA = await prisma.patient.create({ data: { profileId: patientProfileA.id } });
  const patientB = await prisma.patient.create({ data: { profileId: patientProfileB.id } });
  const patientC = await prisma.patient.create({ data: { profileId: patientProfileC.id } });

  console.log("Creando doctor_schedule...");

  const today = dateOnly(new Date());
  const isoWeekday = today.getUTCDay() === 0 ? 7 : today.getUTCDay();

  const scheduleA = await prisma.doctorSchedule.create({
    data: {
      doctorId: doctorA.id,
      weekday: isoWeekday,
      startTime: timeOnly("08:00:00"),
      endTime: timeOnly("12:00:00"),
      slotDurationMin: 30,
      validFrom: today,
    },
  });

  await prisma.doctorSchedule.create({
    data: {
      doctorId: doctorA.id,
      weekday: 1,
      startTime: timeOnly("14:00:00"),
      endTime: timeOnly("18:00:00"),
      slotDurationMin: 30,
      validFrom: today,
    },
  });

  await prisma.doctorSchedule.create({
    data: {
      doctorId: doctorB.id,
      weekday: 1,
      startTime: timeOnly("09:00:00"),
      endTime: timeOnly("13:00:00"),
      slotDurationMin: 20,
      validFrom: today,
    },
  });

  console.log("Creando vaccine y vaccine_lot...");

  const vaccineFiebre = await prisma.vaccine.create({
    data: {
      name: "Vacuna anti-fiebre",
      biologicalName: "Vacuna antitermica",
      laboratory: "LabSan",
      criticalStockLevel: 10,
    },
  });

  const vaccineGripe = await prisma.vaccine.create({
    data: {
      name: "Vacuna antigripal",
      biologicalName: "Vacuna inactivated",
      laboratory: "InstMed",
      criticalStockLevel: 15,
    },
  });

  const vaccineDoble = await prisma.vaccine.create({
    data: {
      name: "Doble viral",
      biologicalName: "Sarampione-Rubione",
      laboratory: "LabSan",
      criticalStockLevel: 8,
    },
  });

const lotFiebreA = await prisma.vaccineLot.create({
    data: {
      vaccineId: vaccineFiebre.id,
      lotNumber: "LT-FIEB-2401",
      expiresAt: dateOnly(new Date("2027-06-30T00:00:00Z")),
      quantityAvailable: 48,
    },
  });

  const lotFiebreB = await prisma.vaccineLot.create({
    data: {
      vaccineId: vaccineFiebre.id,
      lotNumber: "LT-FIEB-2402",
      expiresAt: dateOnly(new Date("2026-12-31T00:00:00Z")),
      quantityAvailable: 10,
    },
  });

  const lotGripeA = await prisma.vaccineLot.create({
    data: {
      vaccineId: vaccineGripe.id,
      lotNumber: "LT-GRIP-1105",
      expiresAt: dateOnly(new Date("2027-05-31T00:00:00Z")),
      quantityAvailable: 6,
    },
  });

  const lotDobleA = await prisma.vaccineLot.create({
    data: {
      vaccineId: vaccineDoble.id,
      lotNumber: "LT-DOBL-0731",
      expiresAt: dateOnly(new Date("2027-09-30T00:00:00Z")),
      quantityAvailable: 25,
    },
  });

  console.log("Creando appointment...");

  const consultations: {
    patientId: string | null;
    doctorId: string;
    scheduleId: string | null;
    status: AppointmentStatus;
    dayOffset: number;
    hour: number;
    minute: number;
    durationMin: number;
  }[] = [
    { patientId: patientA.id, doctorId: doctorA.id, scheduleId: scheduleA.id, status: AppointmentStatus.ATENDIDO, dayOffset: -7, hour: 8, minute: 0, durationMin: 30 },
    { patientId: patientB.id, doctorId: doctorA.id, scheduleId: scheduleA.id, status: AppointmentStatus.ATENDIDO, dayOffset: -7, hour: 8, minute: 30, durationMin: 30 },
    { patientId: patientC.id, doctorId: doctorA.id, scheduleId: scheduleA.id, status: AppointmentStatus.AUSENTE, dayOffset: -7, hour: 9, minute: 0, durationMin: 30 },
    { patientId: patientA.id, doctorId: doctorA.id, scheduleId: scheduleA.id, status: AppointmentStatus.CONFIRMADO, dayOffset: -1, hour: 10, minute: 0, durationMin: 30 },
    { patientId: patientB.id, doctorId: doctorA.id, scheduleId: scheduleA.id, status: AppointmentStatus.CANCELADO, dayOffset: -1, hour: 10, minute: 30, durationMin: 30 },
    { patientId: null, doctorId: doctorA.id, scheduleId: scheduleA.id, status: AppointmentStatus.DISPONIBLE, dayOffset: 1, hour: 8, minute: 0, durationMin: 30 },
    { patientId: null, doctorId: doctorA.id, scheduleId: scheduleA.id, status: AppointmentStatus.DISPONIBLE, dayOffset: 1, hour: 8, minute: 30, durationMin: 30 },
    { patientId: patientC.id, doctorId: doctorB.id, scheduleId: null, status: AppointmentStatus.RESERVADO, dayOffset: 2, hour: 9, minute: 0, durationMin: 20 },
  ];

  for (const item of consultations) {
    const startAt = dayAt(item.dayOffset, item.hour, item.minute);

    await prisma.appointment.create({
      data: {
        patientId: item.patientId,
        doctorId: item.doctorId,
        scheduleId: item.scheduleId,
        status: item.status,
        startAt,
        endAt: new Date(startAt.getTime() + item.durationMin * 60_000),
        type: AppointmentType.CONSULTA,
        cancellationReason:
          item.status === AppointmentStatus.CANCELADO ? "Motivo del paciente" : null,
      },
    });
  }

  const vaccinations: {
    patientId: string;
    vaccineId: string;
    lotId: string;
    status: AppointmentStatus;
    dayOffset: number;
    hour: number;
    minute: number;
  }[] = [
    { patientId: patientA.id, vaccineId: vaccineFiebre.id, lotId: lotFiebreA.id, status: AppointmentStatus.CONFIRMADO, dayOffset: 1, hour: 11, minute: 0 },
    { patientId: patientB.id, vaccineId: vaccineDoble.id, lotId: lotDobleA.id, status: AppointmentStatus.RESERVADO, dayOffset: 1, hour: 11, minute: 20 },
    { patientId: patientC.id, vaccineId: vaccineGripe.id, lotId: lotGripeA.id, status: AppointmentStatus.RESERVADO, dayOffset: 2, hour: 11, minute: 40 },
  ];

  for (const item of vaccinations) {
    const startAt = dayAt(item.dayOffset, item.hour, item.minute);

    await prisma.appointment.create({
      data: {
        patientId: item.patientId,
        doctorId: null,
        vaccineId: item.vaccineId,
        vaccineLotId: item.lotId,
        status: item.status,
        startAt,
        endAt: new Date(startAt.getTime() + 20 * 60_000),
        type: AppointmentType.VACUNACION,
      },
    });
  }

  console.log("Creando stock_movement...");

  const movements: {
    vaccineLotId: string;
    vaccineId: string;
    movementType: MovementType;
    quantity: number;
    reason: string;
    actorId: string;
  }[] = [
    { vaccineLotId: lotFiebreA.id, vaccineId: vaccineFiebre.id, movementType: MovementType.INGRESO, quantity: 50, reason: "Ingreso de lote al deposito", actorId: nurse.id },
    { vaccineLotId: lotFiebreA.id, vaccineId: vaccineFiebre.id, movementType: MovementType.EGRESO, quantity: 2, reason: "Aplicacion de dosis", actorId: nurse.id },
    { vaccineLotId: lotFiebreB.id, vaccineId: vaccineFiebre.id, movementType: MovementType.INGRESO, quantity: 12, reason: "Ingreso de lote al deposito", actorId: nurse.id },
    { vaccineLotId: lotFiebreB.id, vaccineId: vaccineFiebre.id, movementType: MovementType.AJUSTE, quantity: 2, reason: "Ajuste por control de cadena de frio", actorId: admin.id },
    { vaccineLotId: lotGripeA.id, vaccineId: vaccineGripe.id, movementType: MovementType.INGRESO, quantity: 10, reason: "Ingreso de lote al deposito", actorId: nurse.id },
    { vaccineLotId: lotGripeA.id, vaccineId: vaccineGripe.id, movementType: MovementType.EGRESO, quantity: 4, reason: "Aplicacion de dosis", actorId: nurse.id },
    { vaccineLotId: lotDobleA.id, vaccineId: vaccineDoble.id, movementType: MovementType.INGRESO, quantity: 25, reason: "Ingreso de lote al deposito", actorId: nurse.id },
  ];

  for (const movement of movements) {
    await prisma.stockMovement.create({ data: movement });
  }

  console.log("Creando clinical_record...");

  const records = [
    {
      diagnosis: "Gripe estacional",
      treatment: "Paracetamol 500mg cada 8hs durante 3 dias",
      indications: "Reposo hidrico. Consultar si persiste la fiebre.",
    },
    {
      diagnosis: "Viral comun",
      treatment: "Tratamiento sintomatologico",
      indications: "Control en 15 dias",
    },
  ];

  const attended = await prisma.appointment.findMany({
    where: { status: AppointmentStatus.ATENDIDO },
    orderBy: { startAt: "asc" },
  });

  for (const [index, appointment] of attended.entries()) {
    const content = records[index];
    if (!content || !appointment.patientId || !appointment.doctorId) continue;

    await prisma.clinicalRecord.create({
      data: {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentId: appointment.id,
        diagnosis: content.diagnosis,
        treatment: content.treatment,
        indications: content.indications,
        recordedAt: appointment.startAt,
      },
    });
  }

  console.log("\nSeed completado.");
  console.log(`  user_profile:    ${await prisma.userProfile.count()}`);
  console.log(`  doctor:          ${await prisma.doctor.count()}`);
  console.log(`  patient:         ${await prisma.patient.count()}`);
  console.log(`  doctor_schedule: ${await prisma.doctorSchedule.count()}`);
  console.log(`  appointment:     ${await prisma.appointment.count()}`);
  console.log(`  vaccine:         ${await prisma.vaccine.count()}`);
  console.log(`  vaccine_lot:     ${await prisma.vaccineLot.count()}`);
  console.log(`  stock_movement:  ${await prisma.stockMovement.count()}`);
  console.log(`  clinical_record: ${await prisma.clinicalRecord.count()}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });