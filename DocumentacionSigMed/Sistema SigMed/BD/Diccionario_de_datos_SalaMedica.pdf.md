# Diccionario_de_datos_SalaMedica

Fuente: [Diccionario_de_datos_SalaMedica.pdf](Diccionario_de_datos_SalaMedica.pdf).

Texto extraído del PDF, separado por página. Los saltos de línea siguen el documento; la distribución visual debe consultarse en el original.


## Página 1

```text
Diccionario de datos
Sistema de gestión de la sala médica · PSS 2026 · Comisión 10
Fecha: 30/09/2026
Introducción
Este documento describe las 16 tablas del modelo de datos del sistema, agrupadas en seis módulos. Para cada tabla se
indica qué representa, qué requerimientos funcionales (RF) y user stories (US) la originan, el detalle de sus campos y las
reglas propias de la tabla.
Los reportes administrativos (RF-19, RF-20 y RF-21) no tienen tablas propias: se obtienen a partir de los datos de turnos,
movimientos de stock y pagos.
Convenciones
Tipo: tipos de dato genéricos (Entero, Decimal, Texto, Booleano, Fecha, Hora, FechaHora).
Clave: PK es la clave primaria de la tabla; FK → tabla indica una clave foránea y la tabla a la que apunta.
Nulidad: No nulo si el campo siempre tiene valor; Nulo si puede quedar vacío.
Restricciones: condiciones que debe cumplir el valor (único, valores permitidos, rangos, dependencias con otros
campos).
Valores calculados: el stock de lotes y vacunas y los horarios disponibles no se almacenan; se obtienen a partir de
otras tablas.
Índice de tablas
1. Usuarios y acceso: usuario, paciente, medico
2. Agenda médica: horario_atencion, bloqueo_agenda
3. Turnos médicos: turno
4. Vacunas: vacuna, lote, movimiento_stock, alerta_stock, horario_vacunacion, turno_vacunacion
5. Pagos y coberturas: obra_social, pago, comprobante
6. Historia clínica: registro_clinico
1. Usuarios y acceso
usuario
Datos comunes a todas las personas que usan el sistema: pacientes, médicos, enfermeras y administradores. Las tablas
paciente y medico la extienden con sus datos propios; enfermeras y administradores se representan solo con esta tabla.
Origen: RF-22, RF-23, RF-24, RF-25, RF-26 · US-7.1, US-7.2, US-7.3, US-7.4, US-7.5
Campo    Tipo    Clave    Nulidad Restricciones    Descripción
id_usuario    Entero    PK    No nulo —    Identificador del usuario
nombre    Texto    —    No nulo —    Nombre de la persona
apellido    Texto    —    No nulo —    Apellido de la persona
dni    Texto    —    No nulo Único    Documento. Evita que una persona se
registre dos veces (RF-22)
email    Texto    —    No nulo Único    Correo electrónico con el que inicia sesión
(RF-23) y recibe notificaciones
Diccionario de datos · Comisión 10 · Página 1
```

## Página 2

```text
Campo    Tipo    Clave    Nulidad Restricciones    Descripción
rol    Texto    —    No nulo Valores: paciente, medico,    Rol asignado en el alta; no se modifica
enfermera, administrador    después (RF-24)
fecha_alta    FechaHora —    No nulo —    Momento en que se creó la cuenta
clerk_user_id    Texto    —    No nulo Único    Identificador del usuario en el servicio de
autenticación (Clerk), que gestiona las
credenciales de ingreso. Vincula la cuenta
de acceso con este registro.
Reglas de la tabla
Los pacientes se registran solos (RF-22); médicos y enfermeras los da de alta el administrador (RF-24).
paciente
Extiende usuario con los datos propios del paciente, incluida su cobertura médica. Cada paciente tiene como máximo
una cobertura.
Origen: RF-14, RF-22 · US-4.1, US-4.2, US-7.1
Campo    Tipo    Clave    Nulidad Restricciones    Descripción
id_usuario    Entero    PK, FK →    No nulo El usuario debe tener rol    Identificador del paciente (el mismo que su
usuario    paciente    usuario)
id_obra_social    Entero    FK →    Nulo    —    Obra social o prepaga. Nulo si es paciente
obra_social    particular
numero_afiliado    Texto    —    Nulo    No nulo si tiene obra social Número de afiliado a la obra social
plan    Texto    —    Nulo    —    Plan de la cobertura
estado_cobertura    Texto    —    Nulo    Valores: pendiente,    Resultado de la validación de la cobertura
validada, rechazada. No    (RF-14)
nulo si tiene obra social
medico
Extiende usuario con los datos profesionales del médico. La sala cuenta con tres médicos, uno por especialidad.
Origen: RF-01, RF-04, RF-05, RF-34 · US-1.1, US-4.3
Campo    Tipo    Clave    Nulidad Restricciones    Descripción
id_usuario    Entero    PK, FK →    No nulo El usuario debe tener rol    Identificador del médico (el mismo que su
usuario    medico    usuario)
matricula    Texto    —    No nulo Única    Matrícula profesional
especialidad    Texto    —    No nulo Valores: clinico, pediatra,    Especialidad del médico; hay un médico por
traumatologo. Única    especialidad
duracion_consulta    Entero    —    No nulo Mayor a 0    Duración de cada consulta en minutos.
Define los horarios reservables (RF-01)
valor_consulta    Decimal    —    No nulo Mayor o igual a 0    Valor de la consulta particular que define el
médico (RF-34)
2. Agenda médica
horario_atencion
Patrón fijo de atención de cada médico: días de la semana y franja horaria. Se repite todos los meses y a partir de él se
abre la agenda pública. El médico lo carga una sola vez; luego solo el administrador puede modificarlo.
Diccionario de datos · Comisión 10 · Página 2
```

