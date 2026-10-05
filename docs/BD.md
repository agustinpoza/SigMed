---
system: Sistema de Gestión de Sala Médica PSS 2026 - Comisión 10
version: 1.0.0
last_updated: 2026-09-30
target_audience: AI_Agents / LLM_Context / Code_Generation
entities_count: 16
modules_count: 6
conventions:
  data_types: [Entero, Decimal, Texto, Booleano, Fecha, Hora, FechaHora]
  keys:
    PK: Primary Key
    FK: Foreign Key (target: table_name)
  nullability:
    not_null: Obligatorio
    nullable: Opcional / Dependiente de estado
---

# Diccionario de Datos y Reglas de Negocio - Sala Médica

Este documento contiene la especificación formal del modelo relacional, restricciones de integridad, máquinas de estado y reglas de negocio para el sistema de gestión de la sala médica.

---

## 0. Arquitectura de Estado y Reglas Globales

1. **Estado derivado / Valores calculados (No persistidos):**
   - **Stock de Lote:** Suma algebraica de `movimiento_stock.cantidad` asociados al lote. Invariante: $\text{Stock} \ge 0$.
   - **Stock de Vacuna:** Suma del stock de todos sus lotes no vencidos (`fecha_vencimiento >= fecha_actual`).
   - **Horarios Disponibles:** Se computan proyectando `horario_atencion` menos `bloqueo_agenda` y menos turnos en estado `reservado` o `atendido`.
2. **Inmutabilidad y Auditoría:**
   - `movimiento_stock` y `registro_clinico` son tablas **append-only**. Queda estrictamente prohibido realizar operaciones `UPDATE` o `DELETE` (respaldado por trazabilidad operativa y Ley 26.529). Correcciones en stock se hacen exclusivamente mediante movimientos de tipo `ajuste`.
3. **Reportes Administrativos (RF-19, RF-20, RF-21):**
   - No poseen tablas físicas dedicadas. Deben inferirse agregando `turno`, `movimiento_stock` y `pago`.

---

## Módulo 1: Usuarios y Acceso

### `usuario`
- **Descripción:** Entidad base de usuarios (pacientes, médicos, enfermeras y administradores). Representa la identidad del sistema integrada con el proveedor de autenticación.
- **Trazabilidad:** RF-22, RF-23, RF-24, RF-25, RF-26 | US-7.1, US-7.2, US-7.3, US-7.4, US-7.5

| Campo | Tipo | Clave | Nulidad | Restricciones / Enums | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id_usuario` | Entero | PK | No nulo | Autoincremental / Único | Identificador del usuario |
| `nombre` | Texto | | No nulo | | Nombre de la persona |
| `apellido` | Texto | | No nulo | | Apellido de la persona |
| `dni` | Texto | | No nulo | Único | Documento Nacional de Identidad |
| `email` | Texto | | No nulo | Único, formato email válido | Correo para inicio de sesión y avisos |
| `rol` | Texto | | No nulo | `paciente`, `medico`, `enfermera`, `administrador` | Inmutable tras la creación |
| `fecha_alta` | FechaHora | | No nulo | | Timestamp de creación |
| `clerk_user_id` | Texto | | No nulo | Único | ID externo del proveedor Clerk |

**Reglas de Negocio:**
- Pacientes se auto-registran (`RF-22`).
- Médicos y enfermeras solo pueden ser dados de alta por un `administrador` (`RF-24`).
- Administradores y enfermeras no poseen tablas de extensión (sus atributos residen únicamente en `usuario`).

---

### `paciente`
- **Descripción:** Extensión 1:1 de `usuario` con rol `paciente`. Soporta la cobertura médica (máximo una por paciente).
- **Trazabilidad:** RF-14, RF-22 | US-4.1, US-4.2, US-7.1

| Campo | Tipo | Clave | Nulidad | Restricciones / Enums | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id_usuario` | Entero | PK, FK → usuario | No nulo | `usuario.rol == 'paciente'` | Identificador del paciente |
| `id_obra_social` | Entero | FK → obra_social | Nulo | | Si es Nulo, el paciente es particular |
| `numero_afiliado`| Texto | | Nulo | No nulo si `id_obra_social` no es nulo | Identificador ante la obra social |
| `plan` | Texto | | Nulo | | Plan médico de la cobertura |
| `estado_cobertura`| Texto | | Nulo | `pendiente`, `validada`, `rechazada`. Obligatorio si tiene obra social | Estado de validación ante la obra social |

