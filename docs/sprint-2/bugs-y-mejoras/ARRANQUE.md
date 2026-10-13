# Qué tickets se pueden arrancar

Fecha: 13/10/2026. Rama: `sprint-2/bugs-y-mejoras`.

**Se puede implementar sin consultas externas el alcance definido de SIG-MEJ-03.1/03.2 y SIG-MEJ-04.1/04.2/04.3, y SIG-BUG-01.2 después de diagnosticar su causa.** También se pueden iniciar las regresiones de aislamiento de SIG-MEJ-02.3. Esto no autoriza completar las partes todavía dudosas ni convierte propuestas en reglas nuevas.

Esta clasificación precisa la [revisión de dudas](REVISION.md): una duda relacionada con un ticket no bloquea automáticamente todo su contenido. Tampoco confundir una dependencia técnica con una confirmación funcional. «Arrancable» no significa aprobado para cerrar todas las US o que se hayan ejecutado pruebas.

## Avance posterior a esta clasificación

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
| [SIG-BUG-02.1](tickets/SIG-BUG-02.1.md) | Probar cadenas con/sin tilde y mayúsculas con datos controlados; documentar resultado actual y la inconsistencia del ejemplo. | Ninguna confirmación para reproducir. La investigación no decide equivalencias de ñ/n ni nuevos campos. La corrección funcional de SIG-BUG-02.2 conserva sus definiciones pendientes. |

## Trabajo parcial sin consulta externa

| Ticket | Trabajo que puede avanzar | Límite o dependencia |
| --- | --- | --- |
| [SIG-BUG-02.3](tickets/SIG-BUG-02.3.md) | Preparar fixtures y cubrir la insensibilidad a mayúsculas explícita, además de preservación técnica de filtros/paginación existentes. | Los resultados esperados de tildes, ñ/n y campos nuevos siguen pendientes de SIG-BUG-02.1/02.2 y DU-04/DU-05. No cerrar la regresión del bug completo ni inventar resultados para las pruebas pendientes. |
| [SIG-MEJ-03.3](tickets/SIG-MEJ-03.3.md) | Pruebas de rechazo de stock negativo, descuento exacto, concurrencia, rollback y trazabilidad con actor identificado; traducir el error de stock esperado al formulario si hace falta. | La atribución cuando no hay actor (DU-08) no está resuelta. No validar el fallback como responsable real. SIG-MEJ-03.2 es dependencia para probar la nueva entrada integrada. No cerrar la verificación completa de trazabilidad hasta resolver el caso sin actor; stock e integridad sí pueden avanzar. |

## Definición pendiente antes de implementar

| Ticket | Trabajo que puede avanzar | Límite o dependencia |
| --- | --- | --- |
| [SIG-BUG-02.2](tickets/SIG-BUG-02.2.md) | Se puede revisar técnicamente el filtro, pero no dar por definitiva una política general de normalización. | Resolver DU-03/DU-04 para el caso esperado y sus equivalencias; coordinar DU-05 si el cambio alcanza otros campos. No elegir un algoritmo que fije una regla lingüística no definida solo para poder terminar el ticket. |
| [SIG-MEJ-01.1](tickets/SIG-MEJ-01.1.md) | Preparar alternativas de rótulo y registrar por qué representan el contenido. | Hace falta el acuerdo de texto de DU-02 para cerrar; la preparación puede empezar sin pedir permiso. No aplicar una alternativa como definitiva. |
| [SIG-MEJ-01.2](tickets/SIG-MEJ-01.2.md) | El cambio de texto queda preparado, sin seleccionar todavía rótulo ni texto del botón. | SIG-MEJ-01.1 / DU-02: acuerdo de textos expresamente pendiente en la fuente. Implementar después del acuerdo. |
| [SIG-MEJ-02.1](tickets/SIG-MEJ-02.1.md) | Inventariar los seis campos del código y los tres del diseño; preparar matriz de ejemplos y dudas. | Resolver DU-04/DU-05 sobre campos y forma de nombres para cerrar. No se necesita permiso para preparar la matriz. No tomar la presencia de código como aprobación de seis campos. |
| [SIG-MEJ-02.2](tickets/SIG-MEJ-02.2.md) | No aplicar ayuda definitiva ni ampliar la búsqueda a partir de supuestos. | SIG-MEJ-02.1 y las equivalencias relevantes de SIG-BUG-02.2: campos, ayuda y comportamiento por profesional. La ayuda que enumera tres campos no resuelve por sí sola el alcance actual de seis. |

## Coordinación con las US nuevas

[Ver el orden de integración del sprint](../ORDEN-E-INTEGRACION.md). El orden siguiente es práctico para una persona. Selector/acción de stock y mensaje/validación de vacunación pueden desarrollarse en paralelo tras acordar contrato y se verifican juntos. Las pruebas base pueden empezar antes de repetirlas con sesión y permisos reales de US-7.2/7.4. Compartir archivo exige coordinar merges, no necesariamente una precedencia funcional.

## Orden recomendado para implementar

1. **SIG-MEJ-04.1 → SIG-MEJ-04.2 → SIG-MEJ-04.3:** mensaje sin horarios, validación correcta y recuperación al cambiar de fecha. Dejar sin cambios ciclo, duración e interacción dudosa del botón.
2. **SIG-MEJ-03.1 → SIG-MEJ-03.2:** selector de operación y cantidad positiva, con signo interno. Después avanzar solo la parte definida de SIG-MEJ-03.3.
3. **SIG-BUG-01.1 → SIG-BUG-01.2:** reproducir y corregir la franja negra; la investigación previa es técnica y no requiere aprobación del cliente.
4. **SIG-MEJ-02.3:** iniciar la regresión base del aislamiento por paciente ahora y repetirla después de los futuros cambios del buscador.

SIG-BUG-02.1 también puede investigarse ahora. SIG-BUG-02.3 puede preparar regresiones de comportamiento explícito, pero no fijar expectativas de equivalencias pendientes.

## Qué queda pendiente de definición

- **SIG-MEJ-01.1/01.2:** rótulo definitivo y textos del botón.
- **SIG-MEJ-02.1/02.2:** lista de campos, ayuda y forma de buscar nombres; el código existente no reemplaza esa definición.
- **SIG-BUG-02.2:** caso esperado y alcance de la normalización. No elegir política de ñ/n ni equivalencias adicionales por defecto.
- **Parte de SIG-MEJ-03.3:** responsable real cuando no hay actor; no asumir válido el fallback.
- **Parte de SIG-BUG-02.3:** resultados esperados de los casos no definidos.

Preparar una propuesta de definición no necesita permiso; lo pendiente es la respuesta para establecer la regla y cerrar la definición. No hay un pedido nuevo de aprobación en esta clasificación.

## Alcance de esta entrega

Los 16 tickets incorporan una sección de disponibilidad para arrancar. Se conservaron las dudas y dependencias; se explicó cuáles son de integración final y cuáles afectan el cambio funcional. No se implementaron cambios en la aplicación, no se cerraron tickets y no se decidió una regla de negocio pendiente.
