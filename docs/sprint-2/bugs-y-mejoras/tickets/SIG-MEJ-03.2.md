# SIG-MEJ-03.2 — Validar cantidades positivas y calcular el signo del ajuste en el servidor

| Campo | Valor |
| --- | --- |
| Sprint | 2 |
| Responsable | Usuario — Bugs y Mejoras |
| Tema padre | SIG-MEJ-03 |
| Tipo de tarea | Integración y validación de formulario |
| Prioridad propuesta | P2 |
| Estado inicial | Pendiente de contrato de formulario |
| Estado actual | Implementado y verificado con pruebas aisladas; cierre integrado de stock corresponde a SIG-MEJ-03.3 |
| Esfuerzo orientativo | 3 h |
| Predecesoras del plan de integración | [SIG-MEJ-03.1](SIG-MEJ-03.1.md) |

## Implementación y verificación

Implementado el 14/10/2026 en sprint-2/bugs-y-mejoras, sobre b765674.

createStockMovement valida cantidad entera positiva y operación, calcula +cantidad/-cantidad una sola vez y mantiene los valores de entrada positivos al devolver errores. INGRESO conserva su comportamiento; el motivo sigue siendo obligatorio para AJUSTE. El contrato firmado de registerStockMovement y el guard existente no se modificaron.

[Ver implementación y resultados de SIG-MEJ-03.1/03.2](../SIG-MEJ-03-IMPLEMENTACION.md). Pasaron 38 pruebas nuevas de stock y 28 regresiones de vacunación (66 en total), typecheck y build. Lint sin errores, con un aviso preexistente de vacunación. Las casillas reflejan cobertura automatizada de la entrada, acción y contrato de llamada; no se escribieron movimientos reales para verificarlas.

SIG-MEJ-03.3 y las dudas DU-07/DU-08 permanecen pendientes: no se agregó indicador de stock por lote ni se cambió identidad, fallback, auditoría, triggers o reglas de concurrencia.

## Disponibilidad para arrancar

**Clasificación:** Implementable sin consulta externa, tras integrar el selector.

**Alcance que puede avanzar:** Validar entero positivo en la entrada y convertir Sumar a +cantidad y Descontar a -cantidad en el servidor, conservando motivo y movimientos existentes.

**Dependencia o definición relevante:** SIG-MEJ-03.1 es dependencia de integración. El signo y la positividad están explícitos; no se necesita fijar un máximo comercial nuevo.

**Límite de esta clasificación:** Mantener cantidades firmadas en el dominio y no cambiar el guard de identidad ni el modelo de stock para resolver otra duda.

[Ver la clasificación de todos los tickets](../ARRANQUE.md). Esta sección no resuelve las dudas registradas ni modifica reglas de negocio; delimita el trabajo que puede empezar con lo ya definido.

## Precedencia y coordinación con otras US

**Predecesora o contrato:** Contrato de la nueva entrada; SIG-MEJ-03.1 para probar UI integrada.

**US/tareas relacionadas:** SIG-MEJ-03.3, US-3.2 existente y US-7.2/7.4.

**Coordinación y cierre:** Validar y aplicar signo una vez; no prohibir negativos en todo el dominio ni implementar identidad desde el formulario.

[Ver el orden del sprint y la matriz de integración](../../ORDEN-E-INTEGRACION.md). Compartir archivo no implica dependencia funcional; las pruebas base pueden empezar antes de repetirlas con las US nuevas.

## Fuente y situación actual

[Documento de análisis — sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md).

createStockMovement acepta ajustes con enteros de cualquier signo excepto cero. registerStockMovement y los movimientos persistidos trabajan con cantidades con signo; el motivo ya es obligatorio para AJUSTE.

La evidencia inicial corresponde a la revisión estática previa. La implementación posterior y su verificación están registradas arriba; la integración real de stock continúa en SIG-MEJ-03.3.

## Objetivo

Aceptar operación explícita y cantidad positiva en el formulario, convirtiéndolas de forma confiable al movimiento firmado existente.

## Trabajo y entregable

- Validar cantidad entera positiva y dentro del rango admitido por el almacenamiento, incluso en envíos manipulados.
- Validar operación Sumar/Descontar para ajustes y calcular +cantidad/-cantidad en la acción del servidor.
- Mantener contrato con signo de registerStockMovement para otros consumidores y pruebas; conservar motivo obligatorio.
- Actualizar values y confirmación para que el usuario vea Sumar/Descontar y cantidad positiva.

## Criterios de aceptación

