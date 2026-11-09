import { NextRequest, NextResponse } from "next/server";
import { AgendaRuleError, procesarRecordatoriosTurnos } from "@/lib/agenda";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { status: "error", message: "No autorizado para ejecutar el job de recordatorios." },
          { status: 401 },
        );
      }
    }

    const hoursParam = request.nextUrl.searchParams.get("horas");
    const ventanaHoras = hoursParam ? Number.parseInt(hoursParam, 10) : 24;

    if (!Number.isInteger(ventanaHoras) || ventanaHoras <= 0) {
      return NextResponse.json(
        { status: "error", message: "El parámetro 'horas' debe ser un entero positivo." },
        { status: 400 },
      );
    }

    const resultado = await procesarRecordatoriosTurnos(ventanaHoras);

    return NextResponse.json({
      status: "ok",
      ventanaHoras,
      ...resultado,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AgendaRuleError) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 400 },
      );
    }

    console.error("[cron:recordatorios] Error al procesar recordatorios:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Error interno al ejecutar el job de recordatorios.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

