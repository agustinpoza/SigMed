# Integración de identidad real con historial y stock

Fecha: 14/10/2026. Entrega de Bugs y Mejoras sobre `dd3a6a4`. Responsable de implementar US-7.2/7.4: otro integrante del equipo, según la división indicada por el usuario.

## Trabajo entregado por Bugs y Mejoras

- SIG-MEJ-02.3 verifica consultas reales, datos enviados al componente cliente y cambios de paciente. La tabla se remonta mediante `key={actor.id}`, limpiando consulta, filtros, página e indicaciones al cambiar de paciente.
- SIG-MEJ-03.3 verifica saldo, movimientos, rollback, alertas e inmutabilidad con PostgreSQL real. El rechazo confirmado de stock negativo se traduce a un error de cantidad. Se toma el bloqueo del lote antes del INSERT para evitar el deadlock entre descuentos válidos.
- [21 pruebas de integración](../../tests/integration/sprint-2.test.tsx) usan Prisma/adaptador Neon/dominio/guard/componentes reales; incluyen las tres lecturas nuevas de DU-07. Únicamente se simulan `getCurrentActor` y la invalidación de caché de Next. El actor simulado no demuestra autenticación.
- [Tres casos TODO separados](../../tests/integration/auth.todo.test.ts) reservan la verificación con HTTP y proveedor real. Ese archivo no tiene el mock de identidad usado por las pruebas del bloque.

## Contratos existentes que debe conservar la integración

| Punto | Contrato actual | Verificación al integrar las US |
| --- | --- | --- |
| [getCurrentActor](../../src/lib/dev-actor.ts) | Devuelve `UserProfile` o `null`; `id` es el UUID del perfil local y `role` su rol. La cuenta externa se vincula por `clerkUserId`; no es el mismo ID. | Sustituir identidad de desarrollo por sesión verificada y perfil vinculado. Sesión ausente/inválida/vencida no aporta un actor. No aceptar identidad/rol de campos del formulario. |
| [HistorialPage](../../src/app/%28portal%29/paciente/historial/page.tsx) | En la ruta actual exige PACIENTE y filtra por `appointment.patientId = actor.id`, antes de crear los datos del cliente. | Repetir aislamiento A/B por HTTP con sesiones reales y revisar payload, navegación, cierre e inicio con otra cuenta. Mantener datos privados fuera de cachés compartidas. |
| [Guard de stock](../../src/lib/actor-guard.ts) | Permite ENFERMERA/ADMINISTRADOR y devuelve `{ actor: { id } }` o `{ error }`. Si falta actor mantiene el fallback previo. | Reemplazar el fallback por el comportamiento definido para sesión real. La presencia de un ID elegido automáticamente no valida auditoría. |
| [createStockMovement](../../src/app/%28portal%29/enfermera/inventario/actions.ts) | El responsable procede del guard del servidor; un `actorId` enviado por el cliente se ignora. El dominio recibe el UUID del perfil. | Verificar que actor persistido corresponda al operador autenticado y que rol no autorizado no escriba. Conservar valores ante error y el signo calculado una sola vez. |
| [getLotAvailability](../../src/app/%28portal%29/enfermera/inventario/actions.ts) | Consulta vacuna + número de lote, devuelve quantityAvailable y aplica el guard de stock existente. Error/no encontrado no equivalen a cero. | Repetir autorización de la lectura con sesión real y conservar la separación de resultados; el fallback sigue siendo deuda compartida con las escrituras. |

Este documento registra la interfaz que ya consume Bugs y Mejoras. No implementa login, registro, provisión de cuentas, permisos nuevos o el proveedor de autenticación, ni asigna esas US al usuario.

## Pendientes de la integración externa

1. Repetir historial con sesiones reales A/B, sesión inválida/vencida y cambio de cuenta; comprobar tanto pantalla como datos entregados.
2. Rechazar escrituras de stock sin sesión real sin atribuirlas al fallback de desarrollo. El guard actual no limita por sí mismo ese fallback a desarrollo; esta entrega lo conserva y no lo valida como auditoría.
3. Verificar responsable real de los movimientos y suplantación mediante campos/cookies de la petición. Comprobar rol autorizado/no autorizado sobre las mismas acciones.

Al repetir stock, incluir la nueva lectura `getLotAvailability` de DU-07 y su guard: no presentar el acceso con fallback como prueba de sesión real. [Cierre provisorio de los complementos](bugs-y-mejoras/CIERRE-PROVISORIO.md).

Los TODO deben convertirse en pruebas del proveedor y HTTP reales de las US cuando existan. No basta llenar los casos conservando un mock de identidad. La base de estas pruebas se crea localmente; arrancar un servidor Next/HTTP para nuevas pruebas requiere conectar explícitamente su entorno de pruebas, no utilizar la base compartida por defecto.

## Límite con US-7.5 y DU-06/08

El guard actual del historial solo acepta PACIENTE. Las pruebas preservan ese comportamiento previo; no fijan una prohibición general para ADMINISTRADOR. US-7.5 debe definir su contexto de paciente/autorización. Si agrega selección de otro paciente, coordinar filtro y clave del componente con ese contexto autorizado para conservar aislamiento y limpieza de estado.

DU-08 queda como integración pendiente de identidad real; el stock y los campos de trazabilidad están verificados con perfiles ficticios identificados. DU-06 permanece con US-7.5. Ninguna prueba de este bloque certifica por sí sola RNF-04 o una sesión desplegada.

## Comandos y evidencia

```powershell
npm.cmd test
npm.cmd run test:integration
```

El segundo comando crea un PostgreSQL local temporal con siete migraciones reales, perfiles/lotes ficticios y dos conexiones concurrentes; se detiene y elimina el cluster propio al terminar. No lee `.env` ni usa servicios PostgreSQL existentes. La infraestructura está en [postgres.ts](../../tests/integration/postgres.ts) y [setup.ts](../../tests/integration/setup.ts).

[Ver implementación, resultados y límites de SIG-MEJ-02.3/03.3](bugs-y-mejoras/SIG-MEJ-02.3-03.3-IMPLEMENTACION.md).
