# Cierre provisorio de Bugs y Mejoras

Fecha: 14/10/2026. Rama: `sprint-2/bugs-y-mejoras`. Base de estos complementos: `bc7a2ce`.

El alcance implementable del bloque queda entregado y verificado con los criterios del usuario para DU-07/DU-10 y el rótulo provisorio de DU-02. Esto no convierte los textos temporales en aprobados ni cierra historias de otros integrantes. Los 16 tickets conservan sus IDs y la distinción entre implementación, definición e integración externa.

## Estado de los tickets

| Tickets | Entrega del bloque | Pendiente para cierre definitivo |
| --- | --- | --- |
| SIG-BUG-01.1 / 01.2 | Diagnóstico y corrección visual verificados. | Repetir regresión si cambian shell/US-7.4/2.8. |
| SIG-MEJ-01.1 | Alternativa «Indicaciones» registrada en DEC-004. | Aprobación definitiva de columna y botones; DU-02 abierta. |
| SIG-MEJ-01.2 | Textos centralizados y alternativa aplicada; teclado verificado en Chrome. | Aplicar los textos definitivos cuando exista el acuerdo. |
| SIG-BUG-02.1 / 02.2 / 02.3 | Reproducción, normalización y regresiones entregadas. | Repetir al integrar cambios del historial. |
| SIG-MEJ-02.1 / 02.2 | Matriz de campos y ayuda entregadas. | Repetir al integrar cambios del historial. |
| SIG-MEJ-02.3 | Aislamiento y cambio de paciente verificados con SQL real. | Sesión real de US-7.2/7.4; matriz administrativa de US-7.5. |
| SIG-MEJ-03.1 / 03.2 | Selector, magnitud positiva, signo en servidor e indicador DU-07 entregados. | Repetir flujo al integrar identidad real. |
| SIG-MEJ-03.3 | Stock, rollback, concurrencia, datos de trazabilidad e inmutabilidad verificados con SQL real. | Responsable autenticado y comportamiento sin sesión; DU-08 externa. |
| SIG-MEJ-04.1 / 04.2 / 04.3 | Mensajes, botón DU-10, validación y actualización por fecha entregados. | Integración con usuario real; ciclo DU-09 y duración DU-11 siguen pendientes fuera del bloque. |

## DU-07: indicador del lote

[DEC-005](../../decisiones.md#dec-005--disponibilidad-por-vacuna-y-número-de-lote) aplica el criterio del usuario y el indicador de image6. La consulta usa la clave del modelo `vaccineId_lotNumber`, recorta espacios exteriores como la acción existente y lee solo `quantityAvailable`. No suma un inventario paralelo ni cambia el saldo, las asignaciones, la expiración o los triggers.

Sin vacuna/lote no se muestra el indicador. Carga, lote inexistente, error y saldo cero son estados distintos. Un fallo nunca se sustituye por cero; hay reintento. Cambiar vacuna o lote retira la cantidad anterior y descarta respuestas tardías. Se consulta de nuevo tras un envío rechazado con campos conservados. El éxito limpia el formulario según el comportamiento previo y volver a identificar el lote consulta su saldo vigente.

El guard existente se aplica a la lectura. Su fallback permanece pendiente de US-7.2/7.4, igual que para escrituras; no se presenta como autenticación real. La cantidad mostrada es informativa y puede cambiar por otro operador: el servidor sigue validando cada movimiento dentro de la transacción.

## DU-10: sin horarios y consulta fallida

[DEC-006](../../decisiones.md#dec-006--confirmación-deshabilitada-sin-horarios-de-vacunación) tiene respaldo en image13, inspeccionada, que muestra el botón deshabilitado con aviso. La interfaz bloquea también durante carga/envío y ante consulta fallida; el error de consulta sigue siendo distinto de «sin horarios». Al elegir una fecha con cupos se habilita, manteniendo la validación de horario obligatorio si todavía no se eligió uno.

El botón se asocia mediante `aria-describedby` al aviso/error visible. El handler tampoco despacha si no hay cupos o hay error de consulta. Las acciones del servidor conservan sus validaciones para peticiones directas o desactualizadas, sin confiar en el estado del cliente.

No se modifica el ciclo PENDIENTE/APROBADO ni la reserva de dosis para resolver DU-09, ni se fija una duración de DU-11. La integración de las US de acceso sigue a cargo del otro integrante.

## Verificación ejecutada

- **120 pruebas unitarias aprobadas:** 39 de historial, 53 de inventario y 28 de vacunación. Incluyen 15 casos nuevos de lectura/indicador; las pruebas existentes de vacunación se actualizan para el bloqueo respaldado por el diseño.
- **21 pruebas de integración aprobadas** con PostgreSQL 18.4 local propio y siete migraciones reales. Tres casos nuevos verifican clave compuesta, saldo actualizado/cero, lote inexistente y guard vigente. La identidad sigue simulada; SQL/Prisma/triggers son reales.
- **3 TODO de sesión real** pendientes, separados y sin contarlos como aprobados. Total ejecutado con éxito: **141 pruebas**.
- **Chrome 155.0.8059.79, anchos 360/768/1280 px:** componentes y CSS reales con acciones/datos ficticios. Historial: Enter abre/cierra, Tab pasa a la otra atención y Espacio abre una atención sin indicaciones. Stock: ocultación inicial, cantidad, fallo de transporte distinto de cero y cero explícito. Vacunación: botón deshabilitado con descripción accesible, submit bloqueado, error diferenciado, recuperación y Tab/Enter con horarios.
- **Typecheck y build aprobados.** Lint sin errores, con advertencia preexistente de `aria-expanded` en el buscador de pacientes de vacunación. Comprobación de formato y enlaces documentales realizada al cerrar esta entrega.

[Resultados](evidencias/du07-du10/resultados.json), [teclado y navegador](evidencias/du07-du10/navegador.json). Capturas del stock: [360](evidencias/du07-du10/stock-360.png), [768](evidencias/du07-du10/stock-768.png), [1280](evidencias/du07-du10/stock-1280.png). Capturas sin cupos: [360](evidencias/du07-du10/sin-cupos-360.png), [768](evidencias/du07-du10/sin-cupos-768.png), [1280](evidencias/du07-du10/sin-cupos-1280.png).

La verificación de Chrome es una fixture interactiva, no un despliegue ni una prueba de sesión/HTTP de aplicación. La integración de stock usa únicamente el cluster temporal propio; no se escribe en datos compartidos ni se ejecuta seed. [Marco para el compañero de las US de acceso](../INTEGRACION-US-7.2-7.4.md).

## Comandos reproducibles

```powershell
npm.cmd test
npm.cmd run test:integration
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

DU-02 permanece provisoria. DU-06/DU-08 dependen de acceso/identidad; DU-09 conserva su contradicción de ciclo y DU-11 la duración. DU-12/13/14/15 mantienen sus definiciones generales o contratos entre US; esta entrega no las da por resueltas. Esos pendientes están separados del trabajo técnico entregado para permitir su revisión sin asumir reglas nuevas.
