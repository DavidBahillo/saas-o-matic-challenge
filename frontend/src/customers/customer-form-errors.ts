// Errores del alta (RF12): cada field del backend va a su control; el resto, al aviso general.
import type { FieldError } from '@saas-o-matic/shared';
import { ApiError, generalMessage } from '../api/errors';

export type FormControl = 'companyName' | 'country' | 'taxId' | 'email' | 'plan';

const CONTROLS: readonly string[] = ['companyName', 'country', 'taxId', 'email', 'plan'];

/** Mensajes propios para los reason del identificador fiscal; uno desconocido usa el message del backend. */
const REASON_TEXT: Readonly<Record<string, string>> = {
  COUNTRY_PREFIX: 'El identificador fiscal no debe llevar el prefijo del país.',
  ALL_ZEROS: 'El identificador fiscal no puede estar formado solo por ceros.',
  FIRST_DIGIT: 'La primera cifra del identificador fiscal no es válida.',
  IT_OFFICE_CODE: 'El código de oficina del identificador fiscal no es válido.',
};

function isControl(field: string): field is FormControl {
  return CONTROLS.includes(field);
}

/** Texto en español de un error: reason traducido o message, más la sugerencia si el mensaje no la incluye. */
export function fieldErrorText(error: FieldError): string {
  const text = (error.reason === undefined ? undefined : REASON_TEXT[error.reason]) ?? error.message;
  const { suggestion } = error;
  return suggestion === undefined || text.includes(suggestion) ? text : `${text} Sugerencia: ${suggestion}.`;
}

export function splitFieldErrors(fields: readonly FieldError[]): {
  byControl: Partial<Record<FormControl, string[]>>;
  general: string[];
} {
  const byControl: Partial<Record<FormControl, string[]>> = {};
  const general: string[] = [];
  for (const error of fields) {
    const text = fieldErrorText(error);
    if (isControl(error.field)) (byControl[error.field] ??= []).push(text);
    else general.push(text);
  }
  return { byControl, general };
}

export interface SubmitErrorView {
  byControl: Partial<Record<FormControl, string[]>>;
  general: string[];
  existingId?: number;
  /** Solo los fallos de conexión o del servidor ofrecen "Reintentar" (RF14). */
  retryable: boolean;
}

/** Traduce el fallo de un alta a lo que muestra el formulario (RF12 a RF14, RF34). */
export function describeSubmitError(error: unknown): SubmitErrorView {
  if (!(error instanceof ApiError) || error.kind !== 'api') {
    return { byControl: {}, general: [generalMessage(error)], retryable: true };
  }
  if (error.code === 'CUSTOMER_ALREADY_EXISTS') {
    const existing = error.existingId === undefined ? {} : { existingId: error.existingId };
    return { byControl: {}, general: [error.message], retryable: false, ...existing };
  }
  if (error.code === 'VALIDATION_ERROR' && error.fields.length > 0) {
    return { ...splitFieldErrors(error.fields), retryable: false };
  }
  return { byControl: {}, general: [error.message], retryable: (error.status ?? 500) >= 500 };
}
