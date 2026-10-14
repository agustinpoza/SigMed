# Revisión de los tickets de Bugs y Mejoras

Fecha: 13/10/2026. Rama: `sprint-2/bugs-y-mejoras`.

Se revisaron los **16 tickets** contra los requerimientos, historias, diseño documental y código existente. La revisión inicial del 13/10/2026 fue documental y estática, sin seleccionar reglas de negocio ni presumir aprobación del cliente. Las implementaciones posteriores se registran en los tickets. Actualización del 14/10/2026: DU-01 tiene criterio y diagnóstico documentados; DU-03/DU-04 tienen política y regresiones de SIG-BUG-02; DU-12 cuenta con registro de decisiones, pero su jerarquía general sigue pendiente.

## Fuentes y criterio de lectura

- [Documento de US, Bugs y Mejoras de sprint 2](../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md): sección 02 define los seis temas y sus tareas; secciones 03/04 identifican observaciones y continuidades a validar.
- [Requerimientos funcionales](../../../docs/requerimientos_funcionales.md): RF-04, RF-11, RF-12, RF-18, RF-26 y RF-31 son los vínculos principales. No asignar RF-05 a la búsqueda del historial ni RF-06 a los mensajes de vacunación.
- [Historias de sprint 1](../../../docs/user_stories_sprint_1.md): US-1.4, US-3.2, US-3.6 y US-5.2 ya cubren las funcionalidades de base y algunas regresiones.
- [Diccionario y desvíos](../../../docs/BD.md): restricciones del lote, movimientos e historial, y desvíos documentados de implementación. El código se usa como evidencia de existencia, no como definición funcional aprobada.
- [Requerimientos no funcionales](../../../docs/requerimientos_no_funcionales.md): RNF-04 respalda sesión/permisos. RNF-06 trata reserva móvil del paciente, no un límite de tiempo para un formulario de enfermería ni una especificación de tema visual.

**Explícito** significa escrito en la fuente identificada; si esa fuente lo presenta como propuesta, conserva ese carácter. **Condicionado/duda** significa definición faltante o contradictoria. **Propuesta técnica/preservación** describe una solución o verificación del plan, sin inventar comportamiento de negocio. La trazabilidad no equivale a declarar una historia terminada.

## Requisito y cobertura por caso

| Tema | Requisito de base y regla específica | Cobertura previa | Diferencia del bloque |
| --- | --- | --- | --- |
| SIG-BUG-01 | RF-04; corrección visual explícita en SIG-BUG-01 | US-1.4.1 | Diagnosticar/corregir franja negra; no agregar acciones médicas |
| SIG-MEJ-01 | RF-18; elección de rótulo pendiente en SIG-MEJ-01 | US-5.2, vista existente | Acordar/aplicar texto, sin agregar contenido de RF-17 |
| SIG-BUG-02 | RF-18 como contexto; acentos/mayúsculas en SIG-BUG-02 | US-5.2 con buscador de diseño | Reproducir política de acentos y corregir lo confirmado |
| SIG-MEJ-02 | RF-18; propuesta de campos/ayuda en SIG-MEJ-02; RNF-04 para acceso | US-5.2.3 y CA2 ya cubren aislamiento | Ajustar alcance y ayuda; aislamiento es regresión, no historia nueva |
| SIG-MEJ-03 | RF-11; entero positivo/operación/signo en SIG-MEJ-03; invariantes del modelo | US-3.2.2, US-3.2.3 y CA2 | Entrada de UI nueva; no duplicar stock, trazabilidad o no negativo |
| SIG-MEJ-04 | RF-12; mensajes CA1–CA4 de SIG-MEJ-04; ciclo RF-31 pendiente | US-3.6.3/3.6.4 | Mensajes y estados sobre flujo existente, no nueva agenda médica |

## Revisión individual

