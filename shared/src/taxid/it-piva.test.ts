// Tests de la Partita IVA italiana (RF10, RF11, RF16, RF18). Filas de la tabla "Identificador
// fiscal con país IT", incluida la tabla de oficinas. La fila del prefijo (`IT00743110157`)
// va en validate-tax-id.
import { describe, expect, it } from 'vitest';
import type { TaxIdReason } from '../customers/types';
import { validateItPiva } from './it-piva';

type Row = readonly [string, 'OK' | 'FORMAT' | 'CHECKSUM', TaxIdReason?];

const ROWS: readonly Row[] = [
  ['00743110157', 'OK'], // oficina 015, X = 12, Y = 11, control 7
  ['00743110158', 'CHECKSUM'],
  ['12345670017', 'OK'], // 001, 33 → 7
  ['12345670018', 'CHECKSUM'],
  ['12345670090', 'OK'], // 009, 40 → 0
  ['12345671007', 'OK'], // 100
  ['12345671015', 'FORMAT', 'IT_OFFICE_CODE'], // 101, control 5 correcto
  ['12345671016', 'FORMAT', 'IT_OFFICE_CODE'], // 101 y control erróneo: gana la oficina (RF10, paso 5 antes que el 6)
  ['12345671197', 'FORMAT', 'IT_OFFICE_CODE'], // 119, control 7 correcto
  ['12345671205', 'OK'], // 120
  ['12345671213', 'OK'], // 121
  ['12345671221', 'FORMAT', 'IT_OFFICE_CODE'], // 122
  ['12345678879', 'FORMAT', 'IT_OFFICE_CODE'], // 887
  ['12345678887', 'OK'], // 888
  ['12345678903', 'FORMAT', 'IT_OFFICE_CODE'], // 890
  ['12345679992', 'OK'], // 999
  ['12345670009', 'FORMAT', 'IT_OFFICE_CODE'], // 000
  ['19000000000', 'FORMAT', 'IT_OFFICE_CODE'], // 000, control 0 correcto
  ['00000000000', 'FORMAT', 'ALL_ZEROS'], // los ceros van antes que la oficina
];

const CASES = ROWS.map(([id, outcome, reason]) => ({ id, outcome, reason }));

describe('validateItPiva · tabla IT', () => {
  it.each(CASES)('$id → $outcome $reason', ({ id, outcome, reason }) => {
    const r = validateItPiva(id);
    if (outcome === 'OK') {
      expect(r).toEqual({ ok: true, value: id, taxIdType: 'IT_PIVA' });
      return;
    }
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const code = outcome === 'FORMAT' ? 'TAX_ID_INVALID_FORMAT' : 'TAX_ID_INVALID_CHECKSUM';
    expect(r.error.code).toBe(code);
    expect(r.error.reason).toBe(reason);
    expect(r.error.taxIdType).toBe('IT_PIVA');
    expect(r.error.message.length).toBeGreaterThan(0);
  });
});

describe('validateItPiva · formato inválido', () => {
  it.each([['0074311015'], ['007431101570'], ['0074311015A'], ['']])(
    '%j → FORMAT sin reason ni taxIdType',
    (id) => {
      const r = validateItPiva(id);
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error.code).toBe('TAX_ID_INVALID_FORMAT');
      expect(r.error).not.toHaveProperty('reason');
      expect(r.error).not.toHaveProperty('taxIdType');
    },
  );
});
