# DER_SalaMedica

Fuente: [DER_SalaMedica.drawio](DER_SalaMedica.drawio).

Transcripción del XML del diagrama: entidades, claves y relaciones explícitas.

## Entidades y claves

### horario_vacunacion

| Campo | Clave |
| --- | --- |
| id_horario_vacunacion | PK |
| id_usuario_registro | FK |

### obra_social

| Campo | Clave |
| --- | --- |
| id_obra_social | PK |

### usuario

| Campo | Clave |
| --- | --- |
| id_usuario | PK |

### paciente

| Campo | Clave |
| --- | --- |
| id_usuario | PK, FK |
| id_obra_social | FK |

### medico

| Campo | Clave |
| --- | --- |
| id_usuario | PK, FK |

### horario_atencion

| Campo | Clave |
| --- | --- |
| id_horario | PK |
| id_medico | FK |
| id_usuario_modificacion | FK |

### vacuna

| Campo | Clave |
| --- | --- |
| id_vacuna | PK |
| id_usuario_alta | FK |

### turno_vacunacion

| Campo | Clave |
| --- | --- |
| id_turno_vacunacion | PK |
| id_paciente | FK |
| id_vacuna | FK |
| id_lote | FK |
| id_usuario_registro | FK |
| id_usuario_resolucion | FK |
| id_usuario_aplicacion | FK |

### turno

| Campo | Clave |
| --- | --- |
| id_turno | PK |
| id_paciente | FK |
| id_medico | FK |
| id_usuario_reserva | FK |
| id_usuario_cancelacion | FK |

### bloqueo_agenda

| Campo | Clave |
| --- | --- |
| id_bloqueo | PK |
| id_medico | FK |
| id_usuario_registro | FK |

### alerta_stock

| Campo | Clave |
| --- | --- |
| id_alerta | PK |
| id_vacuna | FK |

### lote

| Campo | Clave |
| --- | --- |
| id_lote | PK |
| id_vacuna | FK |
| id_usuario_registro | FK |

### movimiento_stock

| Campo | Clave |
| --- | --- |
| id_movimiento | PK |
| id_lote | FK |
| id_turno_vacunacion | FK |
| id_usuario | FK |

### registro_clinico

| Campo | Clave |
| --- | --- |
| id_registro | PK |
| id_turno | FK |

### pago

| Campo | Clave |
| --- | --- |
| id_pago | PK |
| id_turno | FK |
| id_usuario_registro | FK |

### comprobante

| Campo | Clave |
| --- | --- |
| id_comprobante | PK |
| id_pago | FK |

## Relaciones dibujadas

| Origen | Cardinalidad en origen | Destino | Cardinalidad en destino |
| --- | --- | --- | --- |
| usuario | Uno | paciente | Uno |
| usuario | Uno | medico | Uno |
| obra_social | Uno | paciente | Muchos |
| paciente | Uno | turno_vacunacion | Muchos |
| paciente | Uno | turno | Muchos |
| medico | Uno | turno | Muchos |
| medico | Uno | horario_atencion | Muchos |
| medico | Uno | bloqueo_agenda | Muchos |
| turno | Uno | pago | Muchos |
| turno | Uno | registro_clinico | Uno |
| pago | Uno | comprobante | Uno |
| vacuna | Uno | turno_vacunacion | Muchos |
| vacuna | Uno | lote | Muchos |
| vacuna | Uno | alerta_stock | Muchos |
| lote | Uno | turno_vacunacion | Muchos |
| lote | Uno | movimiento_stock | Muchos |
| turno_vacunacion | Uno | movimiento_stock | Muchos |

## Referencias del original

Referencias
▶ Cabeza simple: uno
▶▶ Cabeza doble: muchos
id_x: clave primaria (PK)   id_x: clave foránea (FK)

Las FK hacia usuario que registran quién realizó cada acción (id_usuario_registro, _reserva, _cancelacion, etc.) figuran como atributos, pero sus relaciones no se dibujan para mantener legible el diagrama.

![Diagrama original](DER_SalaMedica.png)
