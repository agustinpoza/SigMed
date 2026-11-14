import { prisma } from "@/lib/db";
import type { Invoice, Prisma } from "@/generated/prisma/client";

export type InvoiceFilter = {
  page?: number;
  size?: number;
  from?: string; // ISO date string
  to?: string;   // ISO date string
};

/**
 * List invoices belonging to a patient.
 * Returns paginated results with total count.
 */
export async function listInvoices(
  patientId: string,
  filter: InvoiceFilter = {}
): Promise<{ data: Invoice[]; total: number; page: number; size: number }> {
  const page = filter.page && filter.page > 0 ? filter.page : 1;
  const size = filter.size && filter.size > 0 ? filter.size : 10;

  const where: Prisma.InvoiceWhereInput = {
    patientId,
  };

  if (filter.from) {
    where.date = { gte: new Date(filter.from) } as any;
  }
  if (filter.to) {
    where.date = { ...(where.date as any), lte: new Date(filter.to) } as any;
  }

  const [total, data] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * size,
      take: size,
    }),
  ]);

  return { data, total, page, size };
}

/**
 * Get the file path for a specific invoice ensuring the patient owns it.
 */
export async function getInvoiceFile(
  patientId: string,
  invoiceId: string
): Promise<string | null> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { patientId: true, filePath: true },
  });
  if (!invoice) return null;
  if (invoice.patientId !== patientId) return null;
  return invoice.filePath ?? null;
}
