# SIG-MEJ-02.3 / SIG-MEJ-03.3 — Aislamiento del historial e integridad del stock

Fecha: 14/10/2026. Rama: `sprint-2/bugs-y-mejoras`. Base: `dd3a6a4`. Implementación y verificaciones locales; sin publicación.

## Alcance acordado

El usuario pidió implementar ambos tickets y dejar el marco de integración para las US de acceso, que corresponden a otro integrante y todavía no están disponibles. Se verifica el comportamiento actual con perfiles ficticios; no se implementan US-7.2/7.4/7.5 ni se certifica una sesión real.

RF-18 / US-5.2 exigen historial propio. RF-11 / US-3.2 y SIG-MEJ-03 exigen stock no negativo, movimiento trazable e integridad transaccional. Las pruebas reutilizan el flujo y reglas existentes; no agregan saldos, permisos ni un ciclo de vacunación nuevo.

## Fallos reproducidos y correcciones

| Caso | Evidencia antes, sobre copias del commit base | Corrección |
| --- | --- | --- |
| Cambiar de paciente desde página 2 | El componente conserva página 2 aunque el nuevo paciente solo tenga una; muestra `6-1 de 1 resultados`. La consulta ya filtra correctamente por paciente. | `key={actor.id}` remonta la tabla al cambiar de identidad y limpia consulta, filtro, orden, página y detalle. |
| Descontar más que el saldo | El trigger rechaza la operación, pero llega `PrismaClientKnownRequestError` P2039, con SQLSTATE P0001 y el mensaje confirmado de stock negativo. | Se traduce exclusivamente ese rechazo a `StockRuleError.quantity`: «No hay suficientes dosis disponibles en este lote.» El catch ocurre fuera de la transacción, tras el rollback. |
| Dos descuentos concurrentes válidos | Uno falla con P2034 / SQLSTATE **40P01**, `deadlock detected`, aun cuando ambos caben en el saldo. | Se bloquea el lote antes del INSERT. Evita que dos INSERT tomen primero KEY SHARE por la FK y luego ambos intenten promover el bloqueo a FOR UPDATE en el trigger. El cálculo del saldo sigue en el trigger. |

Los tres casos seleccionados fallan contra las copias del commit base y pasan con la implementación actual. No se reemplazaron los archivos de trabajo para ejecutar el baseline.

## SIG-MEJ-02.3 — Verificaciones entregadas

**8 pruebas** ejecutan la función de servidor real `HistorialPage`, Prisma/SQL y el componente cliente con dos pacientes, un profesional compartido y términos comunes. Los registros clínicos, perfiles y turnos son ficticios y viven solo en el cluster de pruebas.

- A recibe siete registros propios y B uno, sin registros exclusivos del otro. Se inspeccionan las props enviadas al componente cliente, sus siete campos permitidos y búsquedas en la pantalla.
- Cambiar A→B desde página 2 reinicia la tabla; no conserva datos, consulta, filtro ni indicaciones del paciente anterior.
- Con identidad nula se retiran datos y buscador del cliente.
- Se preserva el guard actual para roles no PACIENTE. Es regresión del comportamiento existente, no una prohibición administrativa nueva para US-7.5.

Vitest recibe el elemento después de resolver la función asíncrona; no se presenta como una prueba HTTP/RSC completa de Next. La identidad se simula en el límite `getCurrentActor`; la base y la consulta no se simulan.

## SIG-MEJ-03.3 — Verificaciones entregadas

**10 pruebas** usan catálogo/lotes ficticios, dominio y guard reales, acción y formulario reales, Prisma/adaptador Neon y triggers/migraciones del proyecto.