---

### `medico`
- **Descripción:** Extensión 1:1 de `usuario` con rol `medico`. Almacena credenciales profesionales y tarifario base.
- **Trazabilidad:** RF-01, RF-04, RF-05, RF-34 | US-1.1, US-4.3

| Campo | Tipo | Clave | Nulidad | Restricciones / Enums | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id_usuario` | Entero | PK, FK → usuario | No nulo | `usuario.rol == 'medico'` | Identificador del médico |
| `matricula` | Texto | | No nulo | Única | Matrícula profesional habilitante |
| `especialidad` | Texto | | No nulo | Única global. Valores: `clinico`, `pediatra`, `traumatologo` | La sala opera con exactamente un médico por especialidad |
| `duracion_consulta` | Entero | | No nulo | Valor $> 0$ (minutos) | Intervalo base para discretizar la agenda |
| `valor_consulta` | Decimal | | No nulo | Valor $\ge 0$ | Arancel particular fijado por el médico |

---

## Módulo 2: Agenda Médica

### `horario_atencion`
- **Descripción:** Franjas horarias fijas recurrentes semanales configuradas para cada médico.
- **Trazabilidad:** RF-01, RF-02, RF-27 | US-1.1, US-1.2, US-1.5

| Campo | Tipo | Clave | Nulidad | Restricciones / Enums | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id_horario` | Entero | PK | No nulo | | Identificador de la franja semanal |
| `id_medico` | Entero | FK → medico | No nulo | | Médico propietario |
| `dia_semana` | Texto | | No nulo | `lunes`, `martes`, `miercoles`, `jueves`, `viernes`, `sabado`, `domingo` | Día de atención |
| `hora_inicio` | Hora | | No nulo | | Límite inferior de la franja |
| `hora_fin` | Hora | | No nulo | `hora_fin > hora_inicio` | Límite superior de la franja |
| `id_usuario_modificacion` | Entero | FK → usuario | Nulo | `usuario.rol == 'administrador'` | Auditoría de edición |
| `fecha_modificacion` | FechaHora | | Nulo | | Timestamp de última edición |

**Reglas de Negocio:**
- **Límite de días:** Cada médico atiende como máximo en dos días distintos de la semana.
- **Solapamiento:** Prohibida la superposición horaria para un mismo médico en el mismo día.
- **Efecto colateral:** Si un administrador modifica una franja horaria, los turnos en estado `reservado` que queden descalzados deben pasar automáticamente a `cancelado` con motivo descriptivo y emitir notificación.

---

### `bloqueo_agenda`
- **Descripción:** Períodos de indisponibilidad temporal (licencias, feriados específicos, emergencias o bloqueos puntuales de slots).
- **Trazabilidad:** RF-03, RF-09, RF-28 | US-1.3, US-1.6, US-2.6

