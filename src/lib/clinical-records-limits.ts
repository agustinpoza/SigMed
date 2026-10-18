// Constantes puras: sin imports de Prisma para poder usarse desde componentes de cliente.
export const CLINICAL_RECORD_MAX_LENGTH = {
  diagnosis: 500,
  treatment: 2000,
  indications: 2000,
} as const;
