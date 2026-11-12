// Esquema Zod del cuerpo de POST /customers (plan §6.4). Zod comprueba que el cuerpo es un
// objeto plano (RF29) y las reglas de negocio vienen de validateCustomerInput en shared/ (RF9).
// Cada FieldError viaja como issue `custom` en `params.fieldError`, sin heurísticas, y los
// mensajes por defecto de Zod no se muestran nunca.
//
// validateCustomerInput recibe el objeto ORIGINAL: z.record (y z.looseObject) reconstruyen el
// objeto asignando claves, y una clave propia "__proto__" de JSON.parse se perdería, así que
// no se detectaría como UNKNOWN_FIELD. Por eso z.record solo se usa como comprobación.
import { z } from 'zod';
import { validateCustomerInput } from '@saas-o-matic/shared';
import type { FieldError, NewCustomer } from '@saas-o-matic/shared';
import { API_MESSAGES } from '../http/errors';

export type ParseResult<T> = { ok: true; value: T } | { ok: false; errors: FieldError[] };

const BODY_INVALID_TYPE: FieldError = {
  field: 'body',
  code: 'INVALID_TYPE',
  message: API_MESSAGES.BODY_INVALID_TYPE,
};

const PlainObjectSchema = z.record(z.string(), z.unknown());

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return PlainObjectSchema.safeParse(value).success;
}

const CreateCustomerBodySchema = z.unknown().transform((value, ctx): NewCustomer => {
  const fieldErrors = isPlainObject(value) ? validateCustomerInput(value) : undefined;
  if (fieldErrors?.ok === true) return fieldErrors.value;
  for (const fieldError of fieldErrors?.errors ?? [BODY_INVALID_TYPE]) {
    ctx.addIssue({ code: 'custom', message: fieldError.message, params: { fieldError } });
  }
  return z.NEVER;
});

function isFieldError(value: unknown): value is FieldError {
  return typeof value === 'object' && value !== null && 'field' in value && 'code' in value;
}

function toFieldErrors(issues: readonly z.core.$ZodIssue[]): FieldError[] {
  const errors: FieldError[] = [];
  for (const issue of issues) {
    const candidate: unknown = issue.code === 'custom' ? issue.params?.fieldError : undefined;
    errors.push(isFieldError(candidate) ? candidate : BODY_INVALID_TYPE);
  }
  return errors;
}

export function parseCreateCustomerBody(body: unknown): ParseResult<NewCustomer> {
  const result = CreateCustomerBodySchema.safeParse(body);
  return result.success
    ? { ok: true, value: result.data }
    : { ok: false, errors: toFieldErrors(result.error.issues) };
}
