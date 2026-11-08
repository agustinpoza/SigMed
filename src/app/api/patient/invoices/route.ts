import { NextResponse } from "next/server";
import { getCurrentActor } from "@/lib/actor";
import { listInvoices } from "@/services/invoiceService";

export async function GET(request: Request) {
  const actor = await getCurrentActor();
  if (!actor || actor.role !== "PACIENTE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const size = parseInt(url.searchParams.get("size") ?? "10", 10);
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;

  const result = await listInvoices(actor.id, { page, size, from, to });
  return NextResponse.json(result);
}