| Campo | Tipo | Clave | Nulidad | Restricciones / Enums | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id_bloqueo` | Entero | PK | No nulo | | Identificador del bloqueo |
| `id_medico` | Entero | FK → medico | No nulo | | Médico bloqueado |
| `fecha_hora_desde` | FechaHora | | No nulo | | Inicio de la indisponibilidad |
| `fecha_hora_hasta` | FechaHora | | No nulo | `fecha_hora_hasta > fecha_hora_desde` | Fin de la indisponibilidad |
| `motivo` | Texto | | No nulo | `licencia`, `feriado`, `imprevisto`, `no_disponible` | Tipología del bloqueo (`no_disponible` es para turnos puntuales) |
| `descripcion` | Texto | | Nulo | | Justificación incluida en el aviso al paciente |
| `id_usuario_registro` | Entero | FK → usuario | No nulo | Rol `medico` o `administrador` | Operador que cargó el bloqueo |
| `fecha_registro` | FechaHora | | No nulo | | Timestamp de carga |

**Reglas de Negocio:**
- Los turnos reservados dentro del intervalo $[\text{fecha\_hora\_desde}, \text{fecha\_hora\_hasta}]$ se cancelan en cascada bajo el mismo motivo.
- Feriados no son globales en el sistema: se configuran médico por médico solo si deciden no atender.

---

## Módulo 3: Turnos Médicos

### `turno`
- **Descripción:** Instancia de reserva efectiva entre un paciente y un médico.
- **Trazabilidad:** RF-04 a RF-10, RF-29, RF-30 | US-1.4, US-2.1 a US-2.9

| Campo | Tipo | Clave | Nulidad | Restricciones / Enums | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id_turno` | Entero | PK | No nulo | | Identificador del turno |
| `id_paciente` | Entero | FK → paciente | No nulo | | Paciente asignado |
| `id_medico` | Entero | FK → medico | No nulo | | Médico asignado |
| `fecha_hora_inicio` | FechaHora | | No nulo | Debe coincidir con `horario_atencion` y no colisionar con `bloqueo_agenda` | Inicio del turno |
| `fecha_hora_fin` | FechaHora | | No nulo | `fecha_hora_inicio + duracion_consulta` | Fin calculado del turno |
| `estado` | Texto | | No nulo | `reservado`, `cancelado`, `atendido`, `ausente` | Ciclo de vida del turno |
| `id_usuario_reserva` | Entero | FK → usuario | No nulo | Rol `paciente` o `administrador` | Creador de la reserva |
| `fecha_reserva` | FechaHora | | No nulo | | Timestamp de reserva |
| `id_usuario_cancelacion` | Entero | FK → usuario | Nulo | No nulo si `estado == 'cancelado'` | Responsable de la baja |
| `motivo_cancelacion` | Texto | | Nulo | Obligatorio si cancela `medico` o `administrador` | Motivo de la cancelación |
| `fecha_cancelacion` | FechaHora | | Nulo | No nulo si `estado == 'cancelado'` | Timestamp de cancelación |
| `fecha_registro_asistencia`| FechaHora | | Nulo | No nulo si `estado` $\in$ {`atendido`, `ausente`} | Timestamp del pase de lista |

**Reglas de Negocio:**
- **Exclusión temporal:** Un médico no puede tener dos turnos concurrentes activos (no cancelados).
- **No retroactividad:** No se admiten reservas en fecha/hora previa a la actual.
- **Cierre de turno:** El estado solo puede pasar a `atendido` o `ausente` el mismo día de la cita o con posterioridad.
- **Política de no show:** Ante estado `ausente`, no existe reembolso del pago realizado.
- **No reprogramación directa:** Los turnos cancelados no se reabren; el paciente debe generar un nuevo registro de turno.

---

## Módulo 4: Vacunas y Stock

### `vacuna`
- **Descripción:** Catálogo maestro de biológicos gestionados por la sala.
- **Trazabilidad:** RF-11, RF-32, RF-33 | US-3.1, US-3.3

| Campo | Tipo | Clave | Nulidad | Restricciones / Enums | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id_vacuna` | Entero | PK | No nulo | | Identificador de la vacuna |
| `nombre` | Texto | | No nulo | Único | Denominación comercial o genérica |
| `nivel_critico` | Entero | | Nulo | $\ge 0$ | Umbral mínimo para disparar `alerta_stock` |
| `id_usuario_alta`| Entero | FK → usuario | No nulo | Rol `enfermera` o `administrador` | Usuario que registró la vacuna |
| `fecha_alta` | FechaHora | | No nulo | | Timestamp de alta en catálogo |

---

### `lote`
- **Descripción:** Partida física de dosis asociada a una vacuna.
- **Trazabilidad:** RF-11 | US-3.2

| Campo | Tipo | Clave | Nulidad | Restricciones / Enums | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id_lote` | Entero | PK | No nulo | | Identificador del lote |
| `id_vacuna` | Entero | FK → vacuna | No nulo | | Vacuna contenedora |
| `numero_lote` | Texto | | No nulo | Único por `id_vacuna` | Código de lote del laboratorio |
| `fecha_vencimiento`| Fecha | | No nulo | | Caducidad del lote |
| `id_usuario_registro`| Entero | FK → usuario | No nulo | Rol `enfermera` o `administrador` | Operador que cargó el lote |
| `fecha_registro`| FechaHora | | No nulo | | Timestamp de ingreso |

