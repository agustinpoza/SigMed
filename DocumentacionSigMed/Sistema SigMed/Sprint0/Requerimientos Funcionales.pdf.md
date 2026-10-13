# Requerimientos Funcionales

Fuente: [Requerimientos Funcionales.pdf](Requerimientos%20Funcionales.pdf).

Texto extraído del PDF, separado por página. Los saltos de línea siguen el documento; la distribución visual debe consultarse en el original.


## Página 1

Requerimientos Funcionales:  
1. Gestión de agenda médica  
● RF-01: Definir disponibilidad horaria mensual del médico (días, horarios y duración de consulta).  
● RF-02: Apertura automática de agenda pública según la configuración del médico.  
● RF-03: Bloqueo de agenda por licencias, feriados o imprevistos del profesional.  
● RF-04: Consulta de agenda y hoja de trabajo diaria del médico.  
● RF-27: Modificación de los horarios de atención por el administrador.  
● RF-28: Marcación de un turno como no disponible por el médico.  
2. Reserva de turnos  
● RF-05: Búsqueda y filtrado de turnos disponibles por especialidad, médico o fecha.  
● RF-06: Confirmación de reserva de turno por parte del paciente.  
● RF-07: Envío automatizado de correos electrónicos de confirmación y recordatorios de cita.  
● RF-08: Cancelación y reprogramación de turnos por parte del paciente.  
● RF-09:Permitir al médico o al personal administrativo cancelar un turno o suspender un periodo de tiempo  
por motivos imprevistos o de fuerza mayor.  
● RF-10: Notificación automática al paciente por cancelación de turno  
● RF-29: Registro de la asistencia del paciente al turno  
● RF-30: Reserva de turno por el administrador a solicitud presencial  
3. Gestión de vacunas  
● RF-11: Registro y actualización del inventario/stock de vacunas disponibles por parte de las enfermeras.  
● RF-12: Asignación y reserva de turnos específicos para vacunación.  
● RF-13: Generación de alertas automáticas por bajo stock de vacunas críticas.  
● RF-31: Aprobación de la solicitud de turno de vacunación por la enfermera  
● RF-32: Definición del nivel de stock crítico de cada vacuna  
● RF-33: Alta de nuevas vacunas en el inventario por la enfermera  
4. Gestión de pagos y coberturas  
● RF-14: Registro de cobertura médica/obra social del paciente y validación.  
● RF-15: Procesamiento de pagos para consultas particulares.  
● RF-16: Emisión y descarga de comprobantes/facturas digitales.  
● RF-34: Definición del valor de la consulta por cada médico  
● RF-35: Cobro de la totalidad del turno ante la inasistencia del paciente  
5. Historial clínico  
● RF-17: Carga de diagnósticos, indicaciones y tratamientos en la ficha digital por parte del médico.  
● RF-18: Consulta remota del historial médico por parte del paciente.  
6. Reportes administrativos  
● RF-19: Generación de reporte de cantidad de turnos atendidos/cancelados por especialidad.  
● RF-20: Generación de reporte de stock y consumo de vacunas.  
● RF-21: Generación de reporte de ingresos por pagos y ausentismo de pacientes.  
7. Acceso,autenticación y gestión de usuario  

## Página 2

● RF-22: Registro autogestionado de cuenta de paciente  
● RF-23: Inicio de sesión mediante correo electrónico  
● RF-24: Creación de cuentas del personal de la sala por el administrador  
● RF-25: Diferenciación de la interfaz según el rol del usuario  
● RF-26: Ejercicio de las funciones de médico y de paciente por el administrador  
Planillas de los requerimientos:  
Nombre    Carga de horarios de atención.  
ID    RF-01  
Categoría    Funcional  
Descripción    El sistema debe permitir a cada médico cargar sus horarios de atención  
disponibles.  
Términos    Horarios de atención (franja horaria que un profesional habilita en un tiempo  
determinado)  
Justificación    Es la base del sistema, sin esta información no es posible ofrecerles turnos a los  
pacientes.  
Prioridad    Media.  
Dependencias    RF-23  
Documentos    Cronograma / Planilla de Horarios del Profesional.  
Argumentos de factibilidad Todos los médicos ya cuentan con un horario fijo lo cual simplifica la carga inicial,  
se puede implementar fácilmente.  
Métodos de verificación    Pruebas funcionales: Un médico carga su horario y se verifica que su agenda se  
actualice correctamente reflejando los horarios cargados.  
.  
Nombre    Apertura automática de agenda pública según la configuración del médico.  
ID    RF-02  
Categoría    Funcional  
Descripción    El sistema debe generar y publicar automáticamente la agenda de turnos  
disponibles para los pacientes, a partir de la configuración de disponibilidad  
cargada por el médico (RF-01)  
Términos    Agenda pública (vista de turnos disponibles visible y reservable por los pacientes)  
Justificación    Automatiza el proceso de puesta a disposición de turnos, evitando que un  
administrativo deba publicarlos manualmente.  

## Página 3

