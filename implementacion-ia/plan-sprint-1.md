# Plan de Sprint 1 — SigMed

Alcance acordado para la primera entrega de implementación. Las historias salen
de `docs/user_stories_sprint_1.md`.

---

## Alcance

| Historia | Descripción | Ruta | Estado |
| --- | --- | --- | --- |
| US-1.4 | Hoja de trabajo diaria del médico | `/medico/agenda` | Placeholder |
| US-1.5 | Modificación de horarios por el administrador | `/admin/horarios` | Placeholder |
| US-3.1 | Alta de nuevas vacunas | `/enfermera/vacunas` | **Completada** |
| US-3.2 | Registro y actualización de stock | `/enfermera/inventario` | **Completada** |
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

## Fase 2 — Esqueleto de rutas · COMPLETADA

Route group `(portal)` con shell compartido y un layout por rol. Los prefijos
públicos acordados no llevan segmento extra porque los route groups no aparecen
en la URL.

```
src/app/(portal)/layout.tsx               shell comun
src/app/(portal)/role-nav.tsx             nav con estado activo (client)
src/app/(portal)/role-shell.tsx           badge de rol + nav + contenido
src/app/(portal)/placeholder.tsx          pantalla placeholder reutilizable
src/app/(portal)/medico/layout.tsx        + page.tsx, agenda/page.tsx
src/app/(portal)/enfermera/layout.tsx     + page.tsx, vacunas/, inventario/
src/app/(portal)/admin/layout.tsx         + page.tsx, horarios/page.tsx
src/app/(portal)/paciente/layout.tsx      + page.tsx, historial/page.tsx
```

`src/app/page.tsx` y `src/app/api/health/route.ts` quedan sin tocar.

**Rutas generadas (11).** `/medico`, `/medico/agenda`, `/enfermera`,
`/enfermera/vacunas`, `/enfermera/inventario`, `/admin`, `/admin/horarios`,
`/paciente`, `/paciente/historial`, más `/` y `/api/health`.

**Validación ejecutada:** `build` (12/12 páginas), `typecheck`, `lint`, y las
11 rutas verificadas con `next start` respondiendo `200`. Se comprobó además que
el estado activo de la navegación se renderiza en el HTML del servidor.

**Detalle de tipos.** `LayoutProps<"/medico">` y similares no existen hasta que el
build regenera `.next/types/routes.d.ts`. El orden correcto es: crear los
archivos → `npm run build` → `npm run typecheck`. Al revés, `tsc` falla.

**Pendiente de esta fase:** las páginas son placeholders. No hay autenticación,
por lo que las cuatro áreas son accesibles sin restricción. El badge "Sesion sin
autenticar" y el botón "Salir" deshabilitado son el único elemento del mockup que
pudimos reproducir; el resto espera a Clerk.

---

## Fase 3 — Actor de desarrollo · COMPLETADA

`getCurrentActor()` resuelve quién es el usuario actual. Con Clerk, solo cambia el
interior de la función para resolver por `clerk_id`; la interfaz no se toca y los
Server Actions de las fases 4 y 5 no se enteran del cambio.

```
src/lib/dev-actor.ts                     getCurrentActor, isDevActorEnabled,
                                         listDevActorCandidates
src/app/(portal)/dev-actor-actions.ts    Server Actions setDevActor / clearDevActor
src/app/(portal)/dev-actor-picker.tsx    selector con useActionState
```

Se implementó con **Server Actions, no con un endpoint HTTP**. Un route handler
que fija una cookie de identidad habría sido una superficie de escalamiento de
privilegios; la Server Action además valida que el perfil exista y esté activo
antes de escribir. Se llegó a escribir `/api/dev/actor` y se eliminó: quedaba
código muerto.

**Interruptor.** `isDevActorEnabled()` devuelve `true` si
`SIGMED_DEV_ACTOR === "1"` o si `NODE_ENV !== "production"`. En producción sin el
flag, `getCurrentActor()` devuelve `null` sin tocar la base y el selector no se
renderiza.

**Trampa: prerender.** Como `isDevActorEnabled()` es `false` durante
`next build` (donde `NODE_ENV=production`), las páginas del portal se prerendere
ban estáticas **sin el selector**. El portal lleva `export const dynamic =
"force-dynamic"` justamente para que la cookie y el flag se evalúen en cada
request. Sin eso, activar `SIGMED_DEV_ACTOR=1` en un deploy no alcanzaría: se
serviría el HTML ya horneado.

**Validación ejecutada:** `build` (12 rutas, las 9 del portal ahora dinámicas),
`typecheck`, `lint`. Y con `next dev`:

| Prueba | Resultado |
| :--- | :--- |
| El selector lista los perfiles del seed | 7 perfiles |
| Cookie válida → layout muestra "Actuando como Lucia Ferreyra" | OK |
| Cookie con UUID inexistente → vuelve a "Sin actor" | OK |
| Sin cookie → "Sin actor" | OK |

