// Resultado de los validadores de identificador fiscal y sus constructores (plan §4 y §5).
import type { FieldError, TaxIdReason, TaxIdType } from '../customers/types';

export type TaxIdError = Omit<FieldError, 'field'>;

export type TaxIdResult =
  | { ok: true; value: string; taxIdType: TaxIdType }
  | { ok: false; error: TaxIdError };

/** Mensajes en español, compartidos para que la UI muestre los mismos textos que la API. */
export const TAX_ID_MESSAGES = {
  FORMAT: 'El identificador fiscal no tiene un formato válido para el país indicado.',
  CHECKSUM: 'El dígito o la letra de control del identificador fiscal no es correcto.',
  ALL_ZEROS: 'El identificador fiscal no puede estar formado solo por ceros.',
  FIRST_DIGIT: 'El primer dígito del identificador fiscal no es válido.',
  IT_OFFICE_CODE: 'El código de oficina de la Partita IVA (dígitos 8 a 10) no es válido.',
} as const satisfies Record<'FORMAT' | 'CHECKSUM' | FormatReason, string>;

/** Motivos de formato con mensaje fijo; `COUNTRY_PREFIX` depende del país (RF19). */
export type FormatReason = Exclude<TaxIdReason, 'COUNTRY_PREFIX'>;

/** Mensaje de RF19, que nombra el país (ejemplo del contrato: prefijo GB). */
export function countryPrefixMessage(country: string): string {
  return `Introduce el identificador fiscal sin el prefijo ${country}.`;
}

export function taxIdOk(value: string, taxIdType: TaxIdType): TaxIdResult {
  return { ok: true, value, taxIdType };
}

/** Error de formato. Con `reason` incluye también el `taxIdType` detectado (RF11). */
export function formatError(reason?: FormatReason, taxIdType?: TaxIdType): TaxIdResult {
  if (reason === undefined) {
    return { ok: false, error: { code: 'TAX_ID_INVALID_FORMAT', message: TAX_ID_MESSAGES.FORMAT } };
  }
  const error: TaxIdError = {
    code: 'TAX_ID_INVALID_FORMAT',
    message: TAX_ID_MESSAGES[reason],
    reason,
  };
  if (taxIdType !== undefined) error.taxIdType = taxIdType;
  return { ok: false, error };
}

/** Prefijo de país (RF19): FORMAT con `reason`, sin `taxIdType` (RF11). */
export function countryPrefixError(country: string): TaxIdResult {
  return {
    ok: false,
    error: {
      code: 'TAX_ID_INVALID_FORMAT',
      reason: 'COUNTRY_PREFIX',
      message: countryPrefixMessage(country),
    },
  };
}

export function checksumError(taxIdType: TaxIdType): TaxIdResult {
  return {
    ok: false,
    error: { code: 'TAX_ID_INVALID_CHECKSUM', message: TAX_ID_MESSAGES.CHECKSUM, taxIdType },
  };
}