| Ticket | Requisito o regla | Cobertura encontrada | Dudas relacionadas |
| --- | --- | --- | --- |
| [SIG-BUG-01.1](tickets/SIG-BUG-01.1.md) | RF-04 | Diagnóstico de una pantalla ya cubierta, no nuevo requisito. | DU-01, DU-12 |
| [SIG-BUG-01.2](tickets/SIG-BUG-01.2.md) | RF-04 | Corrección del mismo caso de SIG-BUG-01.1; debe usar su evidencia. | DU-01, DU-12 |
| [SIG-BUG-02.1](tickets/SIG-BUG-02.1.md) | RF-18; fuente específica de sprint 2 | Investigación del caso ambiguo de la fuente. | DU-03, DU-04, DU-05, DU-12 |
| [SIG-BUG-02.2](tickets/SIG-BUG-02.2.md) | RF-18; fuente específica de sprint 2 | Normalización del caso que se confirme en SIG-BUG-02.1. | DU-03, DU-04, DU-05, DU-12 |
| [SIG-BUG-02.3](tickets/SIG-BUG-02.3.md) | RF-18; fuente específica de sprint 2 | Pruebas solicitadas en la fuente, con cobertura compartida con SIG-MEJ-02. | DU-03, DU-04, DU-05, DU-12 |
| [SIG-MEJ-01.1](tickets/SIG-MEJ-01.1.md) | RF-18; fuente específica de sprint 2 | Definición explícitamente pedida por la fuente, sin cobertura de texto definitivo en RF-18. | DU-02, DU-12 |
| [SIG-MEJ-01.2](tickets/SIG-MEJ-01.2.md) | RF-18; fuente específica de sprint 2 | Aplicación de un acuerdo, no ampliación clínica de US-5.1. | DU-02, DU-12 |
| [SIG-MEJ-02.1](tickets/SIG-MEJ-02.1.md) | RF-18; fuente específica de sprint 2 | Definición funcional de una ampliación de RF-18. | DU-04, DU-05, DU-06, DU-12 |
| [SIG-MEJ-02.2](tickets/SIG-MEJ-02.2.md) | RF-18; fuente específica de sprint 2 | Ajuste sobre soporte por profesional ya existente. | DU-04, DU-05, DU-06, DU-12 |
| [SIG-MEJ-02.3](tickets/SIG-MEJ-02.3.md) | RF-18; fuente específica de sprint 2 | Regresión explícita de US-5.2.3/CA2, reutilizada después de cambiar el buscador. | DU-04, DU-05, DU-06, DU-12 |
| [SIG-MEJ-03.1](tickets/SIG-MEJ-03.1.md) | RF-11 + modelo de stock | Mejora de entrada sobre US-3.2.2, no nuevo tipo de movimiento. | DU-07, DU-08, DU-12 |
| [SIG-MEJ-03.2](tickets/SIG-MEJ-03.2.md) | RF-11 + modelo de stock | Validación de entero positivo explícita en SIG-MEJ-03.2 y conversión a signo del modelo. | DU-07, DU-08, DU-12 |
| [SIG-MEJ-03.3](tickets/SIG-MEJ-03.3.md) | RF-11 + modelo de stock | Regresión de US-3.2.3/CA2 y reglas de movimiento_stock; no duplicar sus pruebas como nueva funcionalidad. | DU-07, DU-08, DU-12 |
| [SIG-MEJ-04.1](tickets/SIG-MEJ-04.1.md) | RF-12; RF-31 por aclarar | Estado vacío documentado para la UI existente de US-3.6.3. | DU-09, DU-10, DU-11, DU-12 |
| [SIG-MEJ-04.2](tickets/SIG-MEJ-04.2.md) | RF-12; RF-31 por aclarar | Validación de mensaje documentada, con conservación de restricciones de RF-12. | DU-09, DU-10, DU-11, DU-12 |
| [SIG-MEJ-04.3](tickets/SIG-MEJ-04.3.md) | RF-12; RF-31 por aclarar | Verificación y ajuste de US-3.6.3, no segunda implementación de loadSlots. | DU-09, DU-10, DU-11, DU-12 |

