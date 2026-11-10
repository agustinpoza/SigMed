import { NextRequest, NextResponse } from "next/server";
import { requireAdministrador } from "@/lib/actor-guard";
import { resolveReportPeriod } from "@/lib/report-period";
import {
  reporteTurnosPorEspecialidad,
  reporteTurnosPorEspecialidadCsv,
} from "@/lib/reports";

export const dynamic = "force-dynamic";

// Los route handlers no pasan por el layout de /admin: el rol se valida acá.
export async function GET(request: NextRequest) {
  const guard = await requireAdministrador();
  if ("error" in guard) {
    return NextResponse.json(
      { status: "error", message: "Solo los administradores pueden exportar reportes." },
      { status: 403 },
    );
  }

  const resolved = resolveReportPeriod(
    request.nextUrl.searchParams.get("desde"),
    request.nextUrl.searchParams.get("hasta"),
  );
  if (!resolved.ok) {
    return NextResponse.json({ status: "error", message: resolved.error }, { status: 400 });
  }

  const { period } = resolved;
  const report = await reporteTurnosPorEspecialidad(period);
  const filename = `reporte-turnos-especialidad_${period.desde}_${period.hasta}.csv`;

  // El BOM hace que Excel interprete el archivo como UTF-8 (tildes).
  return new NextResponse(`﻿${reporteTurnosPorEspecialidadCsv(report)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
