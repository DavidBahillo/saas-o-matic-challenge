// Esquema Zod del cuerpo de error { error: { code, message, details? } } (RF34).
import type { ApiErrorBody } from '@saas-o-matic/shared';
import { z } from 'zod';

const fieldErrorSchema = z.object({
  field: z.string(),
  code: z.enum([
    'REQUIRED',
    'INVALID_TYPE',
    'UNKNOWN_FIELD',
    'INVALID_LENGTH',
    'INVALID_CHARACTERS',
    'INVALID_EMAIL',
    'INVALID_COUNTRY',
    'INVALID_PLAN',
    'INVALID_ID',
    'TAX_ID_INVALID_FORMAT',
    'TAX_ID_INVALID_CHECKSUM',
    'INVALID_USERS',
    'INVALID_RESOURCE',
    'INVALID_CURRENCY',
    'CURRENCY_NOT_AVAILABLE',
  ]),
  message: z.string(),
  taxIdType: z.enum(['DNI', 'NIE', 'CIF', 'PT_NIF', 'FR_SIREN', 'DE_VAT', 'IT_PIVA', 'GB_VAT', 'OTHER']).optional(),
  reason: z
    .enum([
      'COUNTRY_PREFIX',
      'ALL_ZEROS',
      'FIRST_DIGIT',
      'IT_OFFICE_CODE',
      'NOT_FINITE',
      'NOT_INTEGER',
      'NEGATIVE',
      'TOO_LARGE',
    ])
    .optional(),
  suggestion: z.string().optional(),
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum([
      'VALIDATION_ERROR',
      'UNSUPPORTED_CONTENT_TYPE',
      'PAYLOAD_TOO_LARGE',
      'MALFORMED_JSON',
      'CUSTOMER_NOT_FOUND',
      'SIMULATION_NOT_FOUND',
      'NOT_FOUND',
      'CUSTOMER_ALREADY_EXISTS',
      'EXCHANGE_RATE_UNAVAILABLE',
      'INTERNAL_ERROR',
    ]),
    message: z.string(),
    details: z
      .object({ fields: z.array(fieldErrorSchema).optional(), existingId: z.number().int().optional() })
      .optional(),
  }),
}) satisfies z.ZodType<ApiErrorBody>;