Prioridad    Media.  
Dependencias    RF-01  
Documentos    Agenda Pública de Turnos.  
Argumentos de factibilidad Es una transformación directa de los datos de RF-01, no requiere lógica compleja  
adicional.  
Métodos de verificación    Pruebas funcionales: Al guardar la disponibilidad de un médico, verificar que los  
turnos correspondientes aparezcan disponibles en la vista de reserva del  
paciente.  
Nombre    Bloque de agenda médica por licencias,feriados o imprevistos  
ID    RF-03  
Categoría    Funcional  
Descripción    El sistema debe permitir a cada médico (o al personal administrativo en su  
nombre) seleccionar y bloquear días completos, franjas horarias o turnos  
específicos de su agenda mensual previamente publicada. Al confirmar el  
bloqueo por licencias, feriados o imprevistos, el sistema deshabilita la posibilidad  
de nuevas reservas en esa franja y marca los turnos como  
suspendidos/cancelados.  
Términos    Bloqueo de agenda  
Justificación    Otorga flexibilidad a los profesionales de la salud para gestionar imprevistos  
personales o licencias, previniendo que los pacientes reserven turnos en horarios  
en los que el médico no estará disponible en la sala médica.  
Prioridad    Baja.  
Dependencias    RF-02 (Apertura automática de agenda pública).  
Documentos    Reglamento Interno de Licencias y Francos del Personal Médico  
Argumentos de factibilidad Se garantiza su cumplimiento ejecutando una consulta de actualización  
(UPDATE) en la base de datos relacional sobre la tabla de turnos para el rango  
de fechas seleccionado, lo que cambiará su estado a 'Bloqueado' e impedirá que  
el servicio de búsqueda pública devuelva esos horarios a los pacientes.  
Métodos de verificación    Prueba funcional ingresando con el rol Médico, seleccionando una fecha con  
agenda publicada, aplicando un bloqueo por licencia y verificando desde la  
interfaz de Paciente que dichos horarios ya no aparecen disponibles para  
reservar.  

## Página 4

Nombre    Consulta de agenda y hoja de trabajo diaria del médico.  
ID    RF-04  
Categoría    Funcional  
Descripción    El sistema debe permitir al médico visualizar su grilla de turnos reservados por  
día/semana, filtrando por estado de turno: confirmado, atendido, ausente, e  
identificando los datos del paciente.  
Términos    Médico, Paciente, Turno, Estado de turno.  
Justificación    Es necesario para que el médico pueda conocer y organizar su jornada laboral,  
verificar quienes son los pacientes agendados y llevar el control de presentismo,  
lo cual es el paso previo y necesario para luego cargar diagnósticos y  
tratamientos en el historial clínico.  
Prioridad    Alta.  
Dependencias    RF-06, RF-29  
Documentos    Reglamento interno de organización de turnos y agendas médicas de la sala,  
Manual de procedimientos operativos de atención médica en consultorios  
externos, Ley Nº 25.326 (Protección de Datos Personales).  
Argumentos de factibilidad Se garantiza su cumplimiento mediante la implementación de consultas a la base  
de datos que filtren los turnos asociados al ID del médico que inició sesión,  
acotados por la fecha seleccionada. Los estados se pueden manejar como  
atributos actualizables en el modelo de datos de cada turno.  
Métodos de verificación    Pruebas funcionales: Un médico inicia sesión con sus credenciales y al acceder a  
la pantalla de agendas/turnos verifica si solo ve sus turnos correspondientes para  
el día o semana seleccionados, junto con los datos de los pacientes.  
Nombre    Búsqueda y filtrado de turnos disponibles  
ID    RF-05  
Categoría    Funcional  
Descripción    El sistema debe permitir al paciente buscar y filtrar los turnos disponibles por  
especialidad, médico o fecha.  
Términos    Filtrado (mecanismo de búsqueda que acota los resultados según criterios  
seleccionados por el usuario). Especialidad (clínico, pediatra, traumatólogo)  
Justificación    Es el punto de entrada del flujo de reserva, sin una búsqueda eficaz el paciente  
no puede encontrar un turno acorde a su necesidad.  
Prioridad    Media.  
Dependencias    RF-02  
Documentos    Agenda Pública de Turnos.  
Argumentos de factibilidad Es una consulta estándar sobre la base de turnos disponibles con filtros  
combinables, no presenta complejidad técnica relevante.  
Métodos de verificación    Pruebas funcionales: Aplicar combinaciones de filtros y verificar que los  

## Página 5

resultados devueltos por el sistema correspondan exactamente a los criterios  
seleccionados.  
Nombre    Confirmación de reserva de turno por parte del paciente  
ID    RF-06  
Categoría    Funcional  
Descripción    El sistema debe permitir al paciente confirmar su asistencia a su turno  
previamente reservado, cambiando su estado a “confirmado”  
Términos    Paciente, Turno, Notificación, Estado de reserva, Token de confirmación.  
Justificación    Reducir la tasa de ausentismo, optimizar la disponibilidad del personal médico y  
posibilitar la reasignación de turnos no confirmados  
Prioridad    Media.  
Dependencias    RF-05, RF-07  
Documentos    Reglamento de admisión y asignación de turnos de la sala médica. Ley Nacional  
Nº 26.529 (Derechos del Paciente, Historia Clínica y Autonomía de la Voluntad).  
Ley Nº 25.326 (Protección de Datos Personales).  
Argumentos de factibilidad    Implementación técnicamente viables mediante el uso de tokens únicos de  
confirmación de un solo uso en enlaces web o respuestas automatizadas por  
canal de mensajería estándar.  
Métodos de verificación    Pruebas funcionales e integración end-to-end enviando un evento de  
confirmación de prueba y verificando que el registro del turno actualice su estado  
a "Confirmado" en la base de datos de manera inmediata.  
Nombre    Envío automatizado de correos electrónicos de confirmación y recordatorios de  
cita  
ID    RF-07  
Categoría    Funcional  
Descripción    El sistema debe enviar automáticamente un correo electrónico al paciente al  
momento de confirmar su reserva junto con los detalles de la misma y enviar  
recordatorios a medida que la fecha se acerque,  

## Página 6

