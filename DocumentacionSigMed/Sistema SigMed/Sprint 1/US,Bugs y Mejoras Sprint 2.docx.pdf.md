# US,Bugs y Mejoras Sprint 2.docx

Fuente: [US,Bugs y Mejoras Sprint 2.docx.pdf](US,Bugs%20y%20Mejoras%20Sprint%202.docx.pdf).

Texto extraído del PDF, separado por página. Los saltos de línea siguen el documento; la distribución visual debe consultarse en el original.


## Página 1

REQUERIMIENTOS DE MAYOR PRIORIDAD — SPRINT 2  
SIGMED | Comisiones 10 (Análisis) y 9 (Implementadora)  
00—Observación sobre la planificación  
Durante el Sprint 1 se implementaron algunas User Stories y funcionalidades que originalmente  
estaban planificadas para los Sprint 2 y 3 como stock crítico que estaba pensado para el sprint 3 .  
Por este motivo, se revisó la planificación del proyecto para reflejar el avance real y evitar incluir  
nuevamente funcionalidades ya desarrolladas.  
En este documento se presentan las User Stories previstas para el Sprint 2, junto con los bugs y las  
propuestas de mejora identificados durante el Sprint 1, para su correspondiente evaluación y  
priorización.  
01 —User Stories previstas  
MÓDULO 1 · GESTIÓN DE AGENDA MÉDICA  
US-1.1 — Disponibilidad mensual (RF-01)  
Como médico quiero definir mi disponibilidad mensual (días, horarios y duración de consulta) para  
que los pacientes puedan reservar turnos.  
Tareas:  
1.1.1 Crear interfaz de calendario de disponibilidad.  
1.1.2 Implementar backend de cálculo y registro.  
1.1.3 Integrar y comprobar la persistencia.  
Criterios de aceptación:  
CA1: El médico registra días y franjas de atención y los datos aparecen al consultar su agenda.  
CA2: Los horarios inválidos se rechazan con un mensaje claro.  
Diseño:  

## Página 2

US-1.2 — Publicación automática de la agenda (RF-02)  
Como paciente quiero que la agenda se publique automáticamente según la disponibilidad del  
médico para poder reservar sin intervención manual.  
Tareas:  
1.2.1 Implementar reglas de publicación y vista de agenda.  
1.2.2 Desarrollar backend de generación/publicación.  
1.2.3 Integrar agenda con disponibilidad registrada.  
Criterios de aceptación:  
CA1: Al guardar una disponibilidad válida, se publican los espacios correspondientes.  
CA2: No se ofrecen franjas fuera de la disponibilidad ni ocupadas.  
Diseño:No lleva diseño, funcionalidad automática del backend  
MÓDULO 2 · RESERVA DE TURNOS  
US-2.1 — Búsqueda de turnos disponibles (RF-05)  
Como paciente quiero buscar turnos de por especialidad, médico o fecha para encontrar uno que  
me sirva.  
Tareas:  
2.1.1 Diseñar panel de filtros y lista de horarios.  
2.1.2 Implementar consultas por criterios combinados.  
2.1.3 Integrar frontend y backend.  
Criterios de aceptación:  
CA1: Los resultados coinciden con los filtros seleccionados.  
CA2: Los espacios no disponibles no aparecen y los casos sin resultados se informan.  
Diseño:  

## Página 3

US-2.2 — Confirmación del turno (RF-06)  
Como paciente quiero confirmar mi turno reservado para asegurar mi lugar.  
Tareas:  
2.2.1 Diseñar pantalla de resumen y confirmación.  
2.2.2 Implementar cambio de estado y validaciones de concurrencia.  
2.2.3 Integrar flujo de confirmación.  
Criterios de aceptación:  
CA1: Al confirmar una reserva válida, cambia el estado del turno a Confirmado.  
CA2: No se confirma una reserva ajena o inválida ni se generan dobles reservas.  
Diseño:  

## Página 4

