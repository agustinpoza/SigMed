# Consideraciones técnicas — SigMed

Registro de decisiones, desvíos conscientes y pendientes detectados durante la
implementación asistida por IA. Sirve para que el criterio quede escrito y no
dependa de la memoria de una conversación.

- [Prompts de trabajo](prompts.md)
- [Plan de Sprint 1](plan-sprint-1.md)

---

## 1. Roles: de la base de datos a Clerk

**Decisión.** El rol del usuario vive únicamente en Clerk
(`publicMetadata.role`). Se eliminó el enum `Role` y la columna
`user_profile.role`.

**Qué se conserva.** `user_profile.clerk_id` sigue en la base. La **identidad**
permanece en el sistema; lo que se mudó a Clerk es el **rol**. Ese campo es el
puente entre un usuario de Clerk y su perfil, sus fichas de `doctor` o
`patient`, y su firma en `stock_movement.actor_id`.

**Consecuencia asumida.** RF-24 dice que el administrador crea las cuentas del
personal. Con el rol fuera de la base, esa asignación deja de ser un `INSERT`/`UPDATE`
y pasa a ser una operación del Backend API de Clerk o del Dashboard. La base ya
no registra **quién** asignó cada rol ni **cuándo**. Si más adelante se necesita
esa auditoría, hay que resolverla en el lado de Clerk o guardar un log de eventos.

**Alternativa considerada y descartada.** Base de datos como fuente de verdad del
rol, con Clerk manejando solo la autenticación. Se descartó porque duplicaba el
dato y obligaba a mantenerlo sincronizado. Volver atrás es posible, pero implica
revertir la migración `20261004135801_drop_user_profile_role`.

---

## 2. Desvío consciente: administrador sin herencia de funciones

**Decisión.** `/medico` y `/paciente` quedan restringidos a sus propios roles. El
administrador tiene su propia área `/admin` y no accede a las de médico ni
paciente.

**Desvío documentado.** RF-26 establece que el administrador puede ejercer las
funciones de médico y de paciente. La implementación actual **no** implementa esa
herencia. Es una decisión consciente para mantener el control de acceso simple
durante la primera entrega.

**Pendiente.** Si el cliente valida RF-26 contra la aplicación, esto falla. La
corrección sería una matriz de permisos explícita en la capa de autorización, no
un `if` suelto por ruta. Anotado en el README para que no se pierda de vista.

---

## 3. Rutas sin protección en esta etapa

**Estado.** No hay autenticación implementada. No existen guards, y
`proxy.ts` de Clerk no fue creado todavía.

**Riesgo.** `/medico`, `/enfermera`, `/admin` y `/paciente` responden sin
verificar nada. **No desplegar a producción en este estado.**

**Mitigación prevista.** Un interruptor `SIGMED_DEV_ACTOR` habilita el actor de
desarrollo solo si `NODE_ENV !== "production"`. Las Server Actions que necesitan
`actor_id` rechazan la operación cuando el actor es `null`. Eso limita el daño de
las escrituras, pero **las páginas seguirían siendo accesibles**: para un
despliegue real hace falta además un gate de acceso.

---

## 4. Actor de desarrollo

**Problema.** US-3.2 CA2 exige trazabilidad inmutable del usuario responsable en
cada movimiento de stock. Sin Clerk no hay identidad real, y `stock_movement.actor_id`
es obligatorio.

**Solución.** `src/lib/dev-actor.ts` expone `getCurrentActor()`, que hoy resuelve
un `user_profile` desde una cookie de desarrollo. Cuando se integre Clerk, cambia
solo el interior de esa función para resolver por `clerk_id`. **La interfaz no
cambia y los Server Actions no se tocan.**

---

## 5. Validación sin librería

**Decisión.** No se usa zod ni ninguna librería de validación.

**Implementación.** `src/lib/forms.ts` expone tres primitivas —`text()`, `int()` y
`date()`— sin abstracción de schemas. Cada Server Action accumulates los errores
en un objeto con `if` explícitos y devuelve `{ ok: false, errors }`. El ciclo de
render de errores usa `useActionState` de React 19, que ya está disponible.

**Duplicados.** En vez de cazar el código de error `P2002` de Prisma, se valida con
`findUnique` antes de insertar. `vaccine.name` es único y
`vaccine_lot(vaccineId, lotNumber)` también, así que el chequeo previo cubre el
caso real y devuelve un error de campo legible. La constraint de la base sigue
siendo la garantía final contra carreras. Además, el cliente generado de Prisma
(`src/generated/prisma/client.ts`) **no** re-exporta el namespace `Prisma`, así que
las clases de error solo serían accesibles por una ruta interna del SDK: se evitó.

---

## 6. Movimiento `AJUSTE`: hueco de modelo

