// Esquemas Zod de GET /customers/:id y GET /customers?q= (plan §6.4, punto 6).
// - id: entero decimal canónico entre 1 y MAX_SAFE_INTEGER, sin ceros a la izquierda, signos,
//   decimales ni exponentes (RF22). Cualquier fallo → INVALID_ID en `id`.
// - q: solo `string | undefined`; un array (q=a&q=b, q[]=a) o un objeto (q[a]=b) → INVALID_TYPE.
//   Tras el trim del Glosario, más de 100 code points → INVALID_LENGTH; vacío → sin filtro (RF24).
//   Los parámetros desconocidos se ignoran: z.object descarta las claves que no declara.
import { z } from 'zod';
import { codePointLength, trimWhitespace } from '@saas-o-matic/shared';
import type { FieldError } from '@saas-o-matic/shared';
import type { ParseResult } from './customer-body.schema';

export const SEARCH_QUERY_MAX_LENGTH = 100;

export const QUERY_MESSAGES = {
  INVALID_ID: `El id debe ser un número entero entre 1 y ${String(Number.MAX_SAFE_INTEGER)}.`,
  Q_INVALID_TYPE: 'El parámetro q debe aparecer una sola vez y ser un texto.',
  Q_INVALID_LENGTH: `La búsqueda no puede superar los ${String(SEARCH_QUERY_MAX_LENGTH)} caracteres.`,
} as const;

/** Única definición del error INVALID_ID en `id` (RF22); la reutiliza el errorHandler. */
export const INVALID_ID: FieldError = { field: 'id', code: 'INVALID_ID', message: QUERY_MESSAGES.INVALID_ID };
const Q_INVALID_TYPE: FieldError = { field: 'q', code: 'INVALID_TYPE', message: QUERY_MESSAGES.Q_INVALID_TYPE };
const Q_INVALID_LENGTH: FieldError = {
  field: 'q',
  code: 'INVALID_LENGTH',
  message: QUERY_MESSAGES.Q_INVALID_LENGTH,
};

const CANONICAL_ID = /^[1-9]\d*$/;

const CustomerIdSchema = z
  .string()
  .regex(CANONICAL_ID)
  .transform(Number)
  .refine((id) => Number.isSafeInteger(id));

// El tipo se comprueba antes que la longitud: el refine solo corre si q es string o undefined.
const SearchQuerySchema = z.object({
  q: z
    .string()
    .optional()
    .transform((q) => (q === undefined ? undefined : trimWhitespace(q)))
    .refine((q) => q === undefined || codePointLength(q) <= SEARCH_QUERY_MAX_LENGTH, {
      message: QUERY_MESSAGES.Q_INVALID_LENGTH,
    }),
});

export function parseCustomerId(raw: unknown): ParseResult<number> {
  const result = CustomerIdSchema.safeParse(raw);
  return result.success ? { ok: true, value: result.data } : { ok: false, errors: [INVALID_ID] };
}

function isLengthIssue(issues: readonly z.core.$ZodIssue[]): boolean {
  return issues.some((issue) => issue.code === 'custom');
}

/** `value` es la búsqueda ya recortada, o `undefined` si no hay q o queda vacío tras el trim. */
export function parseSearchQuery(query: unknown): ParseResult<string | undefined> {
  const result = SearchQuerySchema.safeParse(query);
  if (!result.success) {
    return { ok: false, errors: [isLengthIssue(result.error.issues) ? Q_INVALID_LENGTH : Q_INVALID_TYPE] };
  }
  const q = result.data.q;
  return { ok: true, value: q === '' ? undefined : q };
}