## Página 3

```text
Origen: RF-01, RF-02, RF-27 · US-1.1, US-1.2, US-1.5
Campo    Tipo    Clave    Nulidad Restricciones    Descripción
id_horario    Entero    PK    No nulo —    Identificador de la franja
id_medico    Entero    FK → medico No nulo —    Médico al que pertenece la franja
dia_semana    Texto    —    No nulo Valores: lunes a domingo    Día de la semana en que atiende
hora_inicio    Hora    —    No nulo —    Inicio de la franja
hora_fin    Hora    —    No nulo Mayor a hora_inicio    Fin de la franja
id_usuario_modificacion    Entero    FK → usuario Nulo    Solo rol administrador    Último administrador que modificó la
franja (RF-27). Nulo si nunca se modificó
fecha_modificacion    FechaHora —    Nulo    —    Momento de la última modificación
Reglas de la tabla
Cada médico atiende como máximo dos días distintos por semana.
Las franjas de un mismo médico no pueden superponerse.
Si el administrador modifica un horario, los turnos reservados que queden fuera pasan a cancelado con motivo y se
notifica al paciente.
bloqueo_agenda
Período en que un médico no atiende por licencia, feriado o imprevisto. Puede cubrir desde un único turno hasta días
completos. Los feriados se cargan por médico, solo si ese médico decide no atender.
Origen: RF-03, RF-09, RF-28 · US-1.3, US-1.6, US-2.6
Campo    Tipo    Clave    Nulidad Restricciones    Descripción
id_bloqueo    Entero    PK    No nulo —    Identificador del bloqueo
id_medico    Entero    FK → medico No nulo —    Médico cuya agenda se bloquea
fecha_hora_desde    FechaHora —    No nulo —    Inicio del período bloqueado
fecha_hora_hasta    FechaHora —    No nulo Mayor a fecha_hora_desde Fin del período bloqueado
motivo    Texto    —    No nulo Valores: licencia, feriado,    Causa del bloqueo. no_disponible
imprevisto, no_disponible    corresponde a un turno puntual (RF-28)
descripcion    Texto    —    Nulo    —    Detalle adicional; se incluye en el aviso al
paciente (RF-10)
id_usuario_registro    Entero    FK → usuario No nulo Rol medico o administrador Quién cargó el bloqueo
fecha_registro    FechaHora —    No nulo —    Momento en que se cargó
Reglas de la tabla
Los turnos reservados que caen dentro del período pasan a cancelado, con el motivo del bloqueo.
3. Turnos médicos
turno
Turno reservado por un paciente con un médico. Solo existen como filas los turnos reservados; los horarios disponibles
se obtienen del horario de atención, descontando bloqueos y turnos ya tomados.
Origen: RF-04 a RF-10, RF-29, RF-30 · US-1.4, US-2.1 a US-2.9
Campo    Tipo    Clave    Nulidad Restricciones    Descripción
id_turno    Entero    PK    No nulo —    Identificador del turno
id_paciente    Entero    FK →    No nulo —    Paciente del turno
paciente
Diccionario de datos · Comisión 10 · Página 3
```