**Problema.** El enum `MovementType` incluye `AJUSTE`, pero `stock_movement.quantity`
tiene el CHECK `> 0` (`stock_movement_quantity_positive`). Un ajuste a la baja
**no se puede representar**.

**Decisión.** El formulario de US-3.2 ofrece solo `INGRESO` y `EGRESO`, que es
literalmente lo que muestra el mockup de la historia. `AJUSTE` sigue en el enum
—el seed lo usa— pero no se expone.

**Pendiente.** Definir cómo modelar el ajuste a la baja cuando se aborde RF-13
(alertas de stock crítico). Opciones: una columna `signedQuantity`, o separar
`AJUSTE` en `AJUSTE_POSITIVO` y `AJUSTE_NEGATIVO`.

---

## 7. Bug corregido en el seed: lote `LT-FIEB-2402`

**Detectado.** El lote tenía movimientos de `+12` (ingreso) y `+2` (ajuste), pero
`quantity_available` estaba en `10`. Los otros tres lotes reconciliaban bien.

**Impacto.** La pantalla de movimientos de US-3.2 muestra el historial junto al
stock actual, así que la inconsistencia habría quedado visible en la UI.

**Corrección.** `quantity_available` pasó de `10` a `14` en `prisma/seed.ts`.
Verificado: los cuatro lotes ahora reconcilian.

---

## 8. Migración creada a mano

**Detalle operativo.** `prisma migrate dev` es interactivo y no puede ejecutarse en
un entorno no interactivo. La migración se escribió directamente en
`prisma/migrations/20261004135801_drop_user_profile_role/migration.sql` y se aplicó
con `prisma migrate deploy`.

**Orden de las operaciones** (importante si alguna vez hay que revertir):
1. `DROP INDEX` — depende de la columna.
2. `ALTER TABLE ... DROP COLUMN` — la columna.
3. `DROP TYPE` — el enum, ya sin referencias.

Prisma advierte que se descartan 7 valores no nulos de `role`. Es esperado.

**Trampa encontrada.** Tras modificar el schema hay que correr `npm run db:generate`
**antes** de `db:seed`. El cliente generado conservó `role` en el modelo y el seed
falló con `P2022: The column 'role' does not exist`.

---

## 9. Notas de SQL con Prisma y Postgres

Dos cosas que aparecieron y conviene recordar:

- `information_schema.columns.column_name` y `pg_type.typname` son del tipo `name`
  de Postgres, que Prisma no deserializa. Hay que castear: `column_name::text`.
  Sin el cast, falla con `P2010 UnsupportedNativeDataType`.
- Las columnas `name`/`label` de las vistas del catálogo del sistema son el caso
  típico. Para consultas de introspección, castear siempre.

---

## 10. Seguridad: exposición de credencial, aceptada

**Situación.** Una contraseña de Neon se expuso en una conversación y fue
versionada brevemente. La historia ya está saneada con
`git push --force-with-lease` y el objeto local se purgó, de modo que **la
credencial no está en la historia de Git del repositorio**. Sigue presente en el
`.env` local y en las variables de Vercel, que es donde corresponde estar.

**Decisión del propietario (2026-10-04).** No rotar la contraseña. El proyecto no
es de uso crítico y se evaluó que el riesgo de exposición no justifies la
rotación. **Riesgo aceptado de forma consciente**, no por omisión.

**Exposición residual que queda asumida:**
- La contraseña circulated en texto plano por un canal de conversación.
- Si ese canal queda accesible para terceros, la base queda accesible para ellos.
- `.env` y las variables de Vercel siguen conteniendo la credencial.

**Si más adelante se decide rotar**, el orden es: rotar en Neon → actualizar
`.env` → actualizar `DATABASE_URL` y `DATABASE_URL_UNPOOLED` en Vercel →
redesplegar. No hay migración pendiente que afecte este cambio.

---

## 11. Deuda técnica

- [ ] `npm audit` reporta vulnerabilidades **high** sin resolver. No se corrió
      `npm audit fix --force` para no tocar versiones mayores sin decisión explícita.
- [ ] Prisma 7.10.0 tiene disponible 8.0.0-rc.19. Actualización mayor, no
      prioridad actual.
- [ ] Los documentos de `docs/` estaban sin commitear al momento de escribir esto.

---

## 12. Convenciones observadas

- Tipos generados de Next.js 16 en props: `PageProps<"/enfermera/vacunas">`,
  `LayoutProps<"/">`. No `params: Promise<...>` manuales.
- Rutas en español, siguiendo los RF.
- Route group `(portal)` para el shell compartido, para que los prefijos públicos
  `/medico`, `/enfermera`, `/admin` y `/paciente` no lleven segmento extra.
- Las reglas que Prisma no puede expresar van en SQL manual con su comentario
  explicativo, como ya se hizo en `20261004061200_constraints`.