US-2.8 — Registro de asistencia del paciente (RF-29)  
Como médico quiero registrar si el paciente asistió al turno para llevar el control de presentismo.  
Tareas:  
2.8.1 Agregar controles Atendido/Ausente en la hoja de trabajo.  
2.8.2 Implementar cambio de estado en backend.  
2.8.3 Integrar y comprobar actualización de turnos.  
Criterios de aceptación:  
CA1: El médico cambia sus turnos a Atendido o Ausente y el cambio persiste.  
CA2: No puede actualizar el turno de otro profesional.  
Diseño:  

## Página 5

MÓDULO 5 · HISTORIAL CLÍNICO  
US-5.1 — Registrar diagnóstico e indicaciones (RF-17)  
Como médico quiero cargar diagnósticos, indicaciones y tratamientos en la ficha del paciente para  
mantener su historial clínico.  
Tareas:  
5.1.1 Diseñar formulario de evolución médica.  
5.1.2 Guardar diagnóstico, tratamiento e indicaciones asociados al turno y paciente.  
5.1.3 Integrar con el historial del paciente.  
Criterios de aceptación:  
CA1: Se registra la información clínica en la ficha del paciente correcto.  
CA2: El historial permite visualizarla y se protegen los registros frente a acceso no autorizado.  
Diseño:  
MÓDULO 7 · ACCESO, AUTENTICACIÓN Y USUARIOS  
US-7.1 — Registro de pacientes (RF-22)  
Como paciente quiero registrarme en la plataforma para utilizar sus servicios.  
Tareas:  
7.1.1 Crear formulario de registro.  
7.1.2 Implementar validaciones y alta de usuarios.  
7.1.3 Integrar registro con autenticación.  
Criterios de aceptación:  
CA1: Los datos válidos crean cuenta con rol Paciente.  
CA2: Los registros duplicados e inválidos se rechazan.  
Diseño:  

## Página 6

US-7.2 — Inicio de sesión (RF-23)  
Como usuario quiero iniciar sesión con correo y contraseña para acceder a mi cuenta.  
Tareas:  
7.2.1 Implementar formulario de acceso.  
7.2.2 Desarrollar backend de autenticación y sesión.  
7.2.3 Integrar navegación y cierre de sesión.  
Criterios de aceptación:  
CA1: Las credenciales correctas dan acceso a la interfaz del rol.  
CA2: Las credenciales incorrectas son rechazadas.  
CA3: Las rutas protegidas requieren sesión válida.  
Diseño:  
Pendiente de revisión: En Sprint 1 se usó selector de usuarios de prueba.  
US-7.3 — Registro del personal (RF-24)  
Como administrador quiero crear cuentas de médicos y enfermeras con su rol al momento del alta  
para que puedan operar en el sistema.  
Tareas:  
7.3.1 Crear interfaz de alta.  

## Página 7

7.3.2 Implementar creación y asignación de rol.  
7.3.3 Integrar permisos y validaciones.  
Criterios de aceptación:  
CA1: El administrador registra personal y asigna rol al crear la cuenta.  
CA2: Un usuario no administrador no puede efectuar el alta.  
Diseño:  
US-7.4 — Interfaz diferenciada por rol (RF-25)  
Como usuario quiero visualizar solamente las acciones y pantallas de mi rol para utilizar el sistema  
sin confusiones.  
Tareas:  
7.4.1 Implementar navegación y protección de rutas por rol.  
7.4.2 Agregar autorización en backend.  
7.4.3 Probar los cuatro roles.  
Criterios de aceptación:  
CA1: Cada rol visualiza solamente las acciones permitidas.  
CA2: El acceso directo por URL no permite ejecutar acciones ajenas al rol.  
Diseño:  
US-7.5 — Funciones de médico y paciente para el administrador (RF-26)  
Como administrador quiero acceder a las funciones de médico y paciente para cubrir esas tareas  
cuando haga falta.  
Tareas:  
7.5.1 Diseñar navegación para funciones adicionales del administrador.  
7.5.2 Implementar permisos sin exigir otra cuenta.  

## Página 8