## Página 4

```text
Campo    Tipo    Clave    Nulidad Restricciones    Descripción
id_medico    Entero    FK → medico No nulo —    Médico que atiende
fecha_hora_inicio    FechaHora —    No nulo Dentro del horario de    Inicio del turno
atención y fuera de
bloqueos
fecha_hora_fin    FechaHora —    No nulo Inicio + duración de    Fin del turno
consulta del médico
estado    Texto    —    No nulo Valores: reservado,    Estado del turno
cancelado, atendido,
ausente
id_usuario_reserva    Entero    FK → usuario No nulo Rol paciente o    Quién reservó: el paciente (RF-06) o el
administrador    administrador a pedido presencial (RF-30)
fecha_reserva    FechaHora —    No nulo —    Momento de la reserva
id_usuario_cancelacion    Entero    FK → usuario Nulo    No nulo si estado =    Quién canceló el turno
cancelado
motivo_cancelacion    Texto    —    Nulo    No nulo si canceló un    Causa de la cancelación, informada al
médico o el administrador    paciente (RF-10)
fecha_cancelacion    FechaHora —    Nulo    No nulo si estado =    Momento de la cancelación
cancelado
fecha_registro_asistencia    FechaHora —    Nulo    No nulo si estado =    Momento en que el médico registró la
atendido o ausente    asistencia (RF-29)
Reglas de la tabla
Un médico no puede tener dos turnos no cancelados con el mismo inicio.
No se reservan turnos en fechas pasadas.
Atendido y ausente solo se registran desde la fecha del turno.
Si el paciente no asiste (ausente), no se le devuelve el pago realizado al reservar el turno.
Un turno cancelado no se reprograma: el paciente reserva un turno nuevo.
4. Vacunas
vacuna
Catálogo de vacunas que maneja la sala, con su nivel de stock crítico. Las enfermeras pueden incorporar vacunas nuevas.
Origen: RF-11, RF-32, RF-33 · US-3.1, US-3.3
Campo    Tipo    Clave    Nulidad Restricciones    Descripción
id_vacuna    Entero    PK    No nulo —    Identificador de la vacuna
nombre    Texto    —    No nulo Único    Nombre o tipo de vacuna (p. ej. antigripal)
nivel_critico    Entero    —    Nulo    Mayor o igual a 0    Cantidad mínima de dosis por debajo de la
cual se genera una alerta (RF-32). Nulo
mientras no se defina
id_usuario_alta    Entero    FK → usuario No nulo Rol enfermera o    Quién dio de alta la vacuna (RF-33)
administrador
fecha_alta    FechaHora —    No nulo —    Momento del alta
Reglas de la tabla
El stock de una vacuna no se almacena: es la suma del stock de sus lotes no vencidos.
lote
Lote de una vacuna recibido por la sala.
Diccionario de datos · Comisión 10 · Página 4
```

## Página 5

