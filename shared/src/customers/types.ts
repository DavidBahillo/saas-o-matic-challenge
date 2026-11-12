// Tipos compartidos de la spec 001 (plan §4). Backend y frontend los importan desde aquí.
import type { Plan } from './plans';

export const TAX_ID_TYPES = [
  'DNI',
  'NIE',
  'CIF',
  'PT_NIF',
  'FR_SIREN',
  'DE_VAT',
  'IT_PIVA',
  'GB_VAT',
  'OTHER',
] as const;

export type TaxIdType = (typeof TAX_ID_TYPES)[number];

export type TaxIdReason = 'COUNTRY_PREFIX' | 'ALL_ZEROS' | 'FIRST_DIGIT' | 'IT_OFFICE_CODE';

/** Motivo de un INVALID_USERS (spec 002, R2). */
export type UsersReason = 'NOT_FINITE' | 'NOT_INTEGER' | 'NEGATIVE' | 'TOO_LARGE';

export type FieldErrorReason = TaxIdReason | UsersReason;

export type FieldErrorCode =
  | 'REQUIRED'
  | 'INVALID_TYPE'
  | 'UNKNOWN_FIELD'
  | 'INVALID_LENGTH'
  | 'INVALID_CHARACTERS'
  | 'INVALID_EMAIL'
  | 'INVALID_COUNTRY'
  | 'INVALID_PLAN'
  | 'INVALID_ID'
  | 'TAX_ID_INVALID_FORMAT'
  | 'TAX_ID_INVALID_CHECKSUM'
  | 'INVALID_USERS';

export interface FieldError {
  field: string;
  code: FieldErrorCode;
  message: string;
  taxIdType?: TaxIdType;
  reason?: FieldErrorReason;
  suggestion?: string;
}

/** Cliente ya normalizado y validado, listo para guardar. */
export interface NewCustomer {
  companyName: string;
  taxId: string;
  taxIdType: TaxIdType;
  email: string;
  country: string;
  plan: Plan;
}

export interface Customer extends NewCustomer {
  id: number;
  createdAt: string;
}

export interface CustomerList {
  items: Customer[];
  total: number;
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNSUPPORTED_CONTENT_TYPE'
  | 'PAYLOAD_TOO_LARGE'
  | 'MALFORMED_JSON'
  | 'CUSTOMER_NOT_FOUND'
  | 'NOT_FOUND'
  | 'CUSTOMER_ALREADY_EXISTS'
  | 'INTERNAL_ERROR';

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: { fields?: FieldError[]; existingId?: number };
  };
}

export type { Plan };