**Reglas de Negocio:**
- Los lotes con `fecha_vencimiento < fecha_actual` quedan inhabilitados para asignación en turnos.

---

### `movimiento_stock`
- **Descripción:** Libro mayor de entradas, salidas y rectificaciones de inventario (Append-Only).
- **Trazabilidad:** RF-11, RF-12, RF-20, RF-31 | US-3.2, US-3.6, US-6.2

| Campo | Tipo | Clave | Nulidad | Restricciones / Enums | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id_movimiento` | Entero | PK | No nulo | | Identificador del movimiento |
| `id_lote` | Entero | FK → lote | No nulo | | Lote impactado |
| `tipo` | Texto | | No nulo | `ingreso`, `asignacion_turno`, `devolucion_turno`, `ajuste` | Motivo de la alteración |
| `cantidad` | Entero | | No nulo | Distinto de $0$. Positivo en `ingreso` y `devolucion_turno`; $-1$ en `asignacion_turno` | Delta de stock |
| `id_turno_vacunacion` | Entero | FK → turno_vacunacion | Nulo | No nulo si tipo $\in$ {`asignacion_turno`, `devolucion_turno`} | Trazabilidad del turno origen |
| `motivo` | Texto | | Nulo | Obligatorio si `tipo == 'ajuste'` | Justificación técnica de la corrección |
| `id_usuario` | Entero | FK → usuario | No nulo | Rol `enfermera` o `administrador` | Responsable del asiento |
| `fecha_hora` | FechaHora | | No nulo | | Timestamp del movimiento |

---

### `alerta_stock`
- **Descripción:** Señal de advertencia ante déficit de existencias respecto al nivel crítico.
- **Trazabilidad:** RF-13, RF-32 | US-3.4

| Campo | Tipo | Clave | Nulidad | Restricciones / Enums | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id_alerta` | Entero | PK | No nulo | | Identificador de la alerta |
| `id_vacuna` | Entero | FK → vacuna | No nulo | | Vacuna comprometida |
| `stock_al_generarse` | Entero | | No nulo | $\ge 0$ | Existencias calculadas al dispararse |
| `nivel_critico_al_generarse`| Entero | | No nulo | | Nivel crítico vigente al dispararse |
| `estado` | Texto | | No nulo | `activa`, `resuelta` | Estado del ciclo de alerta |
| `fecha_generacion` | FechaHora | | No nulo | | Momento de activación |
| `fecha_resolucion` | FechaHora | | Nulo | No nulo si `estado == 'resuelta'` | Momento de reposición |

**Reglas de Negocio:**
- **Unicidad activa:** Se permite únicamente una alerta en estado `activa` por cada `id_vacuna`.
- **Transición automática:** Pasa a `resuelta` tan pronto un ingreso o ajuste sitúe el stock total calculado de la vacuna por encima de su `nivel_critico`.

---

### `horario_vacunacion`
- **Descripción:** Franjas de atención predeterminadas para el servicio de vacunatorio.
- **Trazabilidad:** RF-12 | US-3.6

