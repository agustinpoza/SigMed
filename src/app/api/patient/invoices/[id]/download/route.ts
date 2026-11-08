import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { basename, join } from "path";
import { getCurrentActor } from "@/lib/actor";
import { getInvoiceFile } from "@/services/invoiceService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getCurrentActor();
  if (!actor || actor.role !== "PACIENTE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: invoiceId } = await params;
  const filePath = await getInvoiceFile(actor.id, invoiceId);
  if (!filePath) {
    return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });
  }

  const safeName = basename(filePath);
  if (!safeName || safeName !== filePath) {
    return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });
  }

  const absolutePath = join(process.cwd(), "public", "invoices", safeName);
  try {
    const file = await fs.readFile(absolutePath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}"`,
      },
    });
  } catch (e) {
    console.error("[download invoice] error", e);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