**No verificado automáticamente:** el round trip completo del clic, es decir
Server Action → `cookies().set()` → re-render. No se puede simular con `curl`
porque Next 16 exige el header `Next-Action` con el *server reference id*, que no
aparece en el HTML. Queda pendiente de un clic en el navegador.

---

## Fase 4 — US-3.1: alta de vacunas · COMPLETADA

```
src/lib/forms.ts                              validadores a mano, sin Zod
src/app/(portal)/enfermera/vacunas/actions.ts    Server Action createVaccine
src/app/(portal)/enfermera/vacunas/vaccine-form.tsx   formulario con useActionState
src/app/(portal)/enfermera/vacunas/page.tsx    alta + catálogo
```

Una sola acción, dentro de `$transaction`: crea `Vaccine` + `VaccineLot` inicial +
`StockMovement` de tipo `INGRESO`. Así el lote queda cargado y trazable desde el
mismo alta, que es lo que pide el método de verificación de RF-33.

**El `actor_id` se resuelve al final, no al principio.** La acción valida el
formulario completo antes de pedir el actor, para que una enfermera sin actor
seleccionado vea primero los errores de sus campos en lugar de un mensaje
genérico.

**Conflicto de nombres.** El `findUnique` previo sobre `vaccine.name` deja pasar
dos envíos concurrentes, así que el `P2002` también se captura y se traduce a un
error de campo. Sin eso, el segundo envío sería un 500.

**El laboratorio es texto libre con sugerencias.** El mockup dice "Seleccionar
Opción" pero no hay tabla maestra de laboratorios. Se usa un `datalist` con los
valores ya presentes, sin agregar tablas.

**La baja de una vacuna no existe, y no por falta de endpoint.** El trigger
`stock_movement_no_delete` más el `onDelete: Restrict` de `vaccine_lot` impiden
borrar. Ver [consideraciones §11](consideraciones-tecnicas.md).

**Validación ejecutada:** `typecheck`, `lint`, `build`, y 11 pruebas sobre los
validadores y la transacción (`stock = suma de movimientos`, `P2002` capturado,
actor atribuido). El clic en el navegador queda pendiente, igual que el actor.

---

## Fase 5 — US-3.2: movimientos de stock · COMPLETADA

```
src/lib/stock.ts                                reglas de stock, sin depender de Next
src/app/(portal)/enfermera/inventario/actions.ts     Server Action createStockMovement
src/app/(portal)/enfermera/inventario/movement-form.tsx
src/app/(portal)/enfermera/inventario/page.tsx   alta + stock por lote + historial
```

**Las reglas de stock se separaron de Next.** `src/lib/stock.ts` no importa
`next/headers`: recibe el `actorId` como parámetro y lanza `StockRuleError` con
errores de campo. Las Server Actions solo parsean el `FormData`, resuelven el
actor y traducen el error. Eso permite ejercitar la lógica real contra la base
desde un script, en vez de copiar la transacción en el test y probar una copia.

**El lote es texto libre y el vencimiento se pide solo cuando hace falta.** El
mockup mete lote y vencimiento en el mismo formulario. En un `INGRESO`, si el
lote no existe se crea y el vencimiento pasa a ser obligatorio; si ya existe se
suma al stock y el vencimiento se ignora. En un `EGRESO` el lote tiene que existir
dentro de la vacuna elegida.

**El `EGRESO` no puede dejar stock negativo, ni con concurrencia.** El descuento
es un `updateMany` con `where: { quantityAvailable: { gte: cantidad } }`, que es
una sola sentencia atómica: PostgreSQL reevalúa el `WHERE` contra la fila ya
actualizada por la transacción ganadora. Con 90 unidades y dos egresos de 60 en
paralelo, uno entra y el otro recibe "stock insuficiente". El `CHECK
vaccine_lot_quantity_non_negative` queda como última red.

**Los rechazos lanzan, no retornan.** Si la transacción devolviera un valor de
error en lugar de lanzar, Prisma la commitearía con las escrituras parciales ya
hechas. `StockRuleError` es una excepción, así que el rollback es automático.

**Agregado al mockup:** una tabla de stock por lote. El historial solo muestra
movimientos, y sin el saldo actual no se puede calcular un egreso con la cabeza.

**Validación ejecutada:** `typecheck`, `lint`, `build`, y 24 pruebas sobre las
funciones reales: alta con lote, nombre duplicado, ingreso sobre lote existente,
ingreso que crea lote, ingreso sin vencimiento, egreso normal, egreso por sobre
el stock, lote inexistente, vacuna dada de baja, los cuatro `movementType` no
permitidos, y la carrera de dos egresos simultáneos. La reconciliación
`stock = suma de movimientos` se comprueba después de cada operación.

**Pendiente:** el clic en el navegador, por la misma razón que en las fases
anteriores.

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
