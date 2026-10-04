# Plan de Sprint 1 — SigMed

Alcance acordado para la primera entrega de implementación. Las historias salen
de `docs/user_stories_sprint_1.md`.

---

## Alcance

| Historia | Descripción | Ruta | Estado |
| --- | --- | --- | --- |
| US-1.4 | Hoja de trabajo diaria del médico | `/medico/agenda` | Placeholder |
| US-1.5 | Modificación de horarios por el administrador | `/admin/horarios` | Placeholder |
| US-3.1 | Alta de nuevas vacunas | `/enfermera/vacunas` | **A implementar** |
| US-3.2 | Registro y actualización de stock | `/enfermera/inventario` | **A implementar** |
| US-3.6 | Asignación de turnos de vacunación | `/enfermera/turnos-vacunacion` | Fuera de alcance |
| US-5.2 | Consulta remota de historial clínico | `/paciente/historial` | Placeholder |

---

## Fase 1 — Base de datos · COMPLETADA

Eliminado el enum `Role` y la columna `user_profile.role`; el rol pasa a Clerk.

- `prisma/schema.prisma`: fuera el enum `Role`, el campo `role` y el
  `@@index([role])`.
- `prisma/migrations/20261004135801_drop_user_profile_role/migration.sql`: nueva
  migración con `DROP INDEX` → `DROP COLUMN` → `DROP TYPE`.
- `prisma/seed.ts`: fuera el import de `Role` y los 7 `role:`. Corregido
  `quantityAvailable` del lote `LT-FIEB-2402` de `10` a `14`.
- Orden obligatorio: `db:deploy` → `db:generate` → `db:seed`. Ver
  [consideraciones §8](consideraciones-tecnicas.md).

**Validación ejecutada:** `db:deploy`, `db:generate`, `db:seed`, `db:verify`,
`typecheck`, `lint`, `build`. Columna y enum ausentes en la base; los cuatro lotes
reconcilian con sus movimientos.

---

## Fase 2 — Esqueleto de rutas

Route group `(portal)` con shell compartido y un layout por rol. Los prefijos
públicos acordados no llevan segmento extra porque los route groups no aparecen
en la URL.

```
src/app/(portal)/layout.tsx               shell comun
src/app/(portal)/medico/layout.tsx        + page.tsx, agenda/page.tsx
src/app/(portal)/enfermera/layout.tsx     + page.tsx
src/app/(portal)/enfermera/vacunas/      US-3.1
src/app/(portal)/enfermera/inventario/    US-3.2
src/app/(portal)/admin/layout.tsx         + page.tsx, horarios/page.tsx
src/app/(portal)/paciente/layout.tsx      + page.tsx, historial/page.tsx
```

`src/app/page.tsx` y `src/app/api/health/route.ts` quedan sin tocar.

---

## Fase 3 — Actor de desarrollo

`src/lib/dev-actor.ts` con `getCurrentActor()`. Habilitado solo con
`SIGMED_DEV_ACTOR=1` o `NODE_ENV !== "production"`. Ver
[consideraciones §4](consideraciones-tecnicas.md).

---

## Fase 4 — US-3.1: alta de vacunas

`enfermera/vacunas/page.tsx` con formulario y catálogo, según el mockup. Las
acciones en `actions.ts` con `"use server"`.

Una sola acción, dentro de `$transaction`: crea `Vaccine` + `VaccineLot` inicial +
`StockMovement` de tipo `INGRESO`. Así el lote queda cargado y trazable desde el
mismo alta, que es lo que pide el método de verificación de RF-33.

**Detalle abierto:** el mockup dice "Laboratorio / Origen: Seleccionar Opción",
pero no hay tabla maestra de laboratorios. Se usa un `datalist` con los valores
ya presentes en la base, sin agregar tablas.

---

## Fase 5 — US-3.2: movimientos de stock

`enfermera/inventario/page.tsx` con el formulario de movimiento y el historial. El
historial sale de `stock_movement` con join a `vaccine` y `user_profile` para la
columna "RESPONSABLE".

Acción en transacción interactiva:

- `INGRESO`: incrementa el lote e inserta el movimiento.
- `EGRESO`: `updateMany` con `where: { quantityAvailable: { gte: qty } }` y
  `decrement`. Si `count === 0` se aborta con "stock insuficiente". Cubre la
  tarea 3.2.3 en la aplicación, sin depender del CHECK de la base.

`stock_movement` tiene trigger de inmutabilidad: las acciones solo insertan.

El formulario ofrece solo `INGRESO` y `EGRESO`. Ver
[consideraciones §6](consideraciones-tecnicas.md).

---

## Fase 6 — Validación

`db:generate`, `db:deploy`, `db:seed`, `db:verify`, `typecheck`, `lint`, `build`.

Prueba manual del ciclo en `npm run dev`: dar de alta una vacuna, ingresar stock,
intentar un egreso por sobre el disponible, y confirmar que el historial coincide
con el stock actual.

---

## Fuera de alcance

- Integración real de Clerk y `proxy.ts`.
- US-3.6, turnos de vacunación.
- RF-13, alertas de stock crítico.
