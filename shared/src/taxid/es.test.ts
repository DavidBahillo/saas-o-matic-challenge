// Tests del clasificador español (RF12): todas las filas ES que no dependen del prefijo,
// de REQUIRED, del tipo JSON ni del campo country (esas van en T5 y T6).
import { describe, expect, it } from 'vitest';
import type { TaxIdReason, TaxIdType } from '../customers/types';
import { normalizeTaxId } from './normalize-tax-id';
import { validateEsTaxId } from './es';

type Row = readonly [string, 'OK' | 'FORMAT' | 'CHECKSUM', TaxIdType?, TaxIdReason?];

const ROWS: readonly Row[] = [
  ['12345678Z', 'OK', 'DNI'],
  ['12345678A', 'CHECKSUM', 'DNI'],
  ['00000023T', 'OK', 'DNI'],
  ['00000000T', 'FORMAT', 'DNI', 'ALL_ZEROS'],
  ['01234567L', 'OK', 'DNI'],
  ['1234567L', 'FORMAT'],
  ['123456789Z', 'FORMAT'],
  ['12345678', 'FORMAT'],
  ['12345678U', 'FORMAT'],
  ['12345678I', 'FORMAT'],
  ['12345678O', 'FORMAT'],
  ['12345678Ñ', 'FORMAT'],
  ['12345678ß', 'FORMAT'],
  ['12345678_Z', 'FORMAT'],
  ['12345678/Z', 'FORMAT'],
  ['X1234567L', 'OK', 'NIE'],
  ['Y1234567X', 'OK', 'NIE'],
  ['Z1234567R', 'OK', 'NIE'],
  ['X1234567A', 'CHECKSUM', 'NIE'],
  ['X12345678L', 'FORMAT'],
  ['X0000000T', 'FORMAT', 'NIE', 'ALL_ZEROS'],
  ['Y0000000Z', 'FORMAT', 'NIE', 'ALL_ZEROS'],
  ['W1234567D', 'OK', 'CIF'],
  ['W12345674', 'CHECKSUM', 'CIF'],
  ['B12345674', 'OK', 'CIF'],
  ['B1234567D', 'CHECKSUM', 'CIF'],
  ['B1234567K', 'FORMAT'],
  ['Q1234567D', 'OK', 'CIF'],
  ['Q12345674', 'CHECKSUM', 'CIF'],
  ['G12345674', 'OK', 'CIF'],
  ['G1234567D', 'OK', 'CIF'],
  ['B12345675', 'CHECKSUM', 'CIF'],
  ['A58818501', 'OK', 'CIF'],
  ['B00000190', 'OK', 'CIF'],
  ['Q0000019J', 'OK', 'CIF'],
  ['B00000000', 'FORMAT', 'CIF', 'ALL_ZEROS'],
  ['Q0000000J', 'FORMAT', 'CIF', 'ALL_ZEROS'],
  ['I1234567A', 'FORMAT'],
  ['O1234567A', 'FORMAT'],
  ['K1234567L', 'FORMAT'],
  ['L1234567L', 'FORMAT'],
  ['M1234567L', 'FORMAT'],
  ['Ñ1234567L', 'FORMAT'],
  ['', 'FORMAT'],
];

const CASES = ROWS.map(([id, outcome, taxIdType, reason]) => ({ id, outcome, taxIdType, reason }));

describe('validateEsTaxId · tabla ES', () => {
  it.each(CASES)('$id → $outcome $taxIdType $reason', ({ id, outcome, taxIdType, reason }) => {
    const r = validateEsTaxId(id);
    if (outcome === 'OK') {
      expect(r).toEqual({ ok: true, value: id, taxIdType });
      return;
    }
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const code = outcome === 'FORMAT' ? 'TAX_ID_INVALID_FORMAT' : 'TAX_ID_INVALID_CHECKSUM';
    expect(r.error.code).toBe(code);
    expect(r.error.reason).toBe(reason);
    expect(r.error.taxIdType).toBe(taxIdType);
    expect(r.error.message.length).toBeGreaterThan(0);
  });
});

describe('validateEsTaxId · variantes de escritura normalizadas (RF2)', () => {
  it.each([
    ['12345678z'],
    [' 12.345.678-Z '],
    ['12 345 678\u2013Z'],
    ['12345678\tZ'],
    ['12345678\u00A0Z'],
    ['12345678Z\r\n'],
  ])('%j → DNI 12345678Z', (raw) => {
    expect(validateEsTaxId(normalizeTaxId(raw))).toEqual({
      ok: true,
      value: '12345678Z',
      taxIdType: 'DNI',
    });
  });
});