- Saldo insuficiente: rechazo claro, valores conservados, caché sin invalidar, stock y movimientos intactos; el formulario permite reintentar.
- Descuento exacto: llega a cero y el stock materializado coincide con la suma de movimientos.
- Trazabilidad: lote, motivo, usuario del guard, fecha y signo correctos; el `actorId` agregado al formulario se ignora. Se verifican perfiles identificados de prueba, no autenticación real.
- Concurrencia: dos conexiones se mantienen esperando un bloqueo real del mismo lote. Descuentos que superan el saldo dejan un éxito y un rechazo por cantidad; si ambos caben se registran ambos y llegan a cero.
- Rollback: un fallo posterior a crear un lote no deja el lote persistido. Errores ajenos al rechazo confirmado de stock no se convierten en falta de dosis.
- Inmutabilidad: UPDATE/DELETE de movimientos son rechazados; el saldo permanece consistente.
- Alertas: se conserva el umbral y transición existentes; un descuento rechazado no altera la alerta y una reposición la resuelve según el trigger vigente.
- Rol no autorizado: la acción no registra movimientos.

La traducción identifica el SQLSTATE y texto del trigger actualmente instalado. Si cambia ese contrato de error, actualizar matcher y prueba; no se usa un catch genérico que oculte otras fallas. El bloqueo añadido protege este recorrido de movimientos; no certifica todos los flujos concurrentes de vacunación.

## Infraestructura aislada y comandos

La configuración [vitest.integration.config.ts](../../../vitest.integration.config.ts) y [postgres.ts](../../../tests/integration/postgres.ts) crean un PostgreSQL **18.4** temporal bajo `node_modules/.cache`, con puerto local propio y siete migraciones reales. Los binarios proceden de [embedded-postgres](https://github.com/leinelissen/embedded-postgres), instalado como dependencia de desarrollo; no se crea un servicio del sistema ni un usuario del SO.

Se usa el adaptador Neon real y un proxy WS→TCP que solo conecta al PostgreSQL propio en `127.0.0.1`. El cliente nativo `pg` prepara las migraciones. La contraseña es temporal; no se lee `.env`, no se usa seed ni se ejecuta `db:verify` contra datos compartidos.

Al terminar se desconectan clientes, se detiene PostgreSQL y se elimina exclusivamente el directorio creado por esa ejecución, tras comprobar su ruta absoluta. Se usan los binarios directamente para conservar el código de salida de Vitest: el exit-hook del wrapper ocultaba los fallos con una salida 0.

```powershell
npm.cmd test
npm.cmd run test:integration
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

**Resultado:** 105 pruebas previas + 18 de integración = **123 aprobadas**, sin fallos. Los **3 TODO de sesión real** permanecen pendientes y no se cuentan como aprobados. Typecheck/build aprobados; lint sin errores, con advertencia preexistente de `aria-expanded` en vacunación. `git diff --check` aprobado.

[Resultados y comparación antes/después](evidencias/sig-mej-02.3-03.3/resultados.json). Las pruebas de integración se ejecutan con su comando propio; `npm.cmd test` conserva la suite rápida existente.

## Archivos y separación del trabajo

| Archivo | Entrega |
| --- | --- |
| [HistorialPage](../../../src/app/%28portal%29/paciente/historial/page.tsx) | Clave por identidad para reiniciar el estado privado de la tabla. |
| [stock.ts](../../../src/lib/stock.ts) | Traducción del rechazo confirmado y bloqueo antes de crear movimiento. |
| [sprint-2.test.tsx](../../../tests/integration/sprint-2.test.tsx) | 18 pruebas con SQL, aplicación y componentes reales; identidad simulada explícita. |
| [auth.todo.test.ts](../../../tests/integration/auth.todo.test.ts) | Tres puntos de integración separados, sin mock de identidad. |
| [setup.ts](../../../tests/integration/setup.ts) | Transporte local y URL propia por worker; desconexión al terminar. |

El alcance de Bugs y Mejoras queda implementado/verificado. El [documento para integrar US-7.2/7.4](../INTEGRACION-US-7.2-7.4.md) identifica contratos, archivos y resultados que debe repetir el compañero. El fallback de stock se conserva y no se valida como auditoría; el guard actual no lo limita por sí mismo a desarrollo. DU-08 / autenticación real y DU-06 / matriz administrativa quedan explícitamente fuera de esta implementación.

No se modificaron migraciones, reglas de alertas, identidad, login, registro o permisos. No se comprobó el despliegue compartido ni RNF-04 con sesión real.