Términos    Correo de confirmación, recordatorio.  
Justificación    Es necesario para evitar la tasa de ausentismo sin previo aviso y asegurar que el  
paciente disponga de un comprobante digital con la información de su cita  
médica.  
Prioridad    Baja.  
Dependencias    RF-05  
Documentos    Política institucional de comunicaciones digitales y notificaciones a pacientes.  
Ley Nº 25.326 (Protección de Datos Personales). Ley Nº 24.240 (Defensa del  
Consumidor / Información al Usuario).  
Argumentos de factibilidad    Se garantiza mediante la integración del backend con un servicio o API de envío  
de correos electrónicos (como SMTP, Resend o SendGrid). Para los  
recordatorios, se implementarán tareas programadas (cron jobs) que consulten  
periódicamente la base de datos en busca de turnos próximos a cumplirse y  
disparen los correos correspondientes.  
Métodos de verificación    El paciente ingresa al sistema con su usuario de paciente, realiza una reserva de  
turno y verifica en la bandeja de entrada de su correo si recibió un mail de  
confirmación con los datos correctos de su turno.  
El día anterior al del turno deberá revisar si recibió un recordatorio a su bandeja  
de entrada.  
Nombre    Cancelación y reprogramación de turnos por parte del paciente.  
ID    RF-08  
Categoría    Funcional  
Descripción    El sistema debe permitir al paciente cancelar un turno confirmado o  
reprogramarlo a un nuevo horario disponible.  
Términos    Reprogramación (cancelación de un turno existente con reserva simultánea de un  
nuevo turno, sin perder la relación con la solicitud original)  
Justificación    Brinda autonomía al paciente ante cambios de disponibilidad, reduciendo la carga  
administrativa de gestionar estos cambios manualmente.  
Prioridad    Baja.  
Dependencias    RF-05. RF-06  
Documentos    Comprobante de cancelación/reprogramación de turno.  
Argumentos de factibilidad La cancelación libera el slot para que vuelva a estar disponible, la reprogramación  
combina una cancelación con una nueva reserva en la misma operación.  
Métodos de verificación    Prueba funcional: Cancelar un turno y verificar que vuelva a la agenda pública  
como disponible. Reprogramar un turno y verificar que el turno original quede  
liberado y el nuevo quede confirmado.  

## Página 7

Nombre    Cancelación de turnos o suspensión de agenda por imprevistos  
ID    RF-09  
Categoría    Funcional  
Descripción    El sistema debe permitir al médico o al personal administrativo cancelar un turno  
específico o suspender un periodo de tiempo completo de la agenda por motivos  
imprevistos o de fuerza mayor.  
Términos    Personal administrativo, personal médico, suspension  
Justificación    Es necesario mantener la agenda actualizada y reflejar la disponibilidad de turnos  
real ante situaciones inesperadas para evitar que pacientes asistan en vano.  
Prioridad    Baja.  
Dependencias    RF-06  
Documentos  
Reglamento interno de licencias y francos del personal médico. Calendario oficial  
de feriados nacionales (Ministerio del Interior). Protocolo institucional de  
contingencias y cancelación de servicios asistenciales.  
Argumentos de factibilidad Se garantiza implementando una función en la interfaz de gestión que permita  
seleccionar un turno individual o un rango de fechas/horas y actualice su estado a  
"Cancelado" en la base de datos, bloqueando simultáneamente esos espacios  
para impedir futuras reservas.  
Métodos de verificación    Un médico inicia sesión con su cuenta con credenciales de médico, accede a la  
vista de gestión de agenda, selecciona un turno ya reservado o un bloque horario  
en estado “disponible” y selecciona la opción "Cancelar turno/Suspender  
horarios”. Luego se verifica que el turno/bloque haya cambiado de horario  
correctamente y comprobar que los horarios suspendidos ya no figuren como  
disponibles para ser reservados.  
Nombre    Notificación automática por cancelación de turno  
ID    RF-10  
Categoría    Funcional  
Descripción    El sistema debe notificar automáticamente , por correo electrónico , a cada  
paciente cuyo turno reservado haya sido cancelado por el médico o personal  
administrativo. La notificación debe incluir los datos del turno cancelado  
(médico,especialidad,fecha y hora) y la causa de la cancelación y un link que  
mande al usuario directo a la reprogramación del turno.  
Términos    Reprogramación por turno cancelado.  
Justificación    Este requerimiento es necesario porque mantiene al usuario informado sobre el  
estado de su turno y al mismo tiempo evita que personas asistan a la sala médica  
cuando su turno ya no existe ,lo cual generaría un malentendido y a su vez una  

## Página 8

mala imagen para la sala médica .  
Prioridad    Baja.  
Dependencias    RF-03,RF-09  
Documentos    Comprobante de cancelación de turno.  
Argumentos de factibilidad Se garantiza creando un sistema de notificación automática , que se active al  
momento en el que un turno cambia al estado “cancelado”.De manera que se le  
envíe la notificación al paciente.  
Métodos de verificación    Con un turno reservado por un paciente , desde el rol de médico cancelarlo  
especificando un motivo y verificar que el paciente reciba la notificación  
pertinente , con fecha, hora , médico y especialidad, causa de cancelación y el  
link para reprogramar el turno.Luego repetir la prueba desde el lado del personal  
administrativo .  
Nombre    Registro y actualización del inventario/stock de vacunas disponibles  
ID    RF-11  
Categoría    Funcional  
Descripción    El sistema permite dar de alta y actualización de vacunas con tipo, lote,  
vencimiento y cantidad.  
Términos    Stock de vacunas.  
Justificación    Es necesario para mantener la trazabilidad de cada vacuna y control de stock de  
vacunas.  
Prioridad    Media/Alta.  
Dependencias    RF-23  
Documentos    Calendario Nacional de Vacunación y manual de cadena de frío.  
Argumentos de factibilidad Cumple normativas de trazabilidad de biológicos y auditoría sanitaria.  
Métodos de verificación    Trazabilidad inmutable de usuario, fecha y lote por movimiento.  
Nombre    Asignación y reserva de turnos específicos para vacunación  
ID    RF-12  
Categoría    Funcional  
Descripción    El sistema debe permitir a los usuarios con rol de enfermera o administrador  
asignar turnos específicos para vacunación, condicionando la reserva a la  
disponibilidad de stock físico de las vacunas en la sala médica. Los pacientes van  
de forma presencial a solicitar el turno.  
Términos    Enfermeras, stock de vacunas, turno de vacunación.  
Justificación    Es indispensable para organizar la asistencia de los pacientes a vacunarse y  