7.5.3 Integrar auditoría de operaciones.  
Criterios de aceptación:  
CA1: El administrador puede ejecutar funciones médicas y de paciente autorizadas.  
CA2: Los demás roles no adquieren permisos administrativos.  
Diseño:  
02 —Correcciones y mejoras del Sprint 1 (SigMed)  
SIG-BUG-01 — Corrección visual del área del médico  
Descripción: La pantalla del médico se ve cortada, con un gran espacio negro que no se  
aprovecha y afecta su presentación.  
Tareas:  
SIG-BUG-01.1 Revisar contenedores, alturas y fondos.  
SIG-BUG-01.2 Corregir maquetación y probar diferentes tamaños de ventana.  
Criterios de aceptación:  
CA1: La pantalla utiliza el espacio sin un bloque negro innecesario.  
CA2: La interfaz mantiene consistencia con las demás áreas.  
Estado: Corrección solicitada por el profesor.  
Diseño/Evidencia:  
No se requiere una nueva wireframe, ya que la corrección consiste en ajustar la distribución visual  
de una pantalla existente, sin modificar su funcionalidad.  
Se adjunta una captura del estado actual de la pantalla del médico, donde se observa el espacio  
negro que debe corregirse.  

## Página 9

SIG-MEJ-01 — Cambiar encabezado del historial clínico  
Descripción: El encabezado Acciones describe de manera genérica un botón Detalle que despliega  
indicaciones médicas. El profesor sugirió Observaciones o Diagnóstico; se propone evaluar  
Indicaciones o Detalle clínico.  
Tareas:  
SIG-MEJ-01.1 Acordar rótulo con el cliente.  
SIG-MEJ-01.2 Actualizar encabezado y botón, conservando la expansión de las indicaciones.  
Criterios de aceptación:  
CA1: El nombre de la columna representa el contenido disponible.  
CA2: Se visualizan y ocultan las indicaciones correctas de cada atención.  
Estado: Texto definitivo pendiente de aprobación.  
Diseño:  
No se requiere una nueva wireframe, ya que la mejora consiste únicamente en modificar la  
denominación de elementos existentes en la tabla del historial clínico.  
Se deberá reemplazar el encabezado «Acciones» por una denominación acordada con el cliente,  
manteniendo la funcionalidad que permite desplegar y ocultar las indicaciones médicas de cada  
atención.  
SIG-BUG-02 — Normalización del buscador del historial  
Descripción: Al buscar «infección» sin tilde no aparece el diagnóstico «Infección respiratoria alta»,  
aunque las búsquedas «alta» y «ALTA» sí encuentran la atención.  
Tareas:  
SIG-BUG-02.1 Confirmar y reproducir caso con tildes.  
SIG-BUG-02.2 Normalizar acentos sin afectar las búsquedas.  
SIG-BUG-02.3 Agregar pruebas de regresión.  
Criterios de aceptación:  
CA1: Buscar «infección» encuentra «Infección».  
CA2: Las búsquedas son insensibles a mayúsculas y minúsculas.  
Estado: Posible bug sujeto a verificación.  
Diseño:  

## Página 10

No se requiere una nueva wireframe, ya que la mejora utiliza el buscador existente en la pantalla  
«Mi historial clínico».  
Se propone agregar debajo del campo de búsqueda el texto de ayuda «Buscar por profesional,  
diagnóstico o tratamiento» y ampliar su funcionamiento para permitir búsquedas sobre esos tres  
campos.  
SIG-MEJ-02 — Búsqueda por profesional en historial  
Descripción: Al buscar «Martín» no se encuentra una atención del médico Martín Gómez. No se  
aclara si la búsqueda contempla el nombre del profesional; se propone ampliarla.  
Tareas:  
SIG-MEJ-02.1 Definir campos buscables.  
SIG-MEJ-02.2 Agregar nombre/apellido del médico y texto de ayuda.  
SIG-MEJ-02.3 Verificar separación de historiales por paciente.  
Criterios de aceptación:  
CA1: El campo indica qué información admite.  
CA2: Se puede encontrar una atención por profesional, si se aprueba.  
CA3: No se exponen registros de otros pacientes.  
Observación:Expande lo solicitado por el requerimiento funcional 18  
Diseño:  
SIG-MEJ-03 — Simplificar ajuste de stock de vacunas  
Descripción: El formulario exige ingresar un número negativo, como -5, para descontar dosis. Se  
propone seleccionar expresamente Sumar dosis o Descontar dosis y escribir siempre una cantidad  
positiva.  
Tareas:  
SIG-MEJ-03.1 Incorporar selección de operación.  
SIG-MEJ-03.2 Validar enteros positivos y aplicar el signo internamente.  
SIG-MEJ-03.3 Verificar trazabilidad y evitar stock negativo.  

