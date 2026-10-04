import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

async function expectError(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    console.log(`FALLA  ${label}: la operacion deberia haber sido rechazada y NO lo fue`);
  } catch (error) {
    const message = error instanceof Error ? error.message.split("\n").filter(Boolean).at(-1) : String(error);
    console.log(`OK     ${label}: ${message?.slice(0, 110)}`);
  }
}

const lot = await prisma.vaccineLot.findFirstOrThrow();
const movement = await prisma.stockMovement.findFirstOrThrow();
const schedule = await prisma.doctorSchedule.findFirstOrThrow();
const patient = await prisma.patient.findFirstOrThrow();

console.log("--- CHECK de stock no negativo (tarea 3.2.3) ---");
await expectError("quantityAvailable = -1", () =>
  prisma.vaccineLot.update({ where: { id: lot.id }, data: { quantityAvailable: -1 } }),
);

console.log("--- CHECK coherencia tipo/medico/vacuna ---");
await expectError("CONSULTA sin doctor", () =>
  prisma.appointment.create({
    data: {
      patientId: patient.id,
      type: "CONSULTA",
      status: "RESERVADO",
      startAt: new Date("2027-03-01T14:00:00Z"),
      endAt: new Date("2027-03-01T14:30:00Z"),
    },
  }),
);

console.log("--- Inmutabilidad de stock_movement (RF-11 CA2) ---");
await expectError("UPDATE de un movimiento", () =>
  prisma.stockMovement.update({ where: { id: movement.id }, data: { quantity: 99 } }),
);
await expectError("DELETE de un movimiento", () =>
  prisma.stockMovement.delete({ where: { id: movement.id } }),
);

console.log("--- CHECK slot_duration_min positivo ---");
await expectError("slotDurationMin = 0", () =>
  prisma.doctorSchedule.create({
    data: {
      doctorId: schedule.doctorId,
      weekday: schedule.weekday,
      startTime: new Date("1970-01-01T08:00:00Z"),
      endTime: new Date("1970-01-01T12:00:00Z"),
      slotDurationMin: 0,
      validFrom: new Date(),
    },
  }),
);

console.log("--- Exclusion: paciente con turnos superpuestos ---");
const overlapping = await prisma.appointment.findFirstOrThrow({
  where: { patientId: patient.id, status: { notIn: ["CANCELADO", "BLOQUEADO"] } },
});
await expectError("turno que se pisa con uno existente", () =>
  prisma.appointment.create({
    data: {
      patientId: patient.id,
      type: "CONSULTA",
      status: "RESERVADO",
      doctorId: schedule.doctorId,
      startAt: new Date(overlapping.startAt.getTime() + 5 * 60 * 1000),
      endAt: new Date(overlapping.endAt.getTime() + 5 * 60 * 1000),
    },
  }),
);

console.log("--- Estado final (debe coincidir con el seed) ---");
console.log(
  JSON.stringify(
    {
      user_profile: await prisma.userProfile.count(),
      doctor: await prisma.doctor.count(),
      patient: await prisma.patient.count(),
      doctor_schedule: await prisma.doctorSchedule.count(),
      appointment: await prisma.appointment.count(),
      vaccine: await prisma.vaccine.count(),
      vaccine_lot: await prisma.vaccineLot.count(),
      stock_movement: await prisma.stockMovement.count(),
      clinical_record: await prisma.clinicalRecord.count(),
    },
    null,
    2,
  ),
);

await prisma.$disconnect();