## Página 9

garantizar que no se otorguen citas si no hay dosis en stock, evitando  
inconvenientes con pacientes.  
Prioridad    Media/Alta.  
Dependencias    RF-11  
Documentos    Manual de procedimientos del Vacunatorio de la Sala Médica. Calendario  
Nacional de Vacunación (Ministerio de Salud de la Nación). Normativa sobre  
Trazabilidad y Control de Stock de Medicamentos y Vacunas (ANMAT).  
Argumentos de factibilidad Se garantiza implementando un control de validación al momento de solicitar el  
turno. El sistema consultará la tabla de inventario en la base de datos y solo  
permitirá la confirmación si la cantidad de la vacuna requerida es mayor a cero. Al  
confirmar, se puede descontar (o reservar lógicamente) una unidad del stock  
disponible.  
Métodos de verificación    La enfermera inicia sesión en el sistema , luego ingresa las credenciales válidas  
del paciente, selecciona la opción de reservar turno de vacunación y dependiendo  
del stock de la vacuna es aceptado o rechazado. En caso de ser aceptado,  
revisar que el turno haya sido asignado correctamente, caso contrario, revisar  
que el sistema haya impedido la reserva, indicando al usuario que no hay  
disponibilidad de dosis para esa vacuna.  
Nombre    Generación de alertas automáticas por bajo stock de vacunas críticas  
ID    RF-13  
Categoría    Funcional  
Descripción    El sistema debe monitorear continuamente el inventario de vacunas catalogadas  
como "críticas" y generar alertas automáticas (notificaciones en pantalla, correos  
o mensajes) al personal responsable cuando el nivel de stock caiga por debajo  
del umbral mínimo definido para cada lote o insumo.  
Términos    Vacuna crítica, Umbral de stock mínimo, Alerta automática, Inventario, Punto de  
reorden.  
Justificación    Prevenir el desabastecimiento de insumos biológicos esenciales, garantizando la  
continuidad de las jornadas de vacunación y reduciendo riesgos para la salud  
pública o institucional.  
Prioridad    Baja.  
Dependencias    RF-11  
Documentos    Plantilla de notificación urgente a responsables.  
Argumentos de factibilidad    Implementable mediante tareas programadas (cron jobs) o disparadores en la  
base de datos (triggers) que comparen el conteo de stock disponible contra el  
umbral en cada transacción o intervalo predeterminado.  

## Página 10

Métodos de verificación    Pruebas de integración registrando la salida o consumo de un lote de vacunas  
críticas hasta superar el umbral mínimo, comprobando que la alerta se cree en la  
base de datos y se envíe la notificación correspondiente al usuario designado.  
Nombre    Registro de cobertura médica/obra social del paciente y validación  
ID    RF-14  
Categoría    Funcional  
Descripción    El sistema debe permitir registrar la obra social o prepaga del paciente y realizar  
la validación de la cobertura para la atención médica o consulta.  
Términos    Paciente, cobertura médica, obra social, validación de obra social.  
Justificación    Es necesario para agilizar el proceso de recepción, informar correctamente los  
costos para el paciente antes de la consulta y permitir a la administración liquidar  
correctamente las prestaciones a las obras sociales o cobrar los montos  
particulares necesarios.  
Prioridad    Baja.  
Dependencias    RF-06  
Documentos    Documentos con información relevante para este requerimiento.  
Argumentos de factibilidad Por qué / de qué manera se garantiza que puede cumplirse.  
Métodos de verificación    Cómo se verificará que se cumple.  
Nombre    Procesamiento de pagos para consultas particulares  
ID    RF-15  
Categoría    Funcional  
Descripción    El sistema debe permitir a los pacientes abonar consultas particulares a través de  
una pasarela de pago integrada, registrando la transacción una vez confirmado el  
pago.  
Términos    Consulta particular (Atención abonada directamente por el paciente sin  
intermediación de una obra social prepaga). Pasarela de pago (servicio externo  
que procesa la transacción financiera)  
Justificación    Digitaliza el cobro de consultas particulares, uno de los objetivos explícitos de  
POS.  
Prioridad    Baja.  
Dependencias    RF-06 (el pago se asocia a un turno confirmado)  
Documentos    Orden o solicitud de cobro de consulta particular.  
Argumentos de factibilidad Se implementa mediante la integración con una pasarela de pago externa (vía  
API).  

## Página 11

Nombre    Emisión y descarga de comprobantes/facturas digitales  
ID    RF-16  
Categoría    Funcional  
Descripción    El sistema debe permitir emitir, consultar y descargar comprobantes o facturas  
digitales correspondientes a las transacciones y pagos realizados por consultas  
particulares o prestaciones médicas.  
Términos    Factura/Comprobante digital, paciente, transacción  
Justificación    Es fundamental para dar transparencia fiscal y administrativa al proceso de cobro,  
respaldar contablemente los ingresos de la sala médica y permitir que los  
pacientes dispongan de una constancia de pago digital válida para sus registros o  
reintegros.  
Prioridad    Baja.  
Dependencias    RF-15  
Documentos  
Normativa de Facturación Electrónica de la AFIP (Régimen de Emisión de  
Comprobantes Electrónicos - Factura A/B/C). Ley Nº 24.240 (Defensa del  
Consumidor - Información al Usuario y Obligación de Entrega de Comprobante).  
Reglamento Interno de Facturación y Contabilidad de la Sala Médica.  
Argumentos de factibilidad Se garantiza mediante la generación automática de documentos PDF  
respaldados en el backend tras el procesamiento del pago. Se puede integrar o  
simular la emisión mediante servicios web de facturación (Web Services de AFIP  
/ pasarelas de pago), almacenando la URL/archivo del comprobante asociado al  
ID de la transacción para su posterior descarga.  
Métodos de verificación    Un usuario con credenciales de paciente inicia sesión, realiza el pago  
exitosamente de una consulta médica y verifica que el sistema genere  
automáticamente el comprobante digital correspondiente y lo asocie al historial de  
pagos del paciente. Por último, se verifica que la opción de descargar o visualizar  
factura genere un archivo formato pdf con la información correcta.  
Nombre    Carga de diagnósticos, indicaciones y tratamientos en la ficha digital.  
ID    RF-17  
Categoría    Funcional  
Descripción    El sistema debe permitir la carga de diagnósticos, indicaciones y tratamientos  
Términos    Ficha digital (registro electrónico del historial clínico de un paciente)  