```text
Origen: RF-11 · US-3.2
Campo    Tipo    Clave    Nulidad Restricciones    Descripción
id_lote    Entero    PK    No nulo —    Identificador del lote
id_vacuna    Entero    FK → vacuna No nulo —    Vacuna a la que pertenece
numero_lote    Texto    —    No nulo Único por vacuna    Número de lote del fabricante
fecha_vencimiento    Fecha    —    No nulo —    Vencimiento del lote. Un lote vencido no se
asigna a turnos
id_usuario_registro    Entero    FK → usuario No nulo Rol enfermera o    Quién registró el lote
administrador
fecha_registro    FechaHora —    No nulo —    Momento del registro
Reglas de la tabla
La cantidad disponible no se almacena: es la suma de los movimientos del lote y nunca puede ser negativa.
movimiento_stock
Registro de cada entrada o salida de dosis de un lote. Es inmutable: los movimientos no se modifican ni se eliminan; un
error se corrige con un movimiento de ajuste.
Origen: RF-11, RF-12, RF-20, RF-31 · US-3.2, US-3.6, US-6.2
Campo    Tipo    Clave    Nulidad Restricciones    Descripción
id_movimiento    Entero    PK    No nulo —    Identificador del movimiento
id_lote    Entero    FK → lote    No nulo —    Lote afectado
tipo    Texto    —    No nulo Valores: ingreso,    ingreso: carga de dosis. asignacion_turno:
asignacion_turno,    aprobación de un turno de vacunación.
devolucion_turno, ajuste    devolucion_turno: cancelación o ausencia
de un turno aprobado. ajuste: corrección
cantidad    Entero    —    No nulo Distinta de 0. Positiva en    Dosis que suma (positiva) o resta
ingreso y    (negativa)
devolucion_turno; −1 en
asignacion_turno
id_turno_vacunacion    Entero    FK →    Nulo    No nulo en    Turno que originó el movimiento
turno_vacunacion    asignacion_turno y
devolucion_turno
motivo    Texto    —    Nulo    No nulo en ajuste    Explicación de la corrección
id_usuario    Entero    FK → usuario    No nulo Rol enfermera o    Quién registró el movimiento
administrador    (trazabilidad, US-3.2)
fecha_hora    FechaHora —    No nulo —    Momento del movimiento
alerta_stock
Alerta generada cuando el stock total de una vacuna cae por debajo de su nivel crítico.
Origen: RF-13, RF-32 · US-3.4
Campo    Tipo    Clave    Nulidad Restricciones    Descripción
id_alerta    Entero    PK    No nulo —    Identificador de la alerta
id_vacuna    Entero    FK → vacuna No nulo —    Vacuna con stock bajo
stock_al_generarse    Entero    —    No nulo Mayor o igual a 0    Stock total de la vacuna en ese momento
nivel_critico_al_generarse    Entero    —    No nulo —    Nivel crítico vigente en ese momento
estado    Texto    —    No nulo Valores: activa, resuelta    resuelta cuando el stock vuelve a superar el
nivel crítico
fecha_generacion    FechaHora —    No nulo —    Momento en que se generó
Diccionario de datos · Comisión 10 · Página 5
```

## Página 6

```text
Campo    Tipo    Clave    Nulidad Restricciones    Descripción
fecha_resolucion    FechaHora —    Nulo    No nulo si estado = resuelta Momento en que se resolvió
Reglas de la tabla
Hay como máximo una alerta activa por vacuna.
horario_vacunacion
Franjas semanales en que el vacunatorio da turnos. Las definen las enfermeras o el administrador.
Origen: RF-12 · US-3.6
Campo    Tipo    Clave    Nulidad Restricciones    Descripción
id_horario_vacunacion    Entero    PK    No nulo —    Identificador de la franja
dia_semana    Texto    —    No nulo Valores: lunes a domingo    Día de la semana
hora_inicio    Hora    —    No nulo —    Inicio de la franja
hora_fin    Hora    —    No nulo Mayor a hora_inicio    Fin de la franja
duracion_turno    Entero    —    No nulo Mayor a 0    Duración de cada turno de vacunación en
minutos
id_usuario_registro    Entero    FK → usuario No nulo Rol enfermera o    Quién cargó o modificó la franja por última
administrador    vez
fecha_registro    FechaHora —    No nulo —    Momento de la última carga o modificación
Reglas de la tabla
Las franjas no pueden superponerse.
turno_vacunacion
Solicitud y turno de vacunación. El paciente lo pide en forma presencial, lo registra una enfermera o el administrador, y
queda pendiente hasta que se aprueba o rechaza.
Origen: RF-12, RF-31 · US-3.6
Campo    Tipo    Clave    Nulidad Restricciones    Descripción
id_turno_vacunacion    Entero    PK    No nulo —    Identificador del turno
id_paciente    Entero    FK →    No nulo —    Paciente a vacunar
paciente
id_vacuna    Entero    FK → vacuna No nulo —    Vacuna solicitada
id_lote    Entero    FK → lote    Nulo    No nulo desde que estado = Lote asignado al aprobar: el de
aprobado. El lote debe ser    vencimiento más próximo con stock
de la misma vacuna
fecha_hora    FechaHora —    No nulo Dentro de un horario de    Fecha y hora del turno
vacunación
estado    Texto    —    No nulo Valores: pendiente,    Estado del turno
aprobado, rechazado,
aplicado, cancelado,
ausente
id_usuario_registro    Entero    FK → usuario No nulo Rol enfermera o    Quién registró la solicitud
administrador
fecha_solicitud    FechaHora —    No nulo —    Momento de la solicitud
id_usuario_resolucion    Entero    FK → usuario Nulo    Rol enfermera o    Quién aprobó o rechazó (RF-31)
administrador. No nulo si
fue aprobado o rechazado
fecha_resolucion    FechaHora —    Nulo    No nulo si fue aprobado o    Momento de la aprobación o rechazo
rechazado
Diccionario de datos · Comisión 10 · Página 6
```

