# Sprint 2 — Plan de Bugs y Mejoras

Fecha de elaboración: 13/10/2026. Responsable del bloque: usuario.

**Rama de trabajo:** `sprint-2/bugs-y-mejoras`, creada desde `main`. El trabajo actual sigue siendo sprint 1; esta planificación prepara el sprint 2.

**Resultado:** 6 temas padre (2 bugs y 4 mejoras), desglosados en 16 tickets locales, uno por cada tarea de la sección 02 del [documento de análisis](../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md). Los IDs coinciden con la fuente para conservar trazabilidad. Los temas padre son agrupadores, no tickets adicionales ni esfuerzo sumado dos veces. No se implementaron cambios funcionales ni se publicaron tickets en una plataforma externa.

## Avance de implementación

SIG-MEJ-01 tiene avance provisorio por instrucción del usuario: «Indicaciones» en columna y detalle, desde una constante de textos que conserva Detalle/Cerrar. [DEC-004](../../decisiones.md#dec-004--rótulo-provisorio-de-indicaciones-del-historial) registra su carácter temporal. La aprobación definitiva y DU-02 siguen pendientes; los tickets no se declaran cerrados por aplicar esta alternativa.

SIG-MEJ-02.3/03.3 tienen el alcance del bloque implementado y verificado con PostgreSQL local real: aislamiento/payload y reinicio por paciente; rechazo de stock claro, bloqueo previo al INSERT, concurrencia, rollback, trazabilidad con perfiles ficticios, inmutabilidad y alertas. Pasaron 18 pruebas nuevas de integración y las 105 previas; 3 TODO de sesión real quedan para el responsable de las US de acceso. [Ver evidencia](SIG-MEJ-02.3-03.3-IMPLEMENTACION.md) y [marco para el compañero](../INTEGRACION-US-7.2-7.4.md). No se implementa autenticación ni se valida el fallback como auditoría.

SIG-MEJ-02.1/02.2 están completados para [DEC-003](../../decisiones.md#dec-003--campos-y-ayuda-de-búsqueda-del-historial): matriz de los seis campos y ayuda visible/accesible, reutilizando el matcher de SIG-BUG-02. Pasaron 39 regresiones y la verificación de 27 búsquedas con teclado en Chrome a 360/768/1280 px. [Ver matriz, capturas y límites](SIG-MEJ-02-IMPLEMENTACION.md). SIG-MEJ-02.3 ya verifica el aislamiento del servidor; la integración con sesión real sigue pendiente del responsable de las US de acceso.

SIG-BUG-02.1/02.2/02.3 están completados para [DEC-002](../../decisiones.md#dec-002--normalización-de-la-búsqueda-del-historial): fallo reproducido, normalización de tildes/mayúsculas/ñ y términos en cualquier orden, con 39 regresiones del componente. La suite final falla en 21 casos contra el componente original y pasa completa corregida; 105 pruebas totales aprobadas. [Ver diagnóstico, resultados y límites](SIG-BUG-02-IMPLEMENTACION.md). La matriz/ayuda y el aislamiento de SIG-MEJ-02 conservan sus entregables.

SIG-BUG-01.1 tiene diagnóstico completado y SIG-BUG-01.2 está implementado: el portal cubre la ventana, los filtros se adaptan y el scroll de la tabla queda contenido. [Ver diagnóstico, capturas y verificación](SIG-BUG-01-IMPLEMENTACION.md). El alcance de DU-01 queda registrado en [DEC-001](../../decisiones.md#dec-001--alcance-de-la-corrección-visual-sig-bug-01); no se cambian funciones de las US médicas.

SIG-MEJ-03.1 y SIG-MEJ-03.2 están implementados: selector Sumar/Descontar, entrada positiva, signo calculado en servidor y preservación de valores. [Ver implementación y límites originales](SIG-MEJ-03-IMPLEMENTACION.md). La verificación de stock de SIG-MEJ-03.3 ya está entregada; indicador por lote e integración de identidad real conservan sus pendientes.

SIG-MEJ-04.1, SIG-MEJ-04.2 y SIG-MEJ-04.3 están implementados y verificados con 28 pruebas aisladas, typecheck, lint sin errores y build. [Ver cambios, resultados y límites de la verificación](SIG-MEJ-04-IMPLEMENTACION.md). Las dudas de ciclo, botón y duración permanecen abiertas; no se cambiaron esas reglas ni se escribieron datos de prueba en la base compartida. Los estados iniciales de la tabla conservan la planificación anterior; el estado actual está en cada ticket.

## Aislamiento y orden con las US nuevas

[Ver precedencias, contratos y orden de integración del sprint](../ORDEN-E-INTEGRACION.md). Los alcances están separados, pero hay contratos/archivos compartidos. La matriz distingue dependencia funcional, coordinación y cierre; no exige terminar todas las US para arrancar mejoras existentes. Se registraron DU-13/14/15 sobre límites entre historias.

## Qué puede arrancar sin consultas

[Ver la clasificación de arranque por ticket](ARRANQUE.md). Hay seis tareas de implementación con alcance definido, una regresión de aislamiento, dos diagnósticos y dos tareas con trabajo parcial que pueden avanzar sin consulta externa. Cinco tickets corresponden a definiciones o cambios que dependen de ellas. Las dependencias técnicas se respetan; las dudas de ampliaciones no bloquean por sí solas los cambios explícitos.

## Revisión de requisitos y dudas

[Leer la revisión y el registro de dudas](REVISION.md). Cada uno de los 16 tickets fue contrastado con RF, historias y diseño: distingue obligación explícita, cobertura existente, supuesto técnico y criterio condicionado. DU-01, DU-03, DU-04 y DU-05 tienen alcance definido y evidencia local; DU-12 registra decisiones, con jerarquía general pendiente. Las demás conservan los pendientes indicados en su entrada. P1/P2 y horas son propuestas de planificación.

La revisión ajusta el primer plan: no se da por aprobado conservar seis campos de búsqueda ni una equivalencia ñ/n; se distingue el entero positivo en UI de cantidades con signo en el modelo; se registran el indicador de stock por lote, la atribución del responsable y las diferencias del ciclo/botón de vacunación. Las definiciones pendientes afectan solo los cambios que dependan de ellas.

## Distribución del bloque

| Tema padre | Clasificación | Área | Relación con historias | Alcance propio |
| --- | --- | --- | --- | --- |
| SIG-BUG-01 | Bug visual | Área del médico | US-1.4 existente; coordinación visual con US-7.4 | Diagnóstico y corrección del espacio negro; no nuevas acciones |
| SIG-MEJ-01 | Mejora de texto | Historial clínico del paciente | US-5.2 existente; distinto de US-5.1 | Acuerdo del rótulo y cambio de encabezado/botones |
| SIG-BUG-02 | Bug funcional por verificar | Buscador del historial | US-5.2 existente | Reproducción, normalización de tildes y regresiones |
| SIG-MEJ-02 | Mejora funcional y ayuda | Buscador del historial | Extensión de RF-18 / US-5.2 | Definir campos, completar ayuda y verificar aislamiento |
| SIG-MEJ-03 | Mejora de usabilidad y validación | Inventario de vacunas | Sobre US-3.2 existente | Operación explícita, cantidad positiva, signo interno y trazabilidad |
| SIG-MEJ-04 | Mejora de mensajes y estados | Asignación de vacunación | Sobre US-3.6 existente; distinta de US-2.2 | Sin cupos vs falta de selección y cambio de fecha |

No agrupar todo como un único bug: hay diagnóstico, acuerdos con el cliente, texto de interfaz, funcionalidad, integración y pruebas. La clasificación de origen se conserva aunque una mejora también corrija validaciones existentes.

## Hallazgos que cambian la planificación

- **Área médica:** se reprodujo la exposición del fondo del body al quedar el portal más corto que la ventana, y el desbordamiento de filtros a 360 px. SIG-BUG-01.1 documenta la causa y SIG-BUG-01.2 corrige ambos problemas; ver evidencia de implementación.
- **Tildes:** el fallo original quedó reproducido y corregido conforme a DEC-002. La búsqueda aplica la misma normalización a consulta y campos; el informe conserva la ambigüedad de la fuente y registra el criterio explícito del usuario.
- **Profesional:** nombre/apellido ya llegan en `record.doctor` y ya participan del filtro. SIG-MEJ-02 no empieza de cero: define alcance, agrega ayuda visible y verifica los casos faltantes. «Martin» sin tilde corresponde a normalización, no a agregar el campo.
- **Campos del historial:** SIG-BUG-02 conserva los seis campos actuales según DEC-002. SIG-MEJ-02.1/02.2 entrega matriz y ayuda de esos seis campos bajo DEC-003, sin duplicar el filtro; aislamiento de SIG-MEJ-02.3 continúa pendiente.
- **Stock:** ya hay tipos INGRESO/AJUSTE, motivo obligatorio para ajuste, movimiento con responsable y trigger que evita stock negativo. SIG-MEJ-03 adapta la entrada y verifica integración/error de dominio; no reemplaza el módulo de inventario ni exige migración de esquema inicialmente.
- **Vacunación:** `loadSlots` ya actualiza horarios, limpia selección y descarta respuestas antiguas. SIG-MEJ-04.3 es verificación y ajuste de errores/estado obsoletos. La validación actual de horario obligatorio se ejecuta sin distinguir día sin cupos.

Estos hallazgos provienen de revisión estática y de la captura documental. No equivalen a reproducción local ni a criterios de aceptación ya aprobados.

## Tickets

Prioridad propuesta: P1 = corrección o integridad de un flujo; P2 = claridad/usabilidad o definición. No existe una prioridad formal por ticket en la fuente; estas prioridades y horas son orientativas. La columna de dependencias resume el orden práctico de integración; la sección de precedencia de cada ticket aclara qué impide empezar y qué solo requiere coordinación o repetición de pruebas. No convertir la secuencia sugerida de UI/backend en una obligación de desarrollo serial.

| Ticket | Tarea | Prioridad | Horas | Dependencias | Estado inicial |
| --- | --- | --- | --- | --- | --- |
| [SIG-BUG-01.1](tickets/SIG-BUG-01.1.md) | Diagnosticar contenedores, alturas y fondos del área médica | P1 | 2 | — | Lista para iniciar |
| [SIG-BUG-01.2](tickets/SIG-BUG-01.2.md) | Corregir la maquetación del área médica y validar tamaños de ventana | P1 | 3 | SIG-BUG-01.1 | Pendiente de diagnóstico |
| [SIG-MEJ-01.1](tickets/SIG-MEJ-01.1.md) | Acordar con el cliente el rótulo del detalle del historial | P2 | 1 | — | Lista para preparar propuesta; cierre sujeto al cliente |
| [SIG-MEJ-01.2](tickets/SIG-MEJ-01.2.md) | Actualizar el encabezado y el botón del historial sin alterar la expansión | P2 | 1 | SIG-MEJ-01.1 | Pendiente de rótulo acordado |
| [SIG-BUG-02.1](tickets/SIG-BUG-02.1.md) | Reproducir y delimitar el fallo de búsqueda por tildes | P1 | 1 | — | Lista para iniciar; bug pendiente de reproducción |
| [SIG-BUG-02.2](tickets/SIG-BUG-02.2.md) | Normalizar acentos en la consulta y en el contenido del historial | P1 | 2 | SIG-BUG-02.1 | Pendiente de reproducción y política de normalización |
| [SIG-BUG-02.3](tickets/SIG-BUG-02.3.md) | Agregar regresiones de normalización y combinación de filtros del historial | P1 | 2 | SIG-BUG-02.2 | Pendiente de corrección |
| [SIG-MEJ-02.1](tickets/SIG-MEJ-02.1.md) | Definir el alcance de campos buscables del historial | P2 | 1 | — | Lista para preparar definición; aprobación funcional pendiente |
| [SIG-MEJ-02.2](tickets/SIG-MEJ-02.2.md) | Completar la búsqueda por profesional y publicar su texto de ayuda | P2 | 2 | SIG-MEJ-02.1, SIG-BUG-02.2 | Pendiente de definición; soporte básico existente |
| [SIG-MEJ-02.3](tickets/SIG-MEJ-02.3.md) | Verificar que la búsqueda conserve la separación de historiales por paciente | P1 | 2 | SIG-MEJ-02.2 | Pendiente de integración de búsqueda |
| [SIG-MEJ-03.1](tickets/SIG-MEJ-03.1.md) | Incorporar Sumar dosis y Descontar dosis en el ajuste de stock | P2 | 2 | — | Planificada; propuesta funcional del documento |
| [SIG-MEJ-03.2](tickets/SIG-MEJ-03.2.md) | Validar cantidades positivas y calcular el signo del ajuste en el servidor | P2 | 3 | SIG-MEJ-03.1 | Pendiente de contrato de formulario |
| [SIG-MEJ-03.3](tickets/SIG-MEJ-03.3.md) | Verificar trazabilidad y rechazo de descuentos que dejarían stock negativo | P1 | 3 | SIG-MEJ-03.2 | Pendiente de integración del ajuste |
| [SIG-MEJ-04.1](tickets/SIG-MEJ-04.1.md) | Informar claramente que la fecha de vacunación no tiene horarios libres | P2 | 1 | — | Planificada |
| [SIG-MEJ-04.2](tickets/SIG-MEJ-04.2.md) | Diferenciar al confirmar entre día sin cupos y horario no seleccionado | P1 | 3 | SIG-MEJ-04.1 | Pendiente de estados del formulario |
| [SIG-MEJ-04.3](tickets/SIG-MEJ-04.3.md) | Verificar y ajustar la actualización de horarios al cambiar la fecha | P2 | 2 | SIG-MEJ-04.1, SIG-MEJ-04.2 | Pendiente de mensajes; actualización básica existente |

**Esfuerzo base propuesto: 31 horas**, sin contar espera por acuerdos, preparación de entorno o revisión final. Reservar unas 6–8 h para integración/revisión; rango orientativo del primer plan: 37–39 h, sujeto a las dudas de la revisión. Reestimar después de las reproducciones y definiciones; no asumir que incluye cambios todavía no definidos en ciclo de vacunación, indicador de stock o semántica de búsqueda. No se fija calendario sin conocer capacidad y fechas del sprint; las tareas de pruebas y definición ya están incluidas en el esfuerzo base.

## Secuencia de ejecución

1. **Diagnóstico y decisiones:** SIG-BUG-01.1 y SIG-BUG-02.1. Preparar en paralelo como líneas de trabajo independientes los acuerdos SIG-MEJ-01.1 y SIG-MEJ-02.1; no se presupone su aprobación. Esto describe dependencias, no asigna agentes adicionales.
2. **Correcciones:** SIG-BUG-01.2; SIG-BUG-02.2 → SIG-BUG-02.3. Las pruebas del buscador servirán también a SIG-MEJ-02.
3. **Vacunación:** SIG-MEJ-04.1 → SIG-MEJ-04.2 → SIG-MEJ-04.3. Primero definir estados y mensajes; luego validar servidor y recuperación al cambiar de fecha.
4. **Stock:** SIG-MEJ-03.1 → SIG-MEJ-03.2 → SIG-MEJ-03.3. Acordar pronto el contrato operación/cantidad; cerrar con stock, trazabilidad y concurrencia.
5. **Historial:** después de los acuerdos, SIG-MEJ-01.2; SIG-MEJ-02.2 → SIG-MEJ-02.3. SIG-MEJ-02.2 usa la normalización del bug para evitar dos correcciones del mismo buscador.
6. **Integración final:** comprobar qué dudas condicionan cada criterio antes de cerrar. Recorrer las áreas afectadas con cambios de fecha, búsquedas y ajustes completos; registrar criterios verificados, acuerdos pendientes y cualquier dependencia externa.

Las cadenas de stock, vacunación y visual pueden avanzar independientemente. En el historial conviene integrar normalización, ayuda y rótulos de manera ordenada porque tocan el mismo archivo. La prioridad P1 de una verificación no elimina sus dependencias.

## Historias del reparto del equipo: fuera de este responsable

| Historia | Nombre | Separación y coordinación |
| --- | --- | --- |
| US-1.1 | Disponibilidad mensual | Agenda del médico; SIG-MEJ-04 trata horarios del vacunatorio. |
| US-1.2 | Publicación automática de la agenda | Generación/publicación médica, no mensajes de fecha sin cupos. |
| US-2.1 | Búsqueda de turnos disponibles | Buscar turnos médicos; SIG-BUG-02/SIG-MEJ-02 buscan atenciones del historial. |
| US-2.2 | Confirmación del turno | Confirmación de reserva médica; SIG-MEJ-04 corrige un formulario de vacunación existente. |
| US-2.8 | Registro de asistencia del paciente | Acciones Atendido/Ausente; SIG-BUG-01 solo corrige maquetación. |
| US-5.1 | Registrar diagnóstico e indicaciones | Carga clínica; SIG-MEJ-01 cambia textos de consulta del historial. |
| US-7.1 | Registro de pacientes | Alta de pacientes; no corresponde a Bugs y Mejoras. |
| US-7.2 | Inicio de sesión | Autenticación; se coordina para repetir pruebas de aislamiento al integrarse. |
| US-7.3 | Registro del personal | Alta y asignación de rol; no corresponde a este bloque. |
| US-7.4 | Interfaz diferenciada por rol | Navegación/autorización; coordinar cualquier cambio en el shell compartido. |
| US-7.5 | Funciones de médico y paciente para el administrador | Permisos y auditoría del administrador; no extenderlos desde estos tickets. |

La sección 04 de la fuente menciona continuidades de US-1.5, US-3.2, US-3.6 y US-5.2. **No se agregan tickets para completar esas historias:** los ajustes de este bloque se apoyan en lo existente. Si falta una parte estructural, registrar dependencia con su responsable antes de absorberla como mejora. El plan antiguo de sprint 1 contiene estados que no reflejan todo el código actual; se usó el código para identificar trabajo ya existente.

## Observaciones complementarias: no incorporadas como tareas aprobadas

| Observación de sección 03 | Destino | Tratamiento |
| --- | --- | --- |
| Duración de consultas y vacunación (60/30 vs opciones 15/20/30/60) | Responsables de agenda y vacunación, con cliente | Validar regla antes de crear una tarea de cambio; no modificar duraciones en SIG-MEJ-04. |
| Integración de navegación, antes mediante URLs manuales | Responsables de US-7.4/US-7.5 y flujos de cada US | Confirmar qué falta actualmente; no confundir con corregir el fondo del área médica. |

## Forma de trabajar y cierre

- Mantener esta rama para el bloque de Bugs y Mejoras. Registrar commits por tema o tarea coherente y referenciar sus IDs; si una tarea es solo diagnóstico/acuerdo, su entregable es documentación/evidencia.
- No iniciar cambios de texto o campos que dependen de un acuerdo sin registrar la decisión. Los tickets de definición pueden avanzar con propuestas; la espera de respuesta se distingue de trabajo técnico pendiente.
- Las comprobaciones de stock, aislamiento y concurrencia usan identidades y datos ficticios. Los scripts de BD existentes pueden escribir registros: revisarlos y utilizar una base de pruebas o desarrollo para la implementación.
- En cambios de código ejecutar `npm.cmd run lint` y `npm.cmd run typecheck`; agregar validación funcional específica de cada ticket. Build cuando el cambio afecte compilación/rutas o como cierre integrado, sin repetirlo por cada cambio de texto.
- Para cambiar código de Next.js leer primero la guía correspondiente en `node_modules/next/dist/docs/`, según AGENTS.md.
- Cerrar un tema padre cuando sus tickets tengan evidencia, los criterios conjuntos de la fuente estén cubiertos y no quede una decisión sin resolver. Código preexistente no significa ticket terminado.

## Validación de esta planificación

Cobertura esperada: SIG-BUG-01 (2), SIG-MEJ-01 (2), SIG-BUG-02 (3), SIG-MEJ-02 (3), SIG-MEJ-03 (3), SIG-MEJ-04 (3): 16 tareas. La revisión de esta entrega comprueba correspondencia de IDs, archivos enlazados y dependencias; no ejecuta las pruebas funcionales futuras ni cambia la aplicación.