## Página 12

Justificación    Es el requerimiento base del módulo de historia clínica.  
Prioridad    Media.  
Dependencias    RF-06  
Documentos    Ley y normativa de Historia Clínica Electrónica y protección de datos.  
Argumentos de factibilidad Se implementa como un formulario estructurado, vinculado al turno atendido, no  
presenta complejidad técnica relevante.  
Métodos de verificación    Prueba funcional: un médico marca un turno como “atendido”, carga  
diagnóstico/indicaciones/tratamiento y se verifica que la información quede  
correctamente asociada a la ficha del paciente correspondiente.  
Nombre    Consulta remota del historial médico por parte del paciente.  
ID    RF-18  
Categoría    Funcional  
Descripción    El sistema debe permitir al paciente autenticado acceder y visualizar su historial  
clínico desde la plataforma web o la aplicación móvil, mostrando diagnósticos,  
tratamientos y fecha de las atenciones registradas por los médicos.  
Términos    Historial clínico, Ficha del paciente, Diagnóstico, Tratamiento, Consulta remota.  
Justificación    Permite brindar una experiencia más ágil y digital al paciente, dándole acceso  
inmediato a su información de salud sin necesidad de acudir o contactar  
presencialmente a la sala médica.  
Prioridad    Alta.  
Dependencias    RF-17  
Documentos    Resumen descargable de Historia Clínica del paciente.  
Argumentos de factibilidad Viable mediante la implementación de un backend que consuma la base de datos  
centralizada de historias clínicas, exponiendo endpoints seguros (API REST)  
accesibles tanto por la plataforma web como por la app móvil.  
Métodos de verificación    Pruebas de integración y de interfaz de usuario (UI): verificar que un paciente  
autenticado visualice únicamente sus propios registros clínicos cargados  
previamente por el médico de forma precisa y legible.  
Nombre    Reporte de turnos atendidos/cancelados por especialidad  
ID    RF-19  
Categoría    Funcional  
Descripción    El sistema debe poder generar un reporte que muestre la cantidad de turnos  
atendidos y cancelados, discriminados por especialidad médico, en un período  
seleccionable.  
Términos    Turno atendido, Turno cancelado.  

## Página 13

Justificación    Permite a los administradores evaluar la operatividad de cada especialidad y  
detectar patrones de cancelación.  
Prioridad    Baja.  
Dependencias    RF-04 - RF-09  
Documentos    Registros consolidados de estados de turnos  
(Atendido/Cancelado/Ausente).tendido/Cancelado/Ausente).  
Argumentos de factibilidad Se puede implementar mediante una consulta agregada sobre datos ya  
existentes en el sistema de turnos, no requiere procesamiento adicional más allá  
de filtros por rango de fechas.  
Métodos de verificación    Prueba funcional: generar el reporte para un período con turnos en distintos  
estados y especialidades, y verificar que los totales coinciden con los datos  
cargados en el sistema.  
Nombre    Generación de reporte de stock y consumo de vacunas  
ID    RF-20  
Categoría    Funcional  
Descripción    El sistema debe permitir a los usuarios con el rol administrador generar y  
visualizar reportes detallados sobre el estado del stock actual de vacunas y el  
consumo/aplicación y el consumo/aplicación de las mismas en un rango de  
fechas determinado.  
Términos    Reporte administrativo, Stock de vacunas, Consumo de vacunas, Alerta de bajo  
stock, Administrador.  
Justificación    Necesario para optimizar la gestión interna de la sala médica, permitir un control  
eficiente del inventario de vacunas y respaldar la toma de decisiones  
administrativas en la compra de insumos.  
Prioridad    Baja.  
Dependencias    RF-11, RF-12  
Documentos    Documentos con información relevante para este requerimiento.  
Argumentos de factibilidad Viable mediante la ejecución de consultas agregadas (SQL/ORM) sobre las  
tablas de inventario y registro de aplicaciones de vacunas, exportando o  
renderizando los datos en paneles de control y formatos descargables (ej.  
PDF/Excel).  
Métodos de verificación    Pruebas funcionales de generación de reportes: comprobar que los datos  
consolidados coincidan con el stock cargado por las enfermeras y las dosis  
registradas como aplicadas en el período seleccionado.  
Nombre    Generación de reporte de ingresos por pagos y ausentismo de pacientes  
ID    RF-21  
Categoría    Funcional  

## Página 14

