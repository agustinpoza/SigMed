import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  count: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    invoice: {
      count: mocks.count,
      findMany: mocks.findMany,
      findUnique: mocks.findUnique,
    },
  },
}));

import { getInvoiceFile, listInvoices } from "./invoiceService";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("US 4.6: invoiceService", () => {
  it("listInvoices filtra por paciente y pagina", async () => {
    mocks.count.mockResolvedValue(1);
    mocks.findMany.mockResolvedValue([{ id: "inv-1", patientId: "p1" }]);

    const result = await listInvoices("p1", { page: 2, size: 5 });

    expect(mocks.count).toHaveBeenCalledWith({ where: { patientId: "p1" } });
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { patientId: "p1" },
        orderBy: { date: "desc" },
        skip: 5,
        take: 5,
      }),
    );
    expect(result).toMatchObject({ total: 1, page: 2, size: 5 });
  });

  it("getInvoiceFile devuelve ruta solo si la factura pertenece al paciente", async () => {
    mocks.findUnique.mockResolvedValue({ patientId: "p1", filePath: "a.pdf" });
    await expect(getInvoiceFile("p1", "inv-1")).resolves.toBe("a.pdf");

    mocks.findUnique.mockResolvedValue({ patientId: "p2", filePath: "b.pdf" });
    await expect(getInvoiceFile("p1", "inv-1")).resolves.toBeNull();

    mocks.findUnique.mockResolvedValue(null);
    await expect(getInvoiceFile("p1", "missing")).resolves.toBeNull();
  });
});
