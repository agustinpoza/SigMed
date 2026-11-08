# US 3.3 — Definición del nivel de stock crítico de cada vacuna (implementación)

## Resumen
Enfermería y administración (rol efectivo `ENFERMERA|ADMINISTRADOR`) pueden definir/actualizar el nivel crítico por vacuna (RF-32, CA1). Valores negativos o inválidos se rechazan (CA2). La evaluación de alertas por bajo stock sigue a cargo del trigger de BD (`fn_stock_movimiento_post` → `alerta_stock`); la app no duplica esa lógica.

## Modelo de datos
- `Vaccine.criticalLevel` (`nivel_critico`, nullable, `>=0`) — `prisma/schema.prisma`; migración base `20261005160000_reform_bd`. `StockAlert`/trigger de alertas ya existentes.

## Servicio
- `src/services/vaccineService.ts`: `getCriticalLevel`, `setCriticalLevel` (valida id/umbral, auth ENF/ADMIN, auditoría en tx vía `buildExerciseAudit`/`insertAudit`), `parseCriticalLevelInput`, `listVaccinesForCriticalConfig` (incluye stock físico = suma `lote.quantityAvailable`).

## APIs
- `GET /api/vaccines/:id/critical` — devuelve `{ "criticalLevel": number|null }`.
- `POST /api/vaccines/:id/critical` — body `{ "criticalLevel": number|null }` (entero `>=0` o `null`), actualiza y devuelve `{ "criticalLevel": number|null }`.
- Auth: `getActorContext()` + rol efectivo `ENFERMERA|ADMINISTRADOR`; 401/403/404/400 según caso. `src/app/api/vaccines/[id]/critical/route.ts`.

## UI (mockup 3.3)
- Ruta enfermera: `src/app/(portal)/enfermera/umbral-critico/page.tsx` + `critical-level-panel.tsx` + `actions.ts` (Server Action). “Panel de configuración de stock crítico” con 2 bloques: (1) Selección de vacuna (desplegable) y Laboratorio/Origen (lectura); (2) Stock Físico Actual (Referencia, lectura) y Nivel Stock Crítico con incrementador `min=0`. Sin sección de “vacunas bajo nivel crítico” (decisión de alcance); ticket 6 del documento de planificación no implementado en UI.
- Navegación: `Inicio, Catálogo de vacunas, Stock, Umbral crítico, Turnos de vacunación` (`layout.tsx`, `page.tsx`). Revalidación en guardado y en acciones de vacunas/inventario.

## Pruebas / CI
- Unit: `src/services/vaccineService.test.ts`.
- Integración: `tests/integration/us-3-3.test.ts` (GET/POST, auth, validación, y vínculo con `alerta_stock` vía trigger/movimientos reales).
- Script: `npm run test:us3.3`.