## Página 7

```text
Campo    Tipo    Clave    Nulidad Restricciones    Descripción
motivo_rechazo    Texto    —    Nulo    No nulo si estado =    Causa del rechazo, informada al paciente
rechazado
motivo_cancelacion    Texto    —    Nulo    —    Causa de la cancelación
fecha_cancelacion    FechaHora —    Nulo    No nulo si estado =    Momento de la cancelación
cancelado
fecha_aplicacion    FechaHora —    Nulo    No nulo si estado = aplicado Momento en que se aplicó la vacuna
id_usuario_aplicacion    Entero    FK → usuario Nulo    Rol enfermera. No nulo si    Enfermera que aplicó la vacuna
estado = aplicado
Reglas de la tabla
Solo se aprueba si la vacuna tiene stock disponible; al aprobar se registra un movimiento asignacion_turno.
Si un turno aprobado se cancela o el paciente falta, la dosis vuelve al mismo lote con un movimiento
devolucion_turno.
5. Pagos y coberturas
obra_social
Catálogo de obras sociales y prepagas aceptadas por la sala.
Origen: RF-14 · US-4.1, US-4.2
Campo    Tipo    Clave    Nulidad Restricciones    Descripción
id_obra_social    Entero    PK    No nulo —    Identificador de la obra social
nombre    Texto    —    No nulo Único    Nombre de la obra social o prepaga
aceptada    Booleano —    No nulo —    Indica si la sala la acepta actualmente
pago
Pago registrado de un turno por la consulta particular. Solo se registra una vez confirmado.
Origen: RF-15, RF-21, RF-35 · US-4.4, US-4.7, US-6.3
Campo    Tipo    Clave    Nulidad Restricciones    Descripción
id_pago    Entero    PK    No nulo —    Identificador del pago
id_turno    Entero    FK → turno    No nulo Único    Turno al que corresponde el pago
monto    Decimal    —    No nulo Mayor a 0    Importe; se toma del valor de consulta del
médico al momento del pago (RF-34)
medio_pago    Texto    —    No nulo —    Medio utilizado (p. ej. pasarela de pago
online)
codigo_transaccion    Texto    —    Nulo    —    Identificador de la operación informado
por la pasarela de pago
id_usuario_registro    Entero    FK → usuario No nulo Rol paciente o    Quién registró el pago
administrador
fecha_hora    FechaHora —    No nulo —    Momento del pago
Reglas de la tabla
Hay como máximo un pago por turno.
comprobante
Comprobante o factura digital emitido por un pago, descargable por el paciente.
Diccionario de datos · Comisión 10 · Página 7
```

## Página 8

```text
Origen: RF-16 · US-4.5, US-4.6
Campo    Tipo    Clave    Nulidad Restricciones    Descripción
id_comprobante    Entero    PK    No nulo —    Identificador del comprobante
id_pago    Entero    FK → pago    No nulo Único    Pago que respalda (un comprobante por
pago)
numero    Texto    —    No nulo Único    Número del comprobante
tipo    Texto    —    No nulo Valores: A, B, C    Tipo de factura electrónica
monto_total    Decimal    —    No nulo Igual al monto del pago    Importe facturado
fecha_emision    FechaHora —    No nulo —    Momento de emisión
archivo    Texto    —    No nulo —    Ubicación del archivo PDF para su descarga
6. Historia clínica
registro_clinico
Diagnóstico, indicaciones y tratamiento cargados por el médico sobre un turno atendido. El conjunto de registros de un
paciente forma su historia clínica.
Origen: RF-17, RF-18 · US-5.1, US-5.2
Campo    Tipo    Clave    Nulidad Restricciones    Descripción
id_registro    Entero    PK    No nulo —    Identificador del registro
id_turno    Entero    FK → turno    No nulo Único. El turno debe estar    Atención a la que corresponde; de ella se
atendido    obtienen paciente, médico y fecha
diagnostico    Texto    —    No nulo —    Diagnóstico del médico
indicaciones    Texto    —    Nulo    —    Indicaciones al paciente
tratamiento    Texto    —    Nulo    —    Tratamiento indicado
fecha_registro    FechaHora —    No nulo —    Momento de la carga
Reglas de la tabla
Solo lo carga el médico del turno.
El paciente consulta únicamente sus propios registros (RF-18).
Los registros no se modifican ni se eliminan (Ley 26.529).
Diccionario de datos · Comisión 10 · Página 8
```