Descripción    El sistema debe permitir a los administradores generar y consultar reportes sobre  
los ingresos financieros obtenidos por pago de consultas y la tasa de ausentismo  
de los pacientes en un periodo de tiempo determinado.  
Términos    Administrador, reporte de ingresos, ausentismo.  
Justificación    Necesario para la gestión gerencial y financiera de la sala médica, permitiendo  
evaluar la facturación obtenida, medir el impacto económico del ausentismo y  
tomar decisiones operativas para optimizar el aprovechamiento de la agenda  
médica.  
Prioridad    Baja.  
Dependencias    RF-04, RF-15, RF-16  
Documentos    Reglamento interno de administración financiera y contabilidad de la sala médica.  
Manual de procedimientos para la gestión de cobros y control de gestión.  
Normativa contable y tributaria de la AFIP aplicable a prestaciones de salud. Ley  
Nº 25.326 (Protección de Datos Personales).  
Argumentos de factibilidad Se garantiza mediante la ejecución de consultas SQL de agregación en la base  
de datos, realizando un cruce de información entre la tabla de pagos/facturación y  
la tabla de turnos filtrados por rango de fechas y estado de atención ("atendido"  
vs "ausente"). Los resultados se presentarán mediante tablas/gráficos interactivos  
en la interfaz y/o mediante archivos exportables (PDF, Excel/CSV).  
Métodos de verificación    Se inicia sesión con credenciales de administrador, se accede al módulo de  
reportes administrativos, se define un rango de fechas y se solicita la generación  
de un reporte de ingresos y ausentismo, se verifica que el reporte muestre  
correctamente el total acumulado de ingresos recaudos y la  
estadística/porcentaje de ausentismo entre pacientes.  
Nombre    Registro autogestionado de cuenta de paciente  
ID    RF-22  
Categoría    Funcional  
Descripción    El sistema debe permitir que una persona cree por sí misma su cuenta de  
paciente, informando sus datos personales (nombre, apellido, DNI, correo  
electrónico) y una contraseña. La cuenta creada queda asociada al rol Paciente.  
Términos    Cuenta de usuario (credencial con la que una persona accede al sistema). Rol  
(conjunto de funciones habilitadas para un tipo de usuario). Paciente.  
Justificación    El cliente definió que los pacientes crean sus propias cuentas, sin intervención del  
personal de la sala. Es la puerta de entrada al circuito de reserva de turnos: sin  
cuenta de paciente ninguna reserva puede asociarse a una persona.  
Prioridad    Media.  
Dependencias    Ninguna.  
Documentos    Minuta de la consulta con el cliente del 03/09/2026. Ley 25.326 de Protección de  
Datos Personales.  
Argumentos de factibilidad Se dispone de una base de datos capaz de almacenar los datos personales de  
los pacientes y de verificar que una misma persona no quede registrada dos  
veces.  

## Página 15

Métodos de verificación    Pruebas funcionales: una persona sin cuenta completa el formulario de registro y  
se verifica que pueda iniciar sesión y acceder a la interfaz del rol Paciente.  
Nombre    Inicio de sesión mediante correo electrónico  
ID    RF-23  
Categoría    Funcional  
Descripción    El sistema debe permitir a todos los usuarios iniciar sesión mediante su correo  
electrónico y su contraseña, y debe presentarles la interfaz correspondiente al rol  
que tienen asignado.  
Términos    Credenciales (correo electrónico y contraseña con los que el usuario se  
identifica). Rol.  
Justificación    El cliente indicó que todos los usuarios ingresan con su correo electrónico. Es  
precondición de toda función que dependa de la identidad del usuario, como la  
consulta de la agenda propia del médico o del historial del paciente.  
Prioridad    Media.  
Dependencias  
Documentos    Minuta de la consulta con el cliente del 03/09/2026.  
Argumentos de factibilidad La sala cuenta con correo electrónico para todo su personal, y los pacientes  
informan el suyo al momento de registrarse.  
Métodos de verificación    Pruebas funcionales: se inicia sesión con una cuenta de cada rol y se verifica que  
cada una acceda a la interfaz que le corresponde y sea rechazada ante  
credenciales incorrectas.  
Nombre    Creación de cuentas del personal de la sala por el administrador  
ID    RF-24  
Categoría    Funcional  
Descripción    El sistema debe permitir al administrador crear las cuentas de los médicos y de  
las enfermeras, asignando el rol correspondiente en el mismo momento del alta.  
Términos    Administrador. Alta de cuenta. Asignación de rol.  
Justificación    El cliente definió que el personal de la sala no se autogestiona la cuenta: es el  
administrador quien la crea y quien le asigna el rol en el momento del alta y no  
con posterioridad. Esto mantiene bajo control quién puede operar como médico o  
como enfermera.  
Prioridad    Media.  
Dependencias    RF-23.  
Documentos    Minuta de las consultas con el cliente del 03/09/2026 y del 17/09/2026. Nómina  
de profesionales de la sala médica.  
Argumentos de factibilidad La sala dispone de la nómina de sus tres médicos y sus dos enfermeras, y cuenta  
con una persona con rol de administrador encargada de realizar las altas.  

## Página 16