| Campo | Tipo | Clave | Nulidad | Restricciones / Enums | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id_horario_vacunacion`| Entero | PK | No nulo | | Identificador del bloque horario |
| `dia_semana` | Texto | | No nulo | `lunes` a `domingo` | Día de vacunación |
| `hora_inicio` | Hora | | No nulo | | Inicio de la franja |
| `hora_fin` | Hora | | No nulo | `hora_fin > hora_inicio` | Fin de la franja |
| `duracion_turno` | Entero | | No nulo | $> 0$ (minutos) | Duración de cada aplicación |
| `id_usuario_registro` | Entero | FK → usuario | No nulo | Rol `enfermera` o `administrador` | Operador que configuró el horario |
| `fecha_registro` | FechaHora | | No nulo | | Timestamp de alta |

**Reglas de Negocio:**
- Las franjas de vacunatorio no pueden superponerse entre sí en un mismo día.

---

### `turno_vacunacion`
- **Descripción:** Ciclo de solicitud, autorización, loteo y aplicación de dosis a pacientes.
- **Trazabilidad:** RF-12, RF-31 | US-3.6

| Campo | Tipo | Clave | Nulidad | Restricciones / Enums | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id_turno_vacunacion` | Entero | PK | No nulo | | Identificador del turno de vacuna |
| `id_paciente` | Entero | FK → paciente | No nulo | | Paciente receptor |
| `id_vacuna` | Entero | FK → vacuna | No nulo | | Biológico solicitado |
| `id_lote` | Entero | FK → lote | Nulo | No nulo si `estado != 'pendiente'`. El lote debe corresponder a `id_vacuna` | Lote reservado (criterio FEFO) |
| `fecha_hora` | FechaHora | | No nulo | Debe encajar en `horario_vacunacion` | Cita programada |
| `estado` | Texto | | No nulo | `pendiente`, `aprobado`, `rechazado`, `aplicado`, `cancelado`, `ausente` | Estado del trámite |
| `id_usuario_registro` | Entero | FK → usuario | No nulo | Rol `enfermera` o `administrador` | Quien cargó la solicitud |
| `fecha_solicitud` | FechaHora | | No nulo | | Momento de la petición |
| `id_usuario_resolucion`| Entero | FK → usuario | Nulo | Rol `enfermera` o `administrador`. Requerido si $\in$ {`aprobado`, `rechazado`} | Quien aprobó/rechazó |
| `fecha_resolucion` | FechaHora | | Nulo | Requerido si $\in$ {`aprobado`, `rechazado`} | Momento del dictamen |
| `motivo_rechazo` | Texto | | Nulo | Obligatorio si `estado == 'rechazado'` | Causa del rechazo |
| `motivo_cancelacion` | Texto | | Nulo | | Causa de anulación |
| `fecha_cancelacion` | FechaHora | | Nulo | Requerido si `estado == 'cancelado'` | Momento de anulación |
| `fecha_aplicacion` | FechaHora | | Nulo | Requerido si `estado == 'aplicado'` | Momento efectivo de la inyección |
| `id_usuario_aplicacion`| Entero | FK → usuario | Nulo | Rol `enfermera`. Requerido si `estado == 'aplicado'` | Profesional que administró la dosis |

**Reglas de Negocio:**
- **Políticas de Aprobación (FEFO):** Solo se aprueba si el stock general no vencido de la vacuna es $> 0$. Se asigna el lote disponible con fecha de vencimiento más próxima (*First Expired, First Out*). Genera un `movimiento_stock` con tipo `asignacion_turno` y cantidad `-1`.
- **Reversión de Stock:** Si un turno en estado `aprobado` pasa a `cancelado` o `ausente`, el sistema genera automáticamente un `movimiento_stock` con tipo `devolucion_turno` y cantidad `+1` reintegrado al **mismo lote**.

---

## Módulo 5: Pagos y Coberturas

### `obra_social`
- **Descripción:** Listado maestro de entidades prestadoras de salud.
- **Trazabilidad:** RF-14 | US-4.1, US-4.2

