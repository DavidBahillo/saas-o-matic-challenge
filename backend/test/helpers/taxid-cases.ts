// Filas de las tablas "Identificador fiscal con país …" y "Resto de países" de la spec, como
// casos de la API (T10, T11, RF9 y CA3): país, valor de `taxId` tal como llega, estado esperado y
// resultado esperado SEGÚN LA SPEC (el `taxIdType` de un 201, o el `code`, `reason` y `taxIdType`
// del error de un 400). Así la paridad no solo compara la API con shared, sino ambas con la spec.
// Los caracteres especiales se construyen con String.fromCodePoint para no depender de escapes.
import type { FieldErrorCode, TaxIdReason, TaxIdType } from '@saas-o-matic/shared';

export const OMIT = Symbol('sin taxId');

export type TaxIdInput = string | number | null | typeof OMIT;

/** Error esperado en `field` (por defecto `taxId`); las claves ausentes no deben aparecer. */
export interface ExpectedError {
  field?: 'taxId' | 'country';
  code: FieldErrorCode;
  reason?: TaxIdReason;
  taxIdType?: TaxIdType;
}

/** Un 201 lleva el taxIdType esperado; un 400, el error esperado. */
export type TaxIdCase = readonly [
  country: string,
  taxId: TaxIdInput,
  status: 201 | 400,
  expected: TaxIdType | ExpectedError,
];

const EN_DASH = String.fromCodePoint(0x2013);
const NBSP = String.fromCodePoint(0xa0);
const LF = String.fromCodePoint(0x0a);

const ok = (country: string, type: TaxIdType, ids: readonly TaxIdInput[]): TaxIdCase[] =>
  ids.map((id) => [country, id, 201, type] as const);
const ko = (country: string, expected: ExpectedError, ids: readonly TaxIdInput[]): TaxIdCase[] =>
  ids.map((id) => [country, id, 400, expected] as const);

const FORMAT: ExpectedError = { code: 'TAX_ID_INVALID_FORMAT' };
const PREFIX: ExpectedError = { code: 'TAX_ID_INVALID_FORMAT', reason: 'COUNTRY_PREFIX' };
const REQUIRED: ExpectedError = { code: 'REQUIRED' };
const LENGTH: ExpectedError = { code: 'INVALID_LENGTH' };
const checksum = (taxIdType: TaxIdType): ExpectedError => ({ code: 'TAX_ID_INVALID_CHECKSUM', taxIdType });
const reason = (r: TaxIdReason, taxIdType: TaxIdType): ExpectedError => ({
  code: 'TAX_ID_INVALID_FORMAT',
  reason: r,
  taxIdType,
});

export const ES_CASES: readonly TaxIdCase[] = [
  ...ok('ES', 'DNI', ['12345678Z', '12345678z', ' 12.345.678-Z ', `12 345 678${EN_DASH}Z`, '12345678\tZ']),
  ...ok('ES', 'DNI', [`12345678${NBSP}Z`, '12345678Z\r\n', '00000023T', '00000022E', '01234567L']),
  ...ko('ES', checksum('DNI'), ['12345678A']),
  ...ko('ES', reason('ALL_ZEROS', 'DNI'), ['00000000T']),
  ...ko('ES', FORMAT, ['1234567L', '123456789Z', '12345678', '12345678U', '12345678I', '12345678O']),
  ...ko('ES', FORMAT, ['12345678Ñ', '12345678ß', '12345678_Z', '12345678/Z', `12345678Z${LF}-`]),
  ...ok('ES', 'NIE', ['X1234567L', 'Y1234567X', 'Z1234567R']),
  ...ko('ES', checksum('NIE'), ['X1234567A']),
  ...ko('ES', FORMAT, ['X12345678L']),
  ...ko('ES', reason('ALL_ZEROS', 'NIE'), ['X0000000T', 'Y0000000Z']),
  ...ok('ES', 'CIF', ['W1234567D', 'B12345674', 'Q1234567D', 'G12345674', 'G1234567D', 'A58818501']),
  ...ok('ES', 'CIF', ['B00000190', 'Q0000019J']),
  ...ko('ES', checksum('CIF'), ['W12345674', 'B1234567D', 'Q12345674', 'B12345675']),
  ...ko('ES', FORMAT, ['B1234567K', 'I1234567A', 'O1234567A', 'K1234567L', 'L1234567L', 'M1234567L']),
  ...ko('ES', reason('ALL_ZEROS', 'CIF'), ['B00000000', 'Q0000000J']),
  ...ko('ES', PREFIX, ['ES12345678Z', 'ESB12345674']),
  ...ko('ES', REQUIRED, ['', '   ', '-.-', null]),
  ...ko('ES', { code: 'INVALID_TYPE' }, [12345678]),
  ...ok('es', 'DNI', ['12345678Z']),
  ...ok(' ES ', 'DNI', ['12345678Z']),
];

