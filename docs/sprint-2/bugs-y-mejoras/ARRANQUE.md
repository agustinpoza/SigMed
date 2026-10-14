# Qué tickets se pueden arrancar

Fecha: 13/10/2026. Rama: `sprint-2/bugs-y-mejoras`.

**Se puede implementar sin consultas externas el alcance definido de SIG-MEJ-03.1/03.2 y SIG-MEJ-04.1/04.2/04.3, y SIG-BUG-01.2 después de diagnosticar su causa.** También se pueden iniciar las regresiones de aislamiento de SIG-MEJ-02.3. Esto no autoriza completar las partes todavía dudosas ni convierte propuestas en reglas nuevas.

Esta clasificación precisa la [revisión de dudas](REVISION.md): una duda relacionada con un ticket no bloquea automáticamente todo su contenido. Tampoco confundir una dependencia técnica con una confirmación funcional. «Arrancable» no significa aprobado para cerrar todas las US o que se hayan ejecutado pruebas.

## Avance posterior a esta clasificación

SIG-MEJ-01 tiene avance provisorio autorizado en [DEC-004](../../decisiones.md#dec-004--rótulo-provisorio-de-indicaciones-del-historial): columna y detalle «Indicaciones», con Detalle/Cerrar conservados y centralizados en `detailTexts`. SIG-MEJ-01.1 mantiene pendiente la aprobación definitiva; SIG-MEJ-01.2 aplica la alternativa temporal sin darla por aprobada.

SIG-MEJ-02.3 y SIG-MEJ-03.3 tienen su alcance del bloque implementado/verificado con 18 pruebas en PostgreSQL local propio y 105 pruebas previas aprobadas. [Ver evidencia](SIG-MEJ-02.3-03.3-IMPLEMENTACION.md). La sesión real pertenece a otro integrante, conforme a la división indicada por el usuario; [contratos y tres TODO de integración](../INTEGRACION-US-7.2-7.4.md) quedan documentados sin implementar sus US.

SIG-MEJ-02.1/02.2 están completados: matriz y ayuda visible/accesible bajo [DEC-003](../../decisiones.md#dec-003--campos-y-ayuda-de-búsqueda-del-historial). [Ver evidencia](SIG-MEJ-02-IMPLEMENTACION.md). SIG-MEJ-02.3 ya entrega la regresión del servidor; su integración con sesión real queda para el responsable de las US de acceso.

SIG-BUG-02.1/02.2/02.3 están completados para [DEC-002](../../decisiones.md#dec-002--normalización-de-la-búsqueda-del-historial). DU-03/DU-04 ya no bloquean la normalización: se reprodujo el fallo y pasan 39 regresiones del componente, con 105 pruebas totales aprobadas. [Ver evidencia y límites](SIG-BUG-02-IMPLEMENTACION.md). SIG-MEJ-02 conserva matriz/ayuda y aislamiento; no duplicar el matcher común.

SIG-BUG-01.1 tiene diagnóstico completado y SIG-BUG-01.2 está implementado y verificado visualmente con fixtures aislados en los anchos acordados. [Ver causa, capturas y límites](SIG-BUG-01-IMPLEMENTACION.md). [DEC-001](../../decisiones.md#dec-001--alcance-de-la-corrección-visual-sig-bug-01) registra el criterio aplicado; repetir la regresión si US-7.4/2.8 modifica el shell o el contenido médico.

SIG-MEJ-03.1/03.2 ya están implementados con el alcance delimitado; [ver evidencia original](SIG-MEJ-03-IMPLEMENTACION.md). SIG-MEJ-03.3 ya verifica stock real y conserva pendiente la integración externa de sesión.

SIG-MEJ-04.1/04.2/04.3 ya están implementados con el alcance aquí delimitado. [Ver evidencia y verificación](SIG-MEJ-04-IMPLEMENTACION.md). La clasificación siguiente conserva el criterio de inicio; no implica que esas tres tareas todavía carezcan de implementación.

## Implementación sin consulta externa

| Ticket | Trabajo que puede avanzar | Límite o dependencia |
| --- | --- | --- |
| [SIG-BUG-01.2](tickets/SIG-BUG-01.2.md) | Corregir la franja negra, alturas/fondos y recortes según la causa reproducida, preservando la pantalla existente. | Completar SIG-BUG-01.1 es una dependencia técnica, no una aprobación del cliente. DU-01 no impide corregir una causa demostrada. No extender la tarea a rediseñar la interfaz o cambiar funciones médicas. |
| [SIG-MEJ-03.1](tickets/SIG-MEJ-03.1.md) | Agregar Sumar dosis/Descontar dosis para AJUSTE y pedir cantidad positiva, conservando INGRESO y el resto del formulario. | No hace falta resolver DU-07 para este selector. El indicador adicional de stock por lote, su actualización y un comportamiento de preselección no se adoptan como requisitos nuevos. Coordinar el campo de operación con SIG-MEJ-03.2 es trabajo técnico. No agregar el indicador pendiente para cerrar este alcance textual. |
| [SIG-MEJ-03.2](tickets/SIG-MEJ-03.2.md) | Validar entero positivo en la entrada y convertir Sumar a +cantidad y Descontar a -cantidad en el servidor, conservando motivo y movimientos existentes. | SIG-MEJ-03.1 es dependencia de integración. El signo y la positividad están explícitos; no se necesita fijar un máximo comercial nuevo. Mantener cantidades firmadas en el dominio y no cambiar el guard de identidad ni el modelo de stock para resolver otra duda. |
| [SIG-MEJ-04.1](tickets/SIG-MEJ-04.1.md) | Mostrar información de fecha sin horarios y retirar el mensaje al recuperar disponibilidad; distinguir carga o fallo de consulta para no informar falta de cupos falsamente. | No hace falta decidir duración (DU-11), ciclo (DU-09) ni interacción del botón (DU-10) para implementar el mensaje. Mantener sin cambios la interacción del botón mientras siga dudosa; usar un mensaje claro de la fuente sin inventar causas de falta de disponibilidad. |
| [SIG-MEJ-04.2](tickets/SIG-MEJ-04.2.md) | En el servidor distinguir fecha sin cupos de horario no seleccionado cuando sí hay opciones; devolver el mensaje correspondiente e impedir creación inválida. | SIG-MEJ-04.1 es dependencia de integración. La validación del servidor aplica tanto con botón activo como deshabilitado; no requiere decidir DU-10 ni cambiar el ciclo de DU-09. No agregar aprobación automática, estados nuevos, prioridades de todos los errores ni modificar el momento de reserva. La coherencia del ciclo existente queda pendiente fuera de esta corrección de mensajes. |
| [SIG-MEJ-04.3](tickets/SIG-MEJ-04.3.md) | Verificar/corregir actualización por fecha, selección y errores obsoletos, recuperación y respuestas tardías, sobre loadSlots existente. | SIG-MEJ-04.1/04.2 son dependencias técnicas. Mostrar horarios de la última fecha está definido; no depende de decidir duración, feriados o capacidad. No recalcular agenda ni adoptar 30 minutos como regla; trabajar con la disponibilidad que entrega el servicio existente. |

## Prueba de regresión sin consulta externa

| Ticket | Trabajo que puede avanzar | Límite o dependencia |
| --- | --- | --- |
| [SIG-MEJ-02.3](tickets/SIG-MEJ-02.3.md) | Preparar/ejecutar pruebas de pacientes A/B y sesión inválida sobre el historial existente, verificando los datos enviados además de lo visible. | RF-18 y US-5.2 CA2 ya definen el aislamiento. SIG-MEJ-02.2 es dependencia para repetir la regresión al integrar su cambio, no para empezar la prueba base. No definir ni probar como regla nueva el acceso administrativo pendiente en DU-06. No confundir esta regresión con certificar toda la autenticación real. |

## Diagnóstico sin consulta externa

| Ticket | Trabajo que puede avanzar | Límite o dependencia |
| --- | --- | --- |
| [SIG-BUG-01.1](tickets/SIG-BUG-01.1.md) | Reproducir la franja negra y localizar la causa. Elegir tamaños de prueba e inspeccionar CSS son decisiones técnicas. | Ninguna confirmación para investigar. No definir un nuevo tema visual ni soporte de dispositivos como regla. Su resultado habilita SIG-BUG-01.2. |
| [SIG-BUG-02.1](tickets/SIG-BUG-02.1.md) | Diagnóstico completado con fixtures del componente original. | DU-03/DU-04 están definidas en DEC-002; la reproducción local no identifica la consulta histórica del despliegue. |

## Trabajo parcial sin consulta externa

| Ticket | Trabajo que puede avanzar | Límite o dependencia |
| --- | --- | --- |
| [SIG-MEJ-03.3](tickets/SIG-MEJ-03.3.md) | Pruebas de rechazo de stock negativo, descuento exacto, concurrencia, rollback y trazabilidad con actor identificado; traducir el error de stock esperado al formulario si hace falta. | La atribución cuando no hay actor (DU-08) no está resuelta. No validar el fallback como responsable real. SIG-MEJ-03.2 es dependencia para probar la nueva entrada integrada. No cerrar la verificación completa de trazabilidad hasta resolver el caso sin actor; stock e integridad sí pueden avanzar. |

## Textos provisorios con aprobación definitiva pendiente

| Ticket | Trabajo que puede avanzar | Límite o dependencia |
| --- | --- | --- |
| [SIG-MEJ-01.1](tickets/SIG-MEJ-01.1.md) | Alternativa «Indicaciones» registrada como provisoria en DEC-004 por instrucción del usuario. | El acuerdo de texto de DU-02 sigue pendiente para cerrar; no dar la alternativa por aprobada. |
| [SIG-MEJ-01.2](tickets/SIG-MEJ-01.2.md) | Columna y título «Indicaciones» aplicados desde una constante; botones Detalle/Cerrar conservados. | DEC-004 autoriza la implementación temporal. La conformidad definitiva sigue dependiendo de SIG-MEJ-01.1. |

## Coordinación con las US nuevas

[Ver el orden de integración del sprint](../ORDEN-E-INTEGRACION.md). El orden siguiente es práctico para una persona. Selector/acción de stock y mensaje/validación de vacunación pueden desarrollarse en paralelo tras acordar contrato y se verifican juntos. Las pruebas base pueden empezar antes de repetirlas con sesión y permisos reales de US-7.2/7.4. Compartir archivo exige coordinar merges, no necesariamente una precedencia funcional.

## Orden recomendado para implementar

1. **SIG-MEJ-04.1 → SIG-MEJ-04.2 → SIG-MEJ-04.3:** mensaje sin horarios, validación correcta y recuperación al cambiar de fecha. Dejar sin cambios ciclo, duración e interacción dudosa del botón.
2. **SIG-MEJ-03.1 → SIG-MEJ-03.2:** selector de operación y cantidad positiva, con signo interno. Después avanzar solo la parte definida de SIG-MEJ-03.3.
3. **SIG-BUG-01.1 → SIG-BUG-01.2:** reproducir y corregir la franja negra; la investigación previa es técnica y no requiere aprobación del cliente.
4. **SIG-MEJ-02.3:** iniciar la regresión base del aislamiento por paciente ahora y repetirla después de los futuros cambios del buscador.

SIG-BUG-02.1/02.2/02.3 ya están completados con las expectativas definidas en DEC-002; repetir la suite al integrar cambios de campos/ayuda de SIG-MEJ-02.

## Qué queda pendiente de definición

- **SIG-MEJ-01.1/01.2:** rótulo definitivo y textos del botón; alternativa provisoria ya registrada y aplicada mediante DEC-004.
- **Integración externa de SIG-MEJ-02.3/03.3:** sesiones reales y responsable autenticado en US-7.2/7.4; no asumir válido el fallback.

Preparar una propuesta de definición no necesita permiso; lo pendiente es la respuesta para establecer la regla y cerrar la definición. No hay un pedido nuevo de aprobación en esta clasificación.

## Alcance de esta entrega

La clasificación original incorporó una sección de disponibilidad para arrancar en los 16 tickets y distinguió dudas de integración final y dudas del cambio funcional. Los avances posteriores están registrados arriba; DEC-004 permite el texto provisorio sin cerrar la aprobación definitiva ni decidir una regla de negocio pendiente.