| Campo | Tipo | Clave | Nulidad | Restricciones / Enums | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id_obra_social` | Entero | PK | No nulo | | Identificador de la prestadora |
| `nombre` | Texto | | No nulo | Único | Razón social de la prepaga u obra social |
| `aceptada` | Booleano | | No nulo | | `true` si mantiene convenio activo con la sala |

---

### `pago`
- **Descripción:** Transacción financiera correspondiente a una consulta médica de carácter particular.
- **Trazabilidad:** RF-15, RF-21, RF-35 | US-4.4, US-4.7, US-6.3

| Campo | Tipo | Clave | Nulidad | Restricciones / Enums | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id_pago` | Entero | PK | No nulo | | Identificador del pago |
| `id_turno` | Entero | FK → turno | No nulo | Único (relación 1:1) | Turno médico liquidado |
| `monto` | Decimal | | No nulo | $> 0$. Se congela desde `medico.valor_consulta` | Monto total abonado |
| `medio_pago` | Texto | | No nulo | Ej. `pasarela_online`, `tarjeta`, `transferencia` | Medio de cobro |
| `codigo_transaccion` | Texto | | Nulo | | Identificador devuelto por gateway de pago |
| `id_usuario_registro` | Entero | FK → usuario | No nulo | Rol `paciente` o `administrador` | Operador que asentó el pago |
| `fecha_hora` | FechaHora | | No nulo | | Timestamp de la transacción |

**Reglas de Negocio:**
- Cardinalidad estricta: Máximo un pago por turno médico.
- Solo se crea cuando la pasarela confirma la transacción de forma exitosa.

---

### `comprobante`
- **Descripción:** Registro fiscal o factura electrónica derivada de un cobro.
- **Trazabilidad:** RF-16 | US-4.5, US-4.6

| Campo | Tipo | Clave | Nulidad | Restricciones / Enums | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id_comprobante` | Entero | PK | No nulo | | Identificador del comprobante |
| `id_pago` | Entero | FK → pago | No nulo | Único (relación 1:1) | Pago respaldado fiscalmente |
| `numero` | Texto | | No nulo | Único global | Número de comprobante legal |
| `tipo` | Texto | | No nulo | `A`, `B`, `C` | Clasificación de comprobante electrónico |
| `monto_total` | Decimal | | No nulo | Debe ser idéntico a `pago.monto` | Total facturado |
| `fecha_emision` | FechaHora | | No nulo | | Timestamp de expedición |
| `archivo` | Texto | | No nulo | Ruta o URI de almacenamiento | Path hacia el PDF del comprobante |

---

## Módulo 6: Historia Clínica

### `registro_clinico`
- **Descripción:** Entrada médica confidencial generada sobre un turno médico cumplido. Conforman la Historia Clínica Electrónica del paciente.
- **Trazabilidad:** RF-17, RF-18 | US-5.1, US-5.2

| Campo | Tipo | Clave | Nulidad | Restricciones / Enums | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id_registro` | Entero | PK | No nulo | | Identificador del asiento clínico |
| `id_turno` | Entero | FK → turno | No nulo | Único. El turno asociado debe tener `estado == 'atendido'` | Turno del cual deriva la consulta |
| `diagnostico` | Texto | | No nulo | | Juicio diagnóstico del profesional |
| `indicaciones` | Texto | | Nulo | | Pautas y cuidados para el paciente |
| `tratamiento` | Texto | | Nulo | | Fármacos o pautas terapéuticas |
| `fecha_registro`| FechaHora | | No nulo | | Timestamp del dictamen |

**Reglas de Negocio:**
- **Control de Acceso e Inmutabilidad (Ley 26.529):**
  - Solo puede crearlo el médico titular vinculado al `turno`.
  - No admite actualización (`UPDATE`) ni borrado (`DELETE`).
  - El paciente solo tiene permisos de lectura sobre sus propios registros clínicos (`RF-18`).

---

## Matriz de Transición de Estados

### Turno Médico (`turno.estado`)
```text
[Inicio] ──(Reserva)──> reservado
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
   cancelado           atendido             ausente
 (Terminal)           (Terminal)           (Terminal)
                           │
                           ▼
                 [Habilita registro_clinico]