# SIG-MEJ-03.3 — Verificar trazabilidad y rechazo de descuentos que dejarían stock negativo

| Campo | Valor |
| --- | --- |
| Sprint | 2 |
| Responsable | Usuario — Bugs y Mejoras |
| Tema padre | SIG-MEJ-03 |
| Tipo de tarea | Integración de stock y regresión |
| Prioridad propuesta | P1 |
| Estado inicial | Pendiente de integración del ajuste |
| Esfuerzo orientativo | 3 h |
| Predecesoras del plan de integración | [SIG-MEJ-03.2](SIG-MEJ-03.2.md) |

## Disponibilidad para arrancar

**Clasificación:** Arranque parcial sin consulta externa.

**Alcance que puede avanzar:** Pruebas de rechazo de stock negativo, descuento exacto, concurrencia, rollback y trazabilidad con actor identificado; traducir el error de stock esperado al formulario si hace falta.

**Dependencia o definición relevante:** La atribución cuando no hay actor (DU-08) no está resuelta. No validar el fallback como responsable real. SIG-MEJ-03.2 es dependencia para probar la nueva entrada integrada.

**Límite de esta clasificación:** No cerrar la verificación completa de trazabilidad hasta resolver el caso sin actor; stock e integridad sí pueden avanzar.

[Ver la clasificación de todos los tickets](../ARRANQUE.md). Esta sección no resuelve las dudas registradas ni modifica reglas de negocio; delimita el trabajo que puede empezar con lo ya definido.

## Precedencia y coordinación con otras US

**Predecesora o contrato:** SIG-MEJ-03.2 para entrada integrada; stock existente puede probarse antes.

**US/tareas relacionadas:** US-7.2/7.4 y US-3.2 existente.

**Coordinación y cierre:** Verificar stock por separado. Cierre completo de atribución necesita actor real y DU-08 resuelta; coordinar actor-guard sin validar automáticamente su fallback.

[Ver el orden del sprint y la matriz de integración](../../ORDEN-E-INTEGRACION.md). Compartir archivo no implica dependencia funcional; las pruebas base pueden empezar antes de repetirlas con las US nuevas.

## Fuente y situación actual

[Documento de análisis — sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md).

El movimiento ya guarda lotId, reason, actorId y quantity. La migración de reforma incluye trigger con bloqueo de lote y rechazo de stock negativo. La acción solo traduce StockRuleError, por lo que debe comprobarse cómo llega el rechazo del trigger.

La evidencia de código corresponde a una revisión estática. Las verificaciones indicadas abajo están planificadas, no ejecutadas.

## Objetivo

Conservar auditoría y stock consistente al usar las nuevas operaciones, mostrando un error comprensible si no alcanza.

## Trabajo y entregable

- Verificar movimientos con lote, motivo, responsable real, fecha, cantidad y signo esperados; el fallback de actor requiere revisión DU-08.
- Probar descuento mayor al stock, igual al stock y descuentos concurrentes sobre un lote.
- Comprobar que el fallo no deja movimiento persistido ni altera el stock; traducir el rechazo esperado a error de formulario si actualmente sale crudo.
- Reutilizar los controles vigentes; no ejecutar prisma/constraints.sql como si fuera el esquema actual, porque es anterior a la reforma.

## Criterios de aceptación

- [ ] **[Explícito en SIG-MEJ-03 CA2]** Descontar más de lo disponible se rechaza con mensaje claro y stock intacto.
- [ ] **[Derivado del stock por lote ≥ 0; concurrencia técnica]** Descontar exactamente lo disponible llega a cero; concurrencia no produce stock negativo.
- [ ] **[Explícito en RF-11/US-3.2 CA2; identidad pendiente DU-08]** Cada operación exitosa deja trazabilidad completa y stock igual a la suma de movimientos.
- [ ] **[Preservación; no redefine RF-13]** No se alteran alertas y restricciones por esta mejora. Los umbrales, canales o reglas de RF-13 no se redefinen como parte del ticket.

## Validación prevista

Pruebas en base de desarrollo/pruebas, con fixtures propios y rollback cuando sea viable. Revisar db:verify antes de ejecutarlo: contiene operaciones persistentes. Registrar comando, resultados y saldos; lint/typecheck tras ajustes.

