import { NextResponse } from "next/server";
import { getActorContext } from "@/lib/actor";
import { UserRole } from "@/generated/prisma/enums";
import {
  getCriticalLevel,
  setCriticalLevel,
  VaccineServiceError,
} from "@/services/vaccineService";

function canManage(actor: { role: UserRole } | null) {
  return actor?.role === UserRole.ENFERMERA || actor?.role === UserRole.ADMINISTRADOR;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getActorContext();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManage(context.effective)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const criticalLevel = await getCriticalLevel(id);
    return NextResponse.json({ criticalLevel });
  } catch (e) {
    if (e instanceof VaccineServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getActorContext();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManage(context.effective)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const input =
    body && typeof body === "object" && "criticalLevel" in body
      ? (body as { criticalLevel: unknown }).criticalLevel
      : undefined;

  try {
    const { id } = await params;
    const criticalLevel = await setCriticalLevel(id, input, {
      actor: context.effective,
      context,
    });
    return NextResponse.json({ criticalLevel });
  } catch (e) {
    if (e instanceof VaccineServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
