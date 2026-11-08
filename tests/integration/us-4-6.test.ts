// US 4.6: listado y descarga de facturas del paciente (RF-16).
// Prisma, migraciones y control de acceso son reales sobre una base aislada.
import { randomUUID } from "node:crypto";
import { promises as fs } from "fs";
import { join } from "path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import type { UserProfile } from "@/generated/prisma/client";
import { InvoiceStatus, UserRole } from "@/generated/prisma/enums";
import { GET as listInvoices } from "@/app/api/patient/invoices/route";
import { GET as downloadInvoice } from "@/app/api/patient/invoices/[id]/download/route";

const boundary = vi.hoisted(() => ({
  actor: null as UserProfile | null,
}));

vi.mock("@/lib/actor", () => ({ getCurrentActor: async () => boundary.actor }));

let patientA: UserProfile;
let patientB: UserProfile;
let invoiceA: { id: string };
let invoiceB: { id: string };
const fileA = `test-us46-a-${randomUUID()}.pdf`;
const fileB = `test-us46-b-${randomUUID()}.pdf`;

beforeAll(async () => {
  async function profile(role: UserRole, firstName: string, dni: string) {
    return prisma.userProfile.create({
      data: {
        firstName,
        lastName: "Factura",
        dni,
        role,
        email: `${dni}-${randomUUID()}@example.invalid`,
        clerkUserId: `fixture-${dni}-${randomUUID()}`,
      },
    });
  }

  patientA = await profile(UserRole.PACIENTE, "Alicia", "94000001");
  patientB = await profile(UserRole.PACIENTE, "Bruno", "94000002");
  await prisma.patient.createMany({ data: [{ id: patientA.id }, { id: patientB.id }] });

  invoiceA = await prisma.invoice.create({
    data: {
      patientId: patientA.id,
      date: new Date("2026-11-01T12:00:00Z"),
      type: "Factura B",
      number: `US46-A-${randomUUID().slice(0, 8)}`,
      amount: 15000,
      status: InvoiceStatus.PAGADA,
      filePath: fileA,
    },
    select: { id: true },
  });
  invoiceB = await prisma.invoice.create({
    data: {
      patientId: patientB.id,
      date: new Date("2026-11-02T12:00:00Z"),
      type: "Factura B",
      number: `US46-B-${randomUUID().slice(0, 8)}`,
      amount: 9000,
      status: InvoiceStatus.PENDIENTE,
      filePath: fileB,
    },
    select: { id: true },
  });

  const dir = join(process.cwd(), "public", "invoices");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(join(dir, fileA), "%PDF-1.4 test A");
  await fs.writeFile(join(dir, fileB), "%PDF-1.4 test B");
});

afterAll(async () => {
  await fs.rm(join(process.cwd(), "public", "invoices", fileA), { force: true });
  await fs.rm(join(process.cwd(), "public", "invoices", fileB), { force: true });
});

beforeEach(() => {
  boundary.actor = patientA;
});

describe("US 4.6: APIs de facturas", () => {
  it("lista solo las facturas del paciente autenticado", async () => {
    const res = await listInvoices(new Request("http://local/api/patient/invoices"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Array<{ id: string; patientId: string }> };
    expect(body.data.map((i) => i.id)).toContain(invoiceA.id);
    expect(body.data.some((i) => i.id === invoiceB.id)).toBe(false);
  });

  it("descarga la factura propia con Content-Disposition attachment", async () => {
    const res = await downloadInvoice(new Request("http://local"), {
      params: Promise.resolve({ id: invoiceA.id }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toContain("attachment");
    expect(await res.text()).toContain("%PDF");
  });

  it("niega acceso a facturas de otro paciente", async () => {
    const res = await downloadInvoice(new Request("http://local"), {
      params: Promise.resolve({ id: invoiceB.id }),
    });
    expect(res.status).toBe(404);
  });

  it("requiere sesión de paciente", async () => {
    boundary.actor = null;
    const res = await listInvoices(new Request("http://local/api/patient/invoices"));
    expect(res.status).toBe(401);
  });
});
