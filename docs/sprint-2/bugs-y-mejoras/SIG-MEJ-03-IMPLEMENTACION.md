# SIG-MEJ-03.1 y SIG-MEJ-03.2 — Implementación y verificación

Fecha: 14/10/2026. Rama: sprint-2/bugs-y-mejoras. Base: b765674. Implementación y verificaciones locales; sin publicación.

## Resultado y contrato de formulario

Se implementaron [SIG-MEJ-03.1](tickets/SIG-MEJ-03.1.md) y [SIG-MEJ-03.2](tickets/SIG-MEJ-03.2.md).

| Campo o caso | Comportamiento |
| --- | --- |
| movementType=INGRESO | Conserva recepción de dosis positivas; no incluye selección de ajuste |
| movementType=AJUSTE | Exige elegir Sumar dosis o Descontar dosis |
| operation=SUMAR y quantity=5 | La acción envía +5 al dominio como AJUSTE |
| operation=DESCONTAR y quantity=5 | La acción envía -5 al dominio como AJUSTE |
| operation ausente/inválida en AJUSTE | Error visible y ninguna llamada a la mutación |
| operation enviada en INGRESO | Rechazo por operación incompatible, sin descuento oculto |
| quantity vacía, cero, negativa o decimal | Rechazo del servidor, incluso con envío manipulado |
| quantity mayor que 2147483647 | Rechazo por rango técnico del INTEGER de la columna, no un límite comercial nuevo |
| AJUSTE sin motivo | Mantiene el error obligatorio existente |
| Error de validación, permiso o dominio | Conserva entrada positiva, operación y demás datos para corregir/reintentar |
| Cambio de tipo | Elimina la operación anterior; al volver a AJUSTE se requiere una elección explícita |
| Cancelar / envío exitoso | Limpia formulario y operación; el éxito presenta confirmación sin números negativos |
| Envío pendiente | Bloquea controles y dobles envíos hasta terminar |

Los controles de operación son radios con leyenda y etiquetas; errores asociados y anunciados mediante role=alert. La cantidad conserva ayuda accesible y límites HTML, respaldados por validación del servidor.

## Archivos

- [Formulario](../../../src/app/%28portal%29/enfermera/inventario/movement-form.tsx): selección explícita, datos controlados, errores asociados, cancelación y preservación de valores. El envío programático con useActionState evita el reseteo automático de controles no controlados después de una respuesta con errores.
- [Acción](../../../src/app/%28portal%29/enfermera/inventario/actions.ts): valida operación/magnitud, calcula el signo una vez y conserva valores positivos y motivo.
- [Límite de entrada](../../../src/lib/stock-input.ts): constante técnica del INTEGER compartida por HTML y acción. No modifica el esquema ni fija cantidad máxima comercial.
- [Pruebas de acción](../../../src/app/%28portal%29/enfermera/inventario/actions.test.ts) y [Pruebas integradas de formulario/acción](../../../src/app/%28portal%29/enfermera/inventario/movement-form.test.tsx): casos válidos, manipulados, límites, errores, reintentos y cambios de tipo.
- [Comandos](../../../package.json): test:stock-form para inventario y test para todas las suites existentes. Se reutilizó Vitest/Testing Library/jsdom; no se instalaron dependencias nuevas.

## Validación ejecutada

| Comprobación | Resultado |
| --- | --- |
| npm.cmd test | 66 aprobadas: 27 de acción de stock, 11 de formulario de stock y 28 regresiones de vacunación |
| npm.cmd run typecheck | Aprobado |
| npm.cmd run lint | Sin errores; un aviso preexistente en el buscador de pacientes de vacunación |
| npm.cmd run build | Compilación, chequeo de tipos y generación de páginas aprobados |
| git diff --check | Aprobado |

Las pruebas del formulario ejecutan la acción real y simulan únicamente el guard, registerStockMovement y revalidación. Se verifica el delta que recibe el contrato de persistencia, no se crean movimientos en la base compartida. Las pruebas de acción cubren ambos signos, ingreso, operación incompatible/ausente, cantidades inválidas, rango INTEGER, motivo, identidad rechazada y reintento sin invertir el signo ni duplicar la llamada.

La suite no valida transacciones reales, saldos, alertas o concurrencia del trigger; eso pertenece al cierre de [SIG-MEJ-03.3](tickets/SIG-MEJ-03.3.md). No se ejecutaron db:verify, seeds ni migraciones como parte de esta implementación.

## Alcance que continúa pendiente

- SIG-MEJ-03.3: integración real de stock, rechazo amigable de saldo insuficiente, auditoría y concurrencia.
- DU-07: indicador adicional de stock disponible por lote y su actualización. No se agregó a partir de una suposición.
- DU-08: actor real y fallback del guard. No se cambió ni se dio por validada esa atribución.
- No se modificaron registerStockMovement, sus cantidades firmadas, los tipos de movimiento persistidos ni las salidas/devoluciones por turnos.

Las casillas de los dos tickets se marcan según la cobertura aislada de su alcance definido. Validación con datos/usuarios reales y cierre completo del bloque de stock permanecen separados.

## Verificación manual pendiente

En un entorno de prueba con usuario válido: seleccionar ajuste, elegir Sumar o Descontar, ingresar un entero positivo y un motivo; revisar mensaje y movimiento firmado del lote. Forzar error de lote para comprobar preservación de campos; cambiar a Ingreso y verificar que no se envíe operación de descuento. No usar la base compartida para generar movimientos solo como prueba.