Métodos de verificación    Pruebas funcionales: el administrador da de alta un médico y una enfermera, y se  
verifica que cada uno pueda iniciar sesión con el rol que se le asignó en el alta.  
Nombre    Diferenciación de la interfaz según el rol del usuario  
ID    RF-25  
Categoría    Funcional  
Descripción    El sistema debe presentar a cada usuario el conjunto de pantallas y acciones  
propio de su rol (paciente, médico, enfermera o administrador), sin exponerle las  
funciones que corresponden a los demás roles.  
Términos    Rol. Interfaz de usuario. Permisos.  
Justificación    El cliente pidió expresamente una clara distinción de pantallas por rol. Además de  
facilitar el uso, evita que un usuario acceda a funciones ajenas a su  
responsabilidad, en particular a la información clínica.  
Prioridad    Media.  
Dependencias    RF-23.  
Documentos    Minuta de la consulta con el cliente del 17/09/2026. Enunciado del Proyecto  
PSS-2026, Enunciado 2 ("interfaces de usuario separadas y específicas para  
pacientes, médicos y administradores").  
Argumentos de factibilidad Los cuatro roles y las funciones que corresponden a cada uno quedaron definidos  
por el cliente, de modo que la separación de pantallas puede establecerse desde  
el inicio del desarrollo.  
Métodos de verificación    Pruebas funcionales: se inicia sesión con un usuario de cada rol y se verifica que  
solo estén disponibles las acciones previstas para ese rol y que las demás no  
sean accesibles.  
Nombre    Permisos de las funciones de médico y de paciente por el administrador  
ID    RF-26  
Categoría    Funcional  
Descripción    El sistema debe permitir al administrador realizar las mismas acciones que puede  
realizar un médico y las que puede realizar un paciente, además de las funciones  
propias de su rol.  
Términos    Administrador. Permisos. Rol.  
Justificación    El cliente indicó que el administrador puede hacer todo lo que hace un médico y  
todo lo que hace un paciente, de modo de poder cubrir la operación de la sala  
ante la ausencia del personal o ante solicitudes presenciales.  
Prioridad    Media.  
Dependencias    RF-25.  
Documentos  
Argumentos de factibilidad Las funciones de los roles médico y paciente ya quedan definidas por los  

## Página 17

requerimientos correspondientes, por lo que alcanza con habilitarlas también para  
el rol administrador.  
Métodos de verificación    Pruebas funcionales: el administrador accede a las funciones propias del rol  
médico y del rol paciente y se verifica que pueda ejecutarlas sin necesidad de una  
cuenta adicional.  
Complementos del módulo 1 — Gestión de agenda médica  
Nombre    Modificación de los horarios de atención por el administrador  
ID    RF-27  
Categoría    Funcional  
Descripción    El sistema debe permitir únicamente al administrador modificar los horarios de  
atención cargados para un médico. El médico carga sus horarios una sola vez, al  
momento del alta, y no puede modificarlos por sí mismo.  
Términos    Horario de atención (franja fija en la que un profesional atiende, definida una  
única vez). Administrador.  
Justificación    El cliente definió que los horarios de atención se cargan una única vez y que solo  
el administrador puede cambiarlos. Esto evita que la agenda ya publicada se  
altere de manera descontrolada y que los pacientes pierdan turnos ya reservados.  
Prioridad    Media/Alta.  
Dependencias    RF-01 y RF-25.  
Documentos    Minuta de la consulta con el cliente del 03/09/2026.  
Argumentos de factibilidad Los horarios de cada médico quedan almacenados en el sistema y la sala cuenta  
con un administrador responsable de mantenerlos actualizados.  
Métodos de verificación    Pruebas funcionales: un médico intenta modificar su horario y se verifica que la  
acción no esté disponible; el administrador realiza la modificación y se verifica  
que el cambio se refleje en la agenda publicada.  
Nombre    Selección de un turno como no disponible por el médico  
ID    RF-28  
Categoría    Funcional  
Descripción    El sistema debe permitir al médico marcar un turno determinado de su agenda  
como no disponible, de modo que ese horario deje de ofrecerse a los pacientes  
para su reserva.  
Términos    Turno no disponible (turno que el médico retira de la oferta sin bloquear toda la  
jornada). Agenda.  
Justificación    El cliente indicó que el médico puede marcar turnos como no disponibles ante  
situaciones puntuales. A diferencia del bloqueo de agenda, permite retirar un  
único horario sin afectar el resto del día.  
Prioridad    Baja.  

## Página 18

Dependencias    RF-02.  
Documentos    Minuta de las consultas con el cliente del 03/09/2026 y del 17/09/2026.  
Argumentos de factibilidad Cada turno tiene un estado registrado en el sistema, de modo que puede pasarse  
al estado no disponible y excluirse de la vista de reserva.  
Métodos de verificación    Pruebas funcionales: el médico marca un turno libre como no disponible y se  
verifica, desde la interfaz del paciente, que ese horario ya no aparezca entre los  
turnos reservables.  
Complementos del módulo 2 — Reserva de turnos  
Nombre    Registro de la asistencia del paciente al turno  
ID    RF-29  
Categoría    Funcional  
Descripción    El sistema debe permitir al médico asignado a un turno registrar si el paciente  
asistió o no asistió a la consulta, dejando el turno en el estado correspondiente.  
Términos    Asistencia. Inasistencia. Estado de turno (atendido o ausente).  
Justificación    El cliente definió que es el propio médico asignado al turno quien determina la  
asistencia del paciente. Es el dato que alimenta el reporte de ausentismo y el  
cobro por inasistencia, que hoy no tienen origen en ningún otro requerimiento.  
Prioridad    Media.  
Dependencias    RF-04 y RF-06.  
Documentos    Minuta de las consultas con el cliente del 03/09/2026 y del 17/09/2026.  
Argumentos de factibilidad El médico dispone de su hoja de trabajo diaria con los turnos del día, sobre la  
cual puede registrar la asistencia de cada paciente al finalizar la consulta.  
Métodos de verificación    Pruebas funcionales: el médico registra un paciente como ausente y se verifica  
que el estado del turno cambie y que la inasistencia se refleje en el reporte de  
ausentismo.  
Nombre    Reserva de turno por el administrador a solicitud presencial  
ID    RF-30  
Categoría    Funcional  
Descripción    El sistema debe permitir al administrador reservar un turno a nombre de un  
paciente cuando la solicitud se realice de forma presencial o telefónica en la sala  
médica.  
Términos    Reserva presencial (turno solicitado en el mostrador de la sala y cargado por el  
personal administrativo). Administrador.  
Justificación    El cliente indicó que los turnos también se piden de forma física y que los  
administrativos son quienes los cargan. Sin esta función, esos turnos quedarían  
fuera del sistema y la agenda dejaría de reflejar la ocupación real del médico.  

## Página 19

Prioridad    Baja.  
Dependencias    RF-06 y RF-25.  
Documentos    Minuta de la consulta con el cliente del 17/09/2026.  
Argumentos de factibilidad El administrador cuenta con acceso a la agenda publicada y a los datos de los  
pacientes registrados, de modo que puede completar la reserva en su nombre.  
Métodos de verificación    Pruebas funcionales: el administrador reserva un turno a nombre de un paciente  
registrado y se verifica que el turno aparezca tanto en la agenda del médico como  
en el panel de turnos del paciente.  
Complementos del módulo 3 — Gestión de vacunas  
Nombre    Aprobación de la solicitud de turno de vacunación por la enfermera  
ID    RF-31  
Categoría    Funcional  
Descripción    El sistema debe registrar las solicitudes de turno de vacunación en estado  
pendiente y permitir que una enfermera o el administrador las apruebe o las  
rechace. El turno de vacunación solo queda confirmado una vez aprobado.  
Términos    Solicitud de turno de vacunación. Turno pendiente (solicitud registrada y aún no  
resuelta). Aprobación. Rechazo.  
Justificación    El cliente definió que todo pedido de turno de vacunación debe ser aprobado por  
una enfermera y que el sistema no puede confirmarlo de forma automática, dado  
que la asignación depende de la disponibilidad real de la vacuna en la sala.  
Prioridad    Media.  
Dependencias    RF-11 y RF-12.  
Documentos    Minuta de las consultas con el cliente del 03/09/2026 y del 17/09/2026. Manual de  
procedimientos de enfermería de la sala médica.  
Argumentos de factibilidad La sala cuenta con dos enfermeras que revisan las solicitudes de vacunación, y el  
sistema registra el estado de cada solicitud hasta su resolución.  
Métodos de verificación    Pruebas funcionales: un paciente solicita un turno de vacunación y se verifica que  
quede en estado pendiente; una enfermera lo aprueba y se verifica que pase a  
confirmado; se rechaza otra solicitud y se verifica que no quede confirmada y que  
el paciente sea informado.  
Nombre    Definición del nivel de stock crítico de cada vacuna  
ID    RF-32  
Categoría    Funcional  
Descripción    El sistema debe permitir a las enfermeras y al administrador definir, para cada  
vacuna del inventario, la cantidad mínima a partir de la cual su stock se considera  
crítico.  

## Página 20

Términos    Stock crítico (cantidad mínima por debajo de la cual una vacuna requiere  
reposición). Umbral. Vacuna.  
Justificación    El cliente indicó que cada vacuna tiene su propio nivel crítico y que lo determinan  
las enfermeras o el administrador. Sin ese valor cargado, las alertas automáticas  
por bajo stock no pueden emitirse.  
Prioridad    Baja.  
Dependencias    RF-11.  
Documentos    Minuta de las consultas con el cliente del 03/09/2026 y del 17/09/2026.  
Calendario Nacional de Vacunación.  
Argumentos de factibilidad El inventario registra cada vacuna de forma individual, de modo que puede  
asociarse un umbral propio a cada una de ellas.  
Métodos de verificación    Pruebas funcionales: se define un umbral para una vacuna, se reduce su stock  
por debajo de ese valor y se verifica que se emita la alerta correspondiente y que  
no se emita para las vacunas que siguen por encima de su umbral.  
Nombre    Alta de nuevas vacunas en el inventario por la enfermera  
ID    RF-33  
Categoría    Funcional  
Descripción    El sistema debe permitir a las enfermeras incorporar al inventario vacunas que no  
estuvieran previamente registradas, además de actualizar el stock de las ya  
existentes.  
Términos    Inventario de vacunas. Alta de vacuna.  
Justificación    El cliente aclaró que las enfermeras agregan vacunas al stock y no se limitan a  
administrar las que ya estaban registradas. Sin esta función, el inventario  
quedaría fijo a la carga inicial.  
Prioridad    Media/Alta.  
Dependencias    RF-11.  
Documentos    Minuta de la consulta con el cliente del 03/09/2026. Calendario Nacional de  
Vacunación.  
Argumentos de factibilidad Las enfermeras son quienes reciben las vacunas en la sala y disponen de la  
información necesaria para darlas de alta en el inventario.  
Métodos de verificación    Pruebas funcionales: una enfermera incorpora una vacuna no registrada  
previamente y se verifica que quede disponible para cargarle stock, definirle un  
nivel crítico y asignarle turnos.  
Complementos del módulo 4 — Gestión de pagos y coberturas  
Nombre    Definición del valor de la consulta por cada médico  
ID    RF-34  

## Página 21

Categoría    Funcional  
Descripción    El sistema debe permitir que cada médico defina el valor de su consulta particular,  
y debe tomar ese valor al registrar el pago del turno correspondiente.  
Términos    Valor de consulta. Consulta particular (atención abonada por el paciente sin  
cobertura médica).  
Justificación    El cliente definió que el valor de la consulta no es unificado para la sala, sino que  
cada médico establece el suyo. El registro del pago y el cobro por inasistencia  
dependen de este dato.  
Prioridad    Baja.  
Dependencias    RF-25.  
Documentos    Minuta de la consulta con el cliente del 03/09/2026. Tabla de aranceles de la sala  
médica.  
Argumentos de factibilidad Cada médico conoce el valor que cobra por su consulta, y el sistema puede  
almacenarlo junto con el resto de sus datos profesionales.  
Métodos de verificación    Pruebas funcionales: dos médicos definen valores distintos y se verifica que, al  
registrar el pago de un turno, se tome el valor correspondiente al médico que  
atiende ese turno.  
Nombre    Cobro de la totalidad del turno ante la inasistencia del paciente  
ID    RF-35  
Categoría    Funcional  
Descripción    El sistema debe registrar, cuando un turno queda marcado como ausente, una  
deuda a nombre del paciente por el valor total de la consulta del médico  
correspondiente.  
Términos    Inasistencia. Deuda del paciente. Valor de consulta.  
Justificación    El cliente indicó que al paciente que falta a un turno se le cobra la totalidad del  
valor de la consulta. Es la consecuencia económica de la inasistencia y alimenta  
el reporte de ingresos y ausentismo.  
Prioridad    Baja.  
Dependencias    RF-29 y RF-34.  
Documentos    Minuta de la consulta con el cliente del 03/09/2026.  
Argumentos de factibilidad El sistema conoce el estado de cada turno y el valor de la consulta de cada  
médico, de modo que dispone de los datos necesarios para registrar el importe  
adeudado.  
Métodos de verificación    Pruebas funcionales: se marca un turno como ausente y se verifica que quede  
registrada la deuda por el valor total de la consulta de ese médico, y que no se  
registre deuda alguna cuando el turno se marca como atendido.