Cada ticket contiene fuentes concretas, explícitos, supuestos del plan, datos faltantes y tratamiento de la duda. No se generaron tickets duplicados ni tareas nuevas para completar las US del resto del equipo.

## Alcance de las dudas al iniciar trabajo

[La clasificación de arranque](ARRANQUE.md) delimita las partes implementables sin consulta externa. Una duda relacionada no implica que el ticket completo necesite confirmación: por ejemplo, se pueden corregir mensajes de vacunación sin decidir su ciclo o duración. Las definiciones de campos, equivalencias y rótulos sí condicionan los cambios correspondientes. Las dependencias con otras implementaciones pueden ser necesarias para la integración final sin impedir preparar pruebas del comportamiento existente.

## Registro de dudas

Las entradas conservan las preguntas de la revisión original y registran su resolución cuando existe. DU-01 está definida para SIG-BUG-01 mediante DEC-001; DU-03/DU-04 para SIG-BUG-02 mediante DEC-002. DU-12 avanza en el registro de decisiones. Las demás conservan los pendientes indicados en su entrada. Una duda solo afecta a la parte del ticket que depende de su definición.

## DU-01

**Reproducción y alcance visual**

**Fuente:** [Documento de US, Bugs y Mejoras de sprint 2](../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md), SIG-BUG-01; [image4.png](../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.assets/image4.png); RF-04 y US-1.4.

**Dato faltante o contradicción:** Existe captura de la franja negra, pero no versión de código/despliegue reproducible, zoom ni tema del caso. La fuente pide varios tamaños sin fijarlos ni definir soporte de modo oscuro.

**Duda:** ¿En qué navegador, tamaño, tema y versión ocurrió? ¿Cuál es la referencia visual del área médica? No se requiere decidir un tema nuevo para diagnosticar la franja.

**Tratamiento:** SIG-BUG-01.1 registra reproducción/causa. SIG-BUG-01.2 usa altura mínima de ventana y adaptación de filtros, sin eliminar la regla global de tema ni modificar funciones médicas.