## Archivos a revisar

- [src/lib/stock.ts](../../../../src/lib/stock.ts)
- [src/app/(portal)/enfermera/inventario/actions.ts](../../../../src/app/%28portal%29/enfermera/inventario/actions.ts)
- [src/app/(portal)/enfermera/inventario/page.tsx](../../../../src/app/%28portal%29/enfermera/inventario/page.tsx)
- [scripts/verify-constraints.ts](../../../../scripts/verify-constraints.ts)
- [prisma/migrations/20261005160000_reform_bd/migration.sql](../../../../prisma/migrations/20261005160000_reform_bd/migration.sql)

## Límite de alcance

No completar todo US-3.2 ni rediseñar inventario, FEFO o reserva de dosis de US-3.6.

## Revisión de requisitos, cobertura y dudas

Fecha: 13/10/2026. Esta revisión distingue reglas documentadas, propuestas de la fuente, implementación existente y supuestos del plan. Un dato observado en código no valida una regla de negocio.

### Requisito o regla correspondiente

RF-11 y US-3.2 exigen stock y trazabilidad. SIG-MEJ-03 de [Documento de sprint 2, sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md) explicita operación Sumar/Descontar, entero positivo en UI, signo interno, rechazo si no alcanza y lote/motivo/responsable/cantidad. El modelo exige stock por lote ≥ 0, ajuste con motivo y movimientos inmutables. [Requerimientos funcionales](../../../../docs/requerimientos_funcionales.md); [Diccionario y desvíos de implementación](../../../../docs/BD.md).

### Historia o ticket que ya lo cubre

US-3.2.2 ya permite sumar/descontar; US-3.2.3 ya verifica no negativo y CA2 exige usuario/fecha/lote inmutables. La novedad es la entrada positiva con operación explícita, no rehacer el inventario. [Historias de sprint 1](../../../../docs/user_stories_sprint_1.md).

**Para esta tarea:** Regresión de US-3.2.3/CA2 y reglas de movimiento_stock; no duplicar sus pruebas como nueva funcionalidad.

La cobertura encontrada es documental y local; no se consultó un tablero externo ni se afirma que esas historias estén terminadas.

### Qué es explícito y qué se estaba suponiendo

**Explícito en las fuentes:** El signo almacenado sigue representando incremento/decremento; el motivo es obligatorio en ajustes. El diseño muestra AJUSTE, selector de operación, fecha no modificable y stock disponible del lote.

**Supuesto o propuesta del primer plan:** Conservar el contrato firmado de registerStockMovement, los nombres de campos de FormData y la traducción de errores son propuestas técnicas. Un límite del entero de almacenamiento es técnico; no fija un máximo comercial de dosis. El fallback de actor existente no demuestra atribución al operador real.

Las etiquetas de los criterios separan obligación explícita, interpretación pendiente y verificación técnica. Proponer tests, un helper o atributos accesibles no crea una regla de negocio nueva ni exige un acuerdo funcional sobre cada detalle técnico.

### Datos faltantes o contradictorios

requireEnfermeraOAdministrador usa un primer perfil permitido como fallback si no hay actor. Eso no prueba responsable real ni sesión válida. Además la fuente dice stock derivado y el código usa caché, desvío D-03 documentado.

**Dudas abiertas relacionadas:** [DU-07](../REVISION.md#du-07), [DU-08](../REVISION.md#du-08), [DU-12](../REVISION.md#du-12). No hay respuestas registradas; no se adopta una opción como regla por defecto.

### Tratamiento de la duda y alcance seguro

Verificar lote, motivo, responsable real, cantidad y fecha; no asumir que la identidad elegida automáticamente está autorizada. La corrección de autenticación se coordina con US-7.2/7.4.

Los criterios condicionados se cierran solo cuando se documenta la definición que falta. Pueden continuar diagnóstico y revisión del comportamiento explícito; las expectativas dudosas no se implementan ni se convierten en pruebas que fijen una regla inventada.

Al completar, registrar evidencia y resultado en este ticket. Para código, indicar commit y comprobaciones realizadas; para definiciones, registrar el acuerdo. No marcar como terminado únicamente por existir código relacionado.

