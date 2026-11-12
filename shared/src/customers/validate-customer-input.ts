// Validación completa del alta (RF3, RF8, RF9): reúne todos los errores de campo (uno por
// campo, en el orden de FIELDS y después los campos desconocidos) y, si no hay ninguno,
// devuelve el NewCustomer normalizado. Si el país falta o no es válido, el tax ID solo se
// comprueba como REQUIRED o INVALID_TYPE, porque sus reglas dependen del país (RF8).
import { validateCountry } from '../countries/validate-country';
import { normalizeTaxId } from '../taxid/normalize-tax-id';
import { TAX_ID_REQUIRED_MESSAGE, validateNormalizedTaxId } from '../taxid/validate-tax-id';
import { readText } from './field-result';
import type { FieldResult } from './field-result';
import type { FieldError, NewCustomer, TaxIdType } from './types';
import { validateCompanyName } from './validate-company-name';
import { validateEmail } from './validate-email';
import { validatePlan } from './validate-plan';

export const CUSTOMER_FIELDS = ['companyName', 'taxId', 'email', 'country', 'plan'] as const;

export const TAX_ID_FIELD_MESSAGES = {
  REQUIRED: TAX_ID_REQUIRED_MESSAGE,
  INVALID_TYPE: 'El identificador fiscal debe ser un texto.',
} as const;

export const UNKNOWN_FIELD_MESSAGE = 'Este campo no está permitido.';

export type CustomerInputResult =
  | { ok: true; value: NewCustomer }
  | { ok: false; errors: FieldError[] };

/** Resultado del tax ID; sin `error` cuando no se valida por tener un país no válido (RF8). */
type TaxIdFieldResult =
  | { ok: true; value: string; taxIdType: TaxIdType }
  | { ok: false; error?: FieldError };

const KNOWN_FIELDS: ReadonlySet<string> = new Set(CUSTOMER_FIELDS);

/** Solo propiedades propias: una heredada no cuenta como campo enviado. */
function readField(raw: Readonly<Record<string, unknown>>, field: string): unknown {
  return Object.hasOwn(raw, field) ? raw[field] : undefined;
}

function validateTaxIdField(raw: unknown, country: FieldResult<string>): TaxIdFieldResult {
  const messages = {
    required: TAX_ID_FIELD_MESSAGES.REQUIRED,
    invalidType: TAX_ID_FIELD_MESSAGES.INVALID_TYPE,
  };
  // readText normaliza una sola vez (y da REQUIRED si queda vacío); el valor ya normalizado va a
  // validateNormalizedTaxId, que no vuelve a normalizarlo (RF2, T11).
  const text = readText('taxId', raw, messages, normalizeTaxId);
  if (!text.ok) return text;
  if (!country.ok) return { ok: false };
  const result = validateNormalizedTaxId(country.value, text.value);
  return result.ok ? result : { ok: false, error: { field: 'taxId', ...result.error } };
}

function unknownFieldErrors(raw: Readonly<Record<string, unknown>>): FieldError[] {
  return Object.keys(raw)
    .filter((key) => !KNOWN_FIELDS.has(key))
    .map((field) => ({ field, code: 'UNKNOWN_FIELD', message: UNKNOWN_FIELD_MESSAGE }));
}

export function validateCustomerInput(raw: Readonly<Record<string, unknown>>): CustomerInputResult {
  const companyName = validateCompanyName(readField(raw, 'companyName'));
  const email = validateEmail(readField(raw, 'email'));
  const country = validateCountry(readField(raw, 'country'));
  const plan = validatePlan(readField(raw, 'plan'));
  const taxId = validateTaxIdField(readField(raw, 'taxId'), country);
  const errors: FieldError[] = [];
  for (const result of [companyName, taxId, email, country, plan]) {
    if (!result.ok && result.error !== undefined) errors.push(result.error);
  }
  errors.push(...unknownFieldErrors(raw));
  if (companyName.ok && taxId.ok && email.ok && country.ok && plan.ok && errors.length === 0) {
    const value: NewCustomer = {
      companyName: companyName.value,
      taxId: taxId.value,
      taxIdType: taxId.taxIdType,
      email: email.value,
      country: country.value,
      plan: plan.value,
    };
    return { ok: true, value };
  }
  return { ok: false, errors };
}
