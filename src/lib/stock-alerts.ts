import { prisma } from "@/lib/db";

/**
 * Vacuna cuyo stock actual esta en o por debajo de su nivel critico.
 *
 * La regla es la misma que aplica `fn_stock_movimiento_post`: se suman solo
 * los lotes no vencidos (`fecha_vencimiento >= CURRENT_DATE`) y se compara con
 * `<=`. El umbral nulo significa que la vacuna no tiene alerta configurada.
 */
export type LowStockVaccine = {
  vaccineId: string;
  vaccineName: string;
  stock: number;
  criticalLevel: number;
  /**
   * Fecha de generacion de la alerta activa. Puede ser `null` si el umbral se
   * edito despues del ultimo movimiento: el panel refleja el stock real, pero
   * la alerta recien se emite en el proximo movimiento (ver US-3.3).
   */
  alertGeneratedAt: Date | null;
};

type LowStockRow = {
  vaccineId: string;
  vaccineName: string;
  stock: number;
  criticalLevel: number;
  alertGeneratedAt: Date | null;
};

/**
 * Devuelve las vacunas con stock critico, de la mas comprometida a la menos.
 * La consulta se calcula en vivo contra el stock materializado de los lotes,
 * por lo que tambien refleja cambios de umbral aunque no haya un movimiento.
 */
export async function listLowStockVaccines(): Promise<LowStockVaccine[]> {
  return prisma.$queryRaw<LowStockRow[]>`
    SELECT
      v."id_vacuna" AS "vaccineId",
      v."nombre" AS "vaccineName",
      v."nivel_critico" AS "criticalLevel",
      COALESCE(
        SUM(l."quantity_available") FILTER (WHERE l."fecha_vencimiento" >= CURRENT_DATE),
        0
      )::integer AS "stock",
      (
        SELECT a."fecha_generacion"
        FROM "alerta_stock" a
        WHERE a."id_vacuna" = v."id_vacuna" AND a."estado" = 'activa'
        LIMIT 1
      ) AS "alertGeneratedAt"
    FROM "vacuna" v
    LEFT JOIN "lote" l ON l."id_vacuna" = v."id_vacuna"
    WHERE v."nivel_critico" IS NOT NULL
    GROUP BY v."id_vacuna", v."nombre", v."nivel_critico"
    HAVING COALESCE(
      SUM(l."quantity_available") FILTER (WHERE l."fecha_vencimiento" >= CURRENT_DATE),
      0
    ) <= v."nivel_critico"
    ORDER BY (
      COALESCE(
        SUM(l."quantity_available") FILTER (WHERE l."fecha_vencimiento" >= CURRENT_DATE),
        0
      ) - v."nivel_critico"
    ) ASC, v."nombre" ASC
  `;
}
