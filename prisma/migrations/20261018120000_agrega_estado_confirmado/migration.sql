-- El estado CONFIRMADO se agregó a schema.prisma (US-1.4) sin migración: filtrar
-- turnos por ese estado fallaba con "invalid input value for enum estado_turno".
ALTER TYPE "estado_turno" ADD VALUE IF NOT EXISTS 'confirmado' BEFORE 'reservado';