- [x] **[Explícito en SIG-MEJ-03 y modelo de stock]** Sumar 5 persiste +5; Descontar 5 persiste -5; INGRESO sigue siendo positivo.
- [x] **[Explícito para nueva entrada de UI; límite técnico]** En la nueva entrada del formulario, 0, negativos, decimales, campos ausentes y operaciones inválidas se rechazan antes de escribir; no se prohíben cantidades negativas en ajustes persistidos.
- [x] **[Propuesta técnica para aplicar signo una vez]** No se acepta un signo enviado por el cliente como autoridad ni se descuenta dos veces.
- [x] **[Preservación técnica y regla de motivo del modelo]** Los errores preservan los valores de UI y las reglas de lote/motivo existentes.

## Validación prevista

Probar la acción con FormData válido y manipulado, incluyendo límite de entero; verificar cantidad persistida. Ejecutar lint y typecheck y coordinar integración de stock con SIG-MEJ-03.3.

## Archivos a revisar

- [src/app/(portal)/enfermera/inventario/actions.ts](../../../../src/app/%28portal%29/enfermera/inventario/actions.ts)
- [src/lib/forms.ts](../../../../src/lib/forms.ts)
- [src/lib/stock.ts](../../../../src/lib/stock.ts)
- [src/app/(portal)/enfermera/inventario/movement-form.tsx](../../../../src/app/%28portal%29/enfermera/inventario/movement-form.tsx)

## Límite de alcance

No migrar el esquema para esta mejora ni cambiar las salidas por asignación de turnos.

## Revisión de requisitos, cobertura y dudas

Fecha: 13/10/2026. Esta revisión distingue reglas documentadas, propuestas de la fuente, implementación existente y supuestos del plan. Un dato observado en código no valida una regla de negocio.

### Requisito o regla correspondiente

RF-11 y US-3.2 exigen stock y trazabilidad. SIG-MEJ-03 de [Documento de sprint 2, sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md) explicita operación Sumar/Descontar, entero positivo en UI, signo interno, rechazo si no alcanza y lote/motivo/responsable/cantidad. El modelo exige stock por lote ≥ 0, ajuste con motivo y movimientos inmutables. [Requerimientos funcionales](../../../../docs/requerimientos_funcionales.md); [Diccionario y desvíos de implementación](../../../../docs/BD.md).

### Historia o ticket que ya lo cubre

US-3.2.2 ya permite sumar/descontar; US-3.2.3 ya verifica no negativo y CA2 exige usuario/fecha/lote inmutables. La novedad es la entrada positiva con operación explícita, no rehacer el inventario. [Historias de sprint 1](../../../../docs/user_stories_sprint_1.md).

**Para esta tarea:** Validación de entero positivo explícita en SIG-MEJ-03.2 y conversión a signo del modelo.

La cobertura encontrada es documental y local; no se consultó un tablero externo ni se afirma que esas historias estén terminadas.

### Qué es explícito y qué se estaba suponiendo

**Explícito en las fuentes:** El signo almacenado sigue representando incremento/decremento; el motivo es obligatorio en ajustes. El diseño muestra AJUSTE, selector de operación, fecha no modificable y stock disponible del lote.

**Supuesto o propuesta del primer plan:** Conservar el contrato firmado de registerStockMovement, los nombres de campos de FormData y la traducción de errores son propuestas técnicas. Un límite del entero de almacenamiento es técnico; no fija un máximo comercial de dosis. El fallback de actor existente no demuestra atribución al operador real.

Las etiquetas de los criterios separan obligación explícita, interpretación pendiente y verificación técnica. Proponer tests, un helper o atributos accesibles no crea una regla de negocio nueva ni exige un acuerdo funcional sobre cada detalle técnico.

### Datos faltantes o contradictorios

No se definió un tope comercial ni nuevo movimiento de egreso. El máximo del tipo de almacenamiento solo limita técnicamente; mantener cantidades firmadas de consumidores existentes es propuesta técnica.

**Dudas abiertas relacionadas:** [DU-07](../REVISION.md#du-07), [DU-08](../REVISION.md#du-08), [DU-12](../REVISION.md#du-12). No hay respuestas registradas; no se adopta una opción como regla por defecto.

### Tratamiento de la duda y alcance seguro

No prohibir negativos en todo el dominio: se prohíben en la nueva entrada de UI; los ajustes persistidos pueden ser negativos.

Los criterios condicionados se cierran solo cuando se documenta la definición que falta. Pueden continuar diagnóstico y revisión del comportamiento explícito; las expectativas dudosas no se implementan ni se convierten en pruebas que fijen una regla inventada.

Al completar, registrar evidencia y resultado en este ticket. Para código, indicar commit y comprobaciones realizadas; para definiciones, registrar el acuerdo. No marcar como terminado únicamente por existir código relacionado.