## Página 11

Criterios de aceptación:  
CA1: El usuario elige Sumar o Descontar y escribe un número positivo.  
CA2: No se permite descontar más dosis de las disponibles.  
CA3: El movimiento registra lote, motivo, responsable y cantidad.  
Estado: Mejora de usabilidad propuesta.  
Diseño:  
SIG-MEJ-04 — Mejorar los mensajes cuando no hay horarios disponibles para  
vacunación  
Descripción: Al seleccionar una fecha para asignar un turno de vacunación, puede ocurrir que no  
existan horarios disponibles. En ese caso, el campo «Horario asignado» muestra el mensaje «No  
hay horarios libres».  
Sin embargo, si el usuario presiona «Confirmar turno», el sistema muestra un mensaje de error en  
rojo que dice «El horario es obligatorio», a pesar de que no existen horarios disponibles para  
seleccionar.  
Se propone mejorar los mensajes de validación para informar claramente que la fecha  
seleccionada no tiene horarios disponibles y orientar al usuario a elegir otra fecha.  
Tareas:  
SIG-MEJ-04.1 Mostrar un mensaje informativo cuando la fecha seleccionada no tenga horarios  
disponibles.  
SIG-MEJ-04.2 Modificar la validación del formulario para que, al intentar confirmar un turno sin  
horarios disponibles, se indique que no hay turnos libres para la fecha seleccionada, en lugar de  
mostrar «El horario es obligatorio».  

## Página 12

SIG-MEJ-04.3 Permitir que, al seleccionar otra fecha con disponibilidad, se actualicen  
automáticamente los horarios libres correspondientes.  
Criterios de aceptación:  
CA1: Cuando el usuario selecciona una fecha sin horarios disponibles, el sistema muestra un  
mensaje indicando que no hay turnos libres para ese día.  
CA2: Si el usuario intenta confirmar un turno en una fecha sin disponibilidad, el sistema impide la  
operación y muestra un mensaje claro, como «No hay horarios disponibles para la fecha  
seleccionada. Elegí otra fecha».  
CA3: Cuando el usuario selecciona una fecha con disponibilidad, el campo «Horario asignado»  
muestra los horarios libres correspondientes y permite seleccionar uno.  
CA4: El mensaje «El horario es obligatorio» solamente aparece cuando existen horarios  
disponibles, pero el usuario intenta confirmar el turno sin seleccionar ninguno.  
Estado: Mejora de usabilidad propuesta.  
Diseño:  
03 — Observaciones complementarias, a validar antes de planificar  
Regla de duración de turnos  
Se había conversado una duración fija de 60 minutos para consultas médicas y 30 para  
vacunación, pero la interfaz de horarios ofrece 15, 20, 30 y 60 minutos. Confirmar regla y corregir si  
corresponde.  

## Página 13

Integración de los módulos  
En Sprint 1 se navegaron componentes mediante URLs manuales. Verificar y planificar la  
integración de los flujos que sí corresponden al Sprint 2.  
04 — Continuidad de historias ya iniciadas en Sprint 1  
US-1.5 (RF-27): completar backend, solapamientos y efectos sobre turnos vigentes.  
US-3.2 (RF-11): completar lógica de inventario y trazabilidad e integración.  
US-3.6 (RF-12): completar integración de asignación y descuento/reserva de stock.  
US-5.2 (RF-18): completar consulta del historial desde backend y controles de seguridad.  
Estas tareas figuran en el plan técnico compartido; verificar qué parte ya está implementada antes  
de añadirlas al Sprint 2.