**Resolución para estos tickets (14/10/2026):** criterio DU-01 propuesto por el usuario y aplicado por su solicitud de implementar/resolver SIG-BUG-01.1/01.2. Chrome, anchos 360/768/1280 px, sin franja negra ni contenido inaccesible por recortes; no agregar modo oscuro. [DEC-001](../../decisiones.md#dec-001--alcance-de-la-corrección-visual-sig-bug-01) registra fuente y responsables. Se documenta la causa local: portal de altura porcentual sobre padre sin altura definida, exposición del fondo del body y desbordamiento de filtros. [Ver evidencia](SIG-BUG-01-IMPLEMENTACION.md). Las condiciones exactas del despliegue original permanecen desconocidas; no impiden verificar esta corrección en el alcance acordado.

## DU-02

**Texto definitivo del detalle clínico**

**Fuente:** [Documento de US, Bugs y Mejoras de sprint 2](../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md), SIG-MEJ-01; RF-18.

**Dato faltante o contradicción:** Se mencionan Observaciones, Diagnóstico, Indicaciones y Detalle clínico. La fuente indica aprobación pendiente; no hay texto definitivo ni constancia del acuerdo. El detalle del código contiene indicaciones y la tabla ya tiene columna Diagnóstico.

**Duda:** ¿Qué rótulo llevará la columna y qué textos abrirán/cerrarán el detalle? ¿Quién valida la decisión y cuándo?

**Tratamiento:** Resolver en SIG-MEJ-01.1 antes del cambio de SIG-MEJ-01.2. No elegir un nombre por cuenta del plan ni agregar contenido clínico para que el nombre parezca correcto.

**Resolución:** pendiente. Al resolver, registrar decisión, fuente/evidencia, responsable y fecha; hasta entonces no adoptar una opción como regla de negocio.

## DU-03

**Consulta exacta del caso con y sin tilde**

**Fuente:** [Documento de US, Bugs y Mejoras de sprint 2](../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md), SIG-BUG-02 descripción y CA1/CA2.

**Dato faltante o contradicción:** La descripción escribe «infección» al decir sin tilde y CA1 vuelve a usar «infección»/«Infección», ambas con tilde. La intención de normalizar acentos aparece en las tareas, pero el ejemplo exacto es inconsistente y el estado dice posible bug sujeto a verificación.

**Duda:** ¿La consulta fallida fue infeccion u otra cadena? ¿Cuál es el dato del diagnóstico y resultado esperado exacto?

**Tratamiento:** SIG-BUG-02.1 registra el fallo del componente original y los controles alta/ALTA que funcionan. No se presume conocer la consulta histórica del despliegue.

**Resolución (14/10/2026):** criterio DU-03 del usuario y solicitud de implementar/resolver SIG-BUG-02. [DEC-002](../../decisiones.md#dec-002--normalización-de-la-búsqueda-del-historial) define que infeccion/infección/INFECCIÓN devuelven los mismos registros. Se reprodujo el fallo con fixtures y se verificó la corrección; [ver evidencia](SIG-BUG-02-IMPLEMENTACION.md). Responsable del alcance: usuario; ejecución: Codex.

## DU-04

**Equivalencias y forma de buscar nombres**

**Fuente:** [Documento de US, Bugs y Mejoras de sprint 2](../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md), SIG-BUG-02 y SIG-MEJ-02; código del buscador.

**Dato faltante o contradicción:** No se define ñ/n, diéresis u otras equivalencias lingüísticas, búsqueda por varios términos ni orden Nombre Apellido frente a Apellido, Nombre. El código solo usa texto unido, minúsculas y coincidencia parcial. Unicode compuesto/descompuesto es un caso técnico, no una política de equivalencia lingüística aprobada.

**Duda:** ¿Qué equivalencias se requieren además del caso confirmado de tildes? ¿Debe funcionar el nombre completo en ambos órdenes o basta coincidencia por nombre/apellido?

**Tratamiento:** Registrar la política común de SIG-BUG-02 y reutilizarla en SIG-MEJ-02; no duplicar normalizaciones ni cambiar textos originales.

**Resolución (14/10/2026):** criterio DU-04 del usuario aplicado por esta solicitud y registrado en [DEC-002](../../decisiones.md#dec-002--normalización-de-la-búsqueda-del-historial): NFD, eliminación de diacríticos y minúsculas, con ñ≡n y ü≡u. Espacios/comas separan términos; todos coinciden en los campos de una misma atención, en cualquier orden. Los casos de nombre completo, Unicode y exclusión están verificados en la suite del componente. Responsable del alcance: usuario; ejecución: Codex.

## DU-05

**Tres campos propuestos frente a seis implementados**

**Fuente:** [Documento de US, Bugs y Mejoras de sprint 2](../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md), SIG-MEJ-02 y diseño de SIG-BUG-02; [image10.png](../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.assets/image10.png); RF-18.

**Dato faltante o contradicción:** La ayuda propuesta enumera profesional, diagnóstico y tratamiento. El código además busca fecha, especialidad e indicaciones. RF-18 no define búsqueda en esos seis campos ni el formato de fecha buscable. Conservar seis fue una propuesta del plan.

**Duda:** ¿Cuál es la lista definitiva de campos? ¿La ayuda enumera todos o solo los principales? Si fecha queda incluida, ¿qué formato se admite?

**Tratamiento:** SIG-MEJ-02.1 registra matriz de campos/ejemplos; SIG-MEJ-02.2 entrega la ayuda. En SIG-BUG-02 se conservan y normalizan los seis campos actuales y la fecha mostrada, conforme al criterio propuesto por el usuario y DEC-002, sin dar por entregada esa matriz/ayuda. No hay campos nuevos ni otra tarea de ayuda duplicada.

**Resolución parcial (14/10/2026):** DEC-002 registra la conservación de los seis campos y de la fecha visible para esta corrección. La matriz y el texto de ayuda de SIG-MEJ-02 siguen pendientes de entrega; esta implementación no los completa ni declara aprobada una ayuda inexistente.

## DU-06

**Acceso administrativo al historial**

**Fuente:** RF-18, RF-26, RNF-04; US-5.2 CA2 y US-7.5 en [Documento de US, Bugs y Mejoras de sprint 2](../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md).

**Dato faltante o contradicción:** El paciente debe ver solo su historial. RF-26/US-7.5 permiten al administrador funciones médicas y de paciente, pero no precisan qué historias consultar, cómo seleccionar paciente ni alcance de lectura. El código actual acepta solo rol PACIENTE en esta ruta.

**Duda:** ¿Qué acceso clínico está autorizado para el administrador y bajo qué selección de paciente/auditoría? ¿Existe ya esa matriz en el trabajo de US-7.5?

**Tratamiento:** SIG-MEJ-02.3 verifica aislamiento de pacientes, que sí es explícito. Consultar definición de US-7.5 sin presumir acceso a todos los historiales ni prohibición absoluta; no implementar permisos nuevos aquí.

**Resolución:** pendiente. Al resolver, registrar decisión, fuente/evidencia, responsable y fecha; hasta entonces no adoptar una opción como regla de negocio.

## DU-07

**Diseño del ajuste de stock y significado de disponible**

**Fuente:** [Documento de US, Bugs y Mejoras de sprint 2](../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md), SIG-MEJ-03; [image6.png](../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.assets/image6.png); US-3.2; [Diccionario y desvíos](../../../docs/BD.md), lote/movimiento_stock y D-03.

**Dato faltante o contradicción:** El diseño muestra stock disponible del lote y operación elegida; los tres tickets textuales no aclaran cómo se consulta/refresca ese indicador ni qué operación queda por defecto. La cantidad del lote en el código ya descuenta dosis asignadas; no es necesariamente todo el inventario físico presente.

**Duda:** ¿El indicador por lote forma parte de esta mejora? ¿Qué se muestra sin lote seleccionado o si cambia el stock? ¿Debe preseleccionarse operación? Confirmar que disponible conserva la definición del modelo y no inventa un segundo saldo físico.

**Tratamiento:** SIG-MEJ-03.1 registra alcance del indicador y comportamiento de selección. Los valores 37/9 de la imagen son ejemplos. El límite ≥ 0 y el delta por movimiento ya están definidos; no reabrirlos ni asumir nuevos máximos comerciales.

**Resolución:** pendiente. Al resolver, registrar decisión, fuente/evidencia, responsable y fecha; hasta entonces no adoptar una opción como regla de negocio.

## DU-08

**Identidad del responsable de movimientos de stock**

**Fuente:** RF-11, US-3.2 CA2, RNF-04 y [Diccionario y desvíos](../../../docs/BD.md), movimiento_stock; [actor-guard.ts](../../../src/lib/actor-guard.ts).

**Dato faltante o contradicción:** La trazabilidad exige usuario/fecha/lote. Si falta actor, el guard actual selecciona un primer perfil enfermera/administrador; no es evidencia de operador autenticado ni de quién hizo la acción. No se encontró una regla de negocio que autorice atribuirlo automáticamente a otra persona.

**Duda:** ¿El fallback está previsto solo como mecanismo de prueba? ¿Qué definición de sesión/identidad acordada por US-7.2/7.4 debe usarse para un movimiento real?

**Tratamiento:** SIG-MEJ-03.3 debe registrar esta divergencia y verificar atribución real. No validar la auditoría por la sola presencia de actorId; coordinar autenticación con sus responsables. No se declara vulneración en un despliegue sin probar el flujo.

**Resolución:** pendiente. Al resolver, registrar decisión, fuente/evidencia, responsable y fecha; hasta entonces no adoptar una opción como regla de negocio.

## DU-09

**Solicitud pendiente frente a aprobación directa de vacunación**

**Fuente:** RF-12, RF-31, US-3.6 y [Diccionario y desvíos](../../../docs/BD.md), turno_vacunacion; [vaccination.ts](../../../src/lib/vaccination.ts).

**Dato faltante o contradicción:** RF-31 pide registrar pendiente y aprobar/rechazar después; su texto usa Confirmado, mientras el modelo usa APROBADO. El código crea APROBADO y registra/resuelve en la misma acción. RF-12 y US-3.6 permiten descontar o reservar; el modelo concreta -1 al aprobar. Falta constancia de acuerdo sobre el atajo actual.

**Duda:** ¿Confirmar turno crea una solicitud, la aprueba o representa ambas operaciones? ¿Se exige persistir PENDIENTE? ¿Qué nomenclatura de estado y momento de reserva están vigentes?

**Tratamiento:** Coordinar con responsables de RF-31/US-3.6 antes de validar el ciclo. SIG-MEJ-04.2 corrige mensajes, no inventa ni cambia esa regla. La nueva definición puede alterar integración/esfuerzo; dejarla pendiente en el plan.

**Resolución:** pendiente. Al resolver, registrar decisión, fuente/evidencia, responsable y fecha; hasta entonces no adoptar una opción como regla de negocio.

## DU-10

**Confirmación deshabilitada frente a intento de envío sin cupos**

**Fuente:** [Documento de US, Bugs y Mejoras de sprint 2](../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md), SIG-MEJ-04 descripción y CA2/CA4; [image13.png](../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.assets/image13.png).

**Dato faltante o contradicción:** El texto describe el intento de confirmar y pide un mensaje correcto; la imagen muestra Confirmar turno deshabilitado. Tampoco define prioridad de mensajes cuando faltan paciente/vacuna/fecha ni texto de fallo de consulta. La fuente da el mensaje sin cupos como ejemplo, no literal obligatorio.

**Duda:** ¿El botón queda deshabilitado sin horarios o permite intentar para mostrar la validación? ¿Qué se presenta ante errores simultáneos o consulta fallida?

**Tratamiento:** Registrar la decisión UX para SIG-MEJ-04.1/04.2. En cualquier variante el servidor impide una operación inválida; no decidir prioridad de todos los mensajes por cuenta propia. Falta de consulta no demuestra falta de cupos.

**Resolución:** pendiente. Al resolver, registrar decisión, fuente/evidencia, responsable y fecha; hasta entonces no adoptar una opción como regla de negocio.

## DU-11

**Duración y causas de falta de disponibilidad**

**Fuente:** [Documento de US, Bugs y Mejoras de sprint 2](../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md), sección 03; RF-01/RF-12; [Diccionario y desvíos](../../../docs/BD.md), medico/horario_vacunacion.

**Dato faltante o contradicción:** La observación dice que se conversaron 60 minutos de consulta y 30 de vacunación, pero hay opciones 15/20/30/60. El modelo solo exige duración > 0. Un resultado de horarios vacío no explica por sí solo si no hay franja, todo está ocupado o no hay futuros dentro del día.

**Duda:** ¿Qué duración rige y quién la valida? ¿La mejora debe distinguir causas de día sin horarios o alcanza el mensaje genérico de la sección 02?

**Tratamiento:** Mantener la duda de duración en responsables de agenda/vacunación sin convertir 60/30 en constante ni nueva tarea de este bloque. SIG-MEJ-04.3 trabaja sobre la disponibilidad definida, no modifica capacidad, feriados ni duración.

**Resolución:** pendiente. Al resolver, registrar decisión, fuente/evidencia, responsable y fecha; hasta entonces no adoptar una opción como regla de negocio.

## DU-12

**Autoridad documental y decisiones del plan**

**Fuente:** [Documento de US, Bugs y Mejoras de sprint 2](../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md), sección 04; [Diccionario y desvíos](../../../docs/BD.md), desvíos; [Plan técnico de sprint 1](../../../implementacion-ia/plan-sprint-1.md).

**Dato faltante o contradicción:** No hay jerarquía de aprobación entre documentos, wireframes y decisiones de implementación. El plan técnico mantiene estados antiguos; la existencia de código no prueba aceptación. D-03 documenta la caché materializada frente al stock derivado, por lo que esa diferencia no se presenta como una regla nueva ni como contradicción sin explicación.

**Duda:** ¿Qué versión y acuerdos se usan para cerrar cada duda? ¿Dónde se registra la aprobación de los cambios? La prioridad P1/P2, 31 h y margen del primer plan no están aprobados por la fuente.

**Tratamiento:** Cada decisión debe registrar fuente, responsable y fecha. No elegir una regla solo porque está implementada o en un archivo más reciente. Las estimaciones, dependencias entre tareas y herramientas son propuestas de planificación y se reestiman al aclarar dudas.

**Resolución parcial (14/10/2026):** se creó [docs/decisiones.md](../../decisiones.md) y se registró DEC-001 con fuente, alcance, responsable y fecha. La jerarquía general y la autoridad para aprobar contradicciones entre requisitos siguen pendientes; esta entrada no las resuelve por inferencia.

## DU-13

**Disponibilidad mensual frente a carga inicial y edición administrativa**

**Fuente:** documento de sprint 2, US-1.1; RF-01/RF-27; US-1.5 existente; docs/BD.md, horario_atencion y desvío D-08; src/lib/agenda.ts.

**Dato faltante o contradicción:** US-1.1 permite al médico definir disponibilidad mensual. RF-27 dice que el médico carga horarios una sola vez y luego solo el administrador puede modificarlos. El modelo actual representa franjas semanales y D-08 eliminó vigencias; no se define cómo representar cambios por mes sin afectar turnos existentes.

**Duda:** ¿Qué operación mensual puede realizar el médico, cuál queda reservada al administrador y cómo se representa la vigencia? ¿US-1.1 amplía o sustituye parte de la regla anterior?

**Tratamiento:** resolver con responsables de US-1.1/1.5 y análisis antes de integrar persistencia/publicación. No adaptar el helper exclusivo de administrador quitando su permiso ni inventar meses, recurrencias o cancelaciones. Bugs y Mejoras no implementa esta definición.

**Resolución:** pendiente; registrar decisión, fuente, responsable y fecha.

## DU-14

**Creación de reserva previa y estados que ocupan horario médico**

**Fuente:** documento de sprint 2, US-1.2/2.1/2.2; RF-05/RF-06; docs/BD.md, sección 0.1 y turno; prisma/schema.prisma, AppointmentState.

**Dato faltante o contradicción:** US-2.1 busca horarios y US-2.2 confirma una reserva existente, pero no queda claramente asignada la creación de esa reserva ni el responsable de implementarla. El diccionario enumera reservado/cancelado/atendido/ausente y el esquema incluye también CONFIRMADO; el cálculo descrito de ocupación omite ese estado. No se encontró una matriz completa y coherente de transiciones médicas.

**Duda:** ¿Qué tarea crea la reserva al seleccionar el horario y quién la implementa? ¿Cuáles son las transiciones válidas y qué estados excluyen un horario de la oferta? ¿Existe ya un acuerdo que complete esa frontera entre búsqueda y confirmación?

**Tratamiento:** definir contrato/responsable antes de integrar US-1.2/2.1/2.2. No asignar automáticamente la reserva a US-2.1 o US-2.2 ni inventar caducidad, nuevos estados, pagos o confirmaciones automáticas. Los fixtures solo usan estados cuya validez esté establecida.

**Resolución:** pendiente; registrar decisión, fuente, responsable y fecha.

## DU-15

**Contrato de cuenta, perfil, rol y sesión; primer administrador real**

**Fuente:** documento de sprint 2, US-7.1/7.2/7.3/7.4; RF-22/23/24/25; prisma/schema.prisma, UserProfile; src/lib/dev-actor.ts y prisma/seed.ts.

**Dato faltante:** las historias requieren altas, sesiones y permisos integrados. La implementación actual usa actor de desarrollo y el seed incluye identificadores sintéticos; eso no demuestra cuentas autenticables ni un primer administrador válido para registrar personal. No consta en los tickets nuevos un contrato de provisión/cuenta/perfil o procedimiento acordado de alta inicial.

**Duda:** ¿Cómo se vinculan cuenta y perfil, se conserva/asigna el rol y se obtiene identidad válida? ¿Qué administrador real habilita US-7.3 y cómo se provisiona? ¿Hay una decisión de autenticación vigente que cubra ese contrato?

**Tratamiento:** acordar interfaz con responsables de US-7.1/7.2/7.3/7.4. Pueden desarrollar sobre ese contrato sin exigir una dependencia circular entre registro y login. No elegir proveedor nuevo ni inventar una cuenta administrativa desde este plan; no validar seguridad real con el selector de desarrollo.

**Resolución:** pendiente; registrar decisión, fuente, responsable y fecha. Estas tres dudas adicionales corresponden a la revisión del orden entre US, no crean tareas nuevas del bloque del usuario.

## Ajustes efectuados al primer plan

- Se identificaron como propuestas los tamaños de ventana, controles de carga, solución de normalización, contrato del formulario y elección de herramienta de tests.
- Se retiró la propuesta de preservar ñ/n como resultado implícito; queda duda. El caso infeccion → Infección se mantiene como interpretación por confirmar, no criterio definitivo.
- Se retiró la conservación automática de seis campos del buscador como alcance aprobado. El rótulo y los nombres completos quedan condicionados a sus definiciones.
- Se acotó «rechazar negativos» a la nueva entrada positiva de UI: el modelo de movimientos sí admite ajustes negativos.
- Se agregó fecha y responsable real a la verificación de trazabilidad; se registró el fallback de identidad como divergencia a revisar, no autorización válida por defecto.
- Se registraron el indicador visual de stock por lote omitido, la interacción del botón sin cupos y el ciclo pendiente/aprobado. No se implementó ninguno para resolver la ambigüedad.
- Los permisos del administrador se coordinan con US-7.5 sin inventar acceso universal ni prohibición absoluta.
- Las 31 h iniciales y el margen siguen siendo orientativos; no estiman como definidos los cambios de ciclo, indicador o reglas pendientes.

## Conflicto transversal fuera del alcance de estos tickets

RNF-02 dice al menos 50 usuarios simultáneos en el resumen y 30 como nivel planificado en su planilla ([Requerimientos no funcionales](../../../docs/requerimientos_no_funcionales.md)). No se adopta ninguno como umbral de las pruebas de stock o vacunación. Las pruebas concurrentes de este bloque preservan integridad y no demuestran cumplimiento de una carga global sin definir. La discrepancia requiere aclaración con el responsable de ese RNF, sin agregar su implementación a Bugs y Mejoras.

## Criterio de cierre de la revisión

Los 16 tickets tienen mapeo a requisitos/historias, clasificación de cobertura existente, dudas y supuestos separados. La revisión no cierra los tickets funcionales: no hay pruebas de runtime ni acuerdos nuevos registrados. Cuando llegue una definición, actualizar duda y criterio condicionado juntos, manteniendo su fuente y evitando cambiar reglas vecinas por inferencia.