export const PT_CASES: readonly TaxIdCase[] = [
  ...ok('PT', 'PT_NIF', ['501964843', '123456789', '500000000', '500000050', '501 964 843']),
  ...ko('PT', checksum('PT_NIF'), ['501964842']),
  ...ko('PT', reason('FIRST_DIGIT', 'PT_NIF'), ['012345678']),
  ...ko('PT', reason('ALL_ZEROS', 'PT_NIF'), ['000000000']),
  ...ko('PT', FORMAT, ['50196484', '5019648430']),
  ...ko('PT', PREFIX, ['PT501964843']),
];

export const FR_CASES: readonly TaxIdCase[] = [
  ...ok('FR', 'FR_SIREN', ['732829320', '552100554']),
  ...ko('FR', checksum('FR_SIREN'), ['732829321']),
  ...ko('FR', reason('ALL_ZEROS', 'FR_SIREN'), ['000000000']),
  ...ko('FR', FORMAT, ['73282932', '73282932000017', '12345678A']),
  ...ko('FR', PREFIX, ['FR732829320', 'FR44732829320']),
];

export const DE_CASES: readonly TaxIdCase[] = [
  ...ok('DE', 'DE_VAT', ['136695976', '123456788', '123456770']),
  ...ko('DE', checksum('DE_VAT'), ['136695977', '123456789']),
  ...ko('DE', reason('FIRST_DIGIT', 'DE_VAT'), ['036695976']),
  ...ko('DE', reason('ALL_ZEROS', 'DE_VAT'), ['000000000']),
  ...ko('DE', FORMAT, ['13669597']),
  ...ko('DE', PREFIX, ['DE136695976']),
];

export const IT_CASES: readonly TaxIdCase[] = [
  ...ok('IT', 'IT_PIVA', ['00743110157', '12345670017', '12345670090', '12345671007', '12345671205']),
  ...ok('IT', 'IT_PIVA', ['12345671213', '12345678887', '12345679992']),
  ...ko('IT', checksum('IT_PIVA'), ['00743110158', '12345670018']),
  ...ko('IT', reason('IT_OFFICE_CODE', 'IT_PIVA'), ['12345671015', '12345671016', '12345671197', '12345671221']),
  ...ko('IT', reason('IT_OFFICE_CODE', 'IT_PIVA'), ['12345678879', '12345678903', '12345670009', '19000000000']),
  ...ko('IT', reason('ALL_ZEROS', 'IT_PIVA'), ['00000000000']),
  ...ko('IT', FORMAT, ['0074311015', '007431101570']),
  ...ko('IT', PREFIX, ['IT00743110157']),
];

export const GB_CASES: readonly TaxIdCase[] = [
  ...ok('GB', 'GB_VAT', ['980780684', '980780629', '123456782', '123456727', '980 7806 84']),
  ...ko('GB', checksum('GB_VAT'), ['980780685']),
  ...ko('GB', reason('ALL_ZEROS', 'GB_VAT'), ['000000000']),
  ...ko('GB', FORMAT, ['980780684000']),
  ...ko('GB', PREFIX, ['GB980780684']),
];

export const GENERIC_CASES: readonly TaxIdCase[] = [
  ...ok('US', 'OTHER', ['12-3456789', '000000000', 'AB', 'A'.repeat(20)]),
  ...ko('US', LENGTH, ['A', 'A'.repeat(21)]),
  ...ko('US', FORMAT, ['A_', `${'A'.repeat(20)}_`, 'ß123', `-${LF}-`]),
  ...ko('US', REQUIRED, ['-', ' . ']),
  ...ko('MX', FORMAT, ['ABC_123']),
];

/** "País y relación con el tax ID" (RF8): el tax ID no se valida con un país no válido. */
export const COUNTRY_CASES: readonly TaxIdCase[] = [
  ...ko('XX', { field: 'country', code: 'INVALID_COUNTRY' }, ['12345678A']),
  ...ko('XX', REQUIRED, [OMIT]),
  ...ko('XX', { code: 'INVALID_TYPE' }, [123]),
  ...ko('UK', { field: 'country', code: 'INVALID_COUNTRY' }, ['980780684']),
  ...ko('', { field: 'country', code: 'REQUIRED' }, ['12345678Z']),
];

export const ALL_TAX_ID_CASES: readonly (readonly [string, readonly TaxIdCase[]])[] = [
  ['ES', ES_CASES],
  ['PT', PT_CASES],
  ['FR', FR_CASES],
  ['DE', DE_CASES],
  ['IT', IT_CASES],
  ['GB', GB_CASES],
  ['genérico', GENERIC_CASES],
  ['país', COUNTRY_CASES],
];
