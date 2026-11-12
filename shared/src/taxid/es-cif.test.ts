// Tests del CIF (RF11, RF12, RF18). Filas de la tabla "Identificador fiscal con país ES".
import { describe, expect, it } from 'vitest';
import { validateCif } from './es-cif';

describe('validateCif · válidos', () => {
  it.each([
    ['B12345674'], // A = 12, B = 14, D = 4 (B exige dígito)
    ['A58818501'], // A = 14, B = 15, D = 1 (A exige dígito)
    ['W1234567D'], // D = 4 → letra D (W exige letra)
    ['Q1234567D'], // Q exige letra
    ['G12345674'], // G admite dígito
    ['G1234567D'], // G admite letra
    ['B00000190'], // A = 1, B = 9, D = 0 → dígito 0
    ['Q0000019J'], // D = 0 → letra J
  ])('%s → CIF', (id) => {
    expect(validateCif(id)).toEqual({ ok: true, value: id, taxIdType: 'CIF' });
  });
});

describe('validateCif · control incorrecto', () => {
  it.each([
    ['W12345674'], // tipo W exige letra
    ['B1234567D'], // tipo B exige dígito
    ['Q12345674'], // tipo Q exige letra
    ['B12345675'], // dígito equivocado
    ['G1234567E'], // letra equivocada en tipo que admite ambos
  ])('%s → CHECKSUM con CIF', (id) => {
    const r = validateCif(id);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('TAX_ID_INVALID_CHECKSUM');
    expect(r.error.taxIdType).toBe('CIF');
    expect(r.error).not.toHaveProperty('reason');
  });
});

describe('validateCif · solo ceros (RF18)', () => {
  it.each([['B00000000'], ['Q0000000J']])('%s → FORMAT ALL_ZEROS con CIF', (id) => {
    const r = validateCif(id);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('TAX_ID_INVALID_FORMAT');
    expect(r.error.reason).toBe('ALL_ZEROS');
    expect(r.error.taxIdType).toBe('CIF');
  });
});

describe('validateCif · formato inválido', () => {
  it.each([
    ['B1234567K'], // K no está en JABCDEFGHI
    ['I1234567A'], // tipo inexistente
    ['O1234567A'],
    ['K1234567L'], // NIF especiales: fuera de alcance
    ['L1234567L'],
    ['M1234567L'],
    ['B123456744'], // 8 dígitos
    ['B123456'], // corto
    ['12345678Z'], // DNI
  ])('%s → FORMAT sin reason ni taxIdType', (id) => {
    const r = validateCif(id);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('TAX_ID_INVALID_FORMAT');
    expect(r.error).not.toHaveProperty('reason');
    expect(r.error).not.toHaveProperty('taxIdType');
  });
});

describe('validateCif · los 17 tipos de letra con la matrícula 1234567 (D = 4, letra D)', () => {
  type Outcome = 'OK' | 'CHECKSUM';
  const DIGIT_ONLY = ['A', 'B', 'E', 'H'] as const;
  const LETTER_ONLY = ['N', 'P', 'Q', 'R', 'S', 'W'] as const;
  const BOTH = ['C', 'D', 'F', 'G', 'J', 'U', 'V'] as const;
  const rows: [string, string, Outcome, Outcome][] = [
    ...DIGIT_ONLY.map((t): [string, string, Outcome, Outcome] => [t, 'dígito', 'OK', 'CHECKSUM']),
    ...LETTER_ONLY.map((t): [string, string, Outcome, Outcome] => [t, 'letra', 'CHECKSUM', 'OK']),
    ...BOTH.map((t): [string, string, Outcome, Outcome] => [t, 'ambos', 'OK', 'OK']),
  ];

  it('cubre exactamente las 17 letras de tipo de la forma del CIF', () => {
    expect(rows.map(([t]) => t).sort().join('')).toBe('ABCDEFGHJNPQRSUVW');
  });

  it.each(rows)('tipo %s (%s): …4 → %s y …D → %s', (type, _kind, withDigit, withLetter) => {
    const outcomeOf = (id: string): string => {
      const r = validateCif(id);
      if (r.ok) return r.taxIdType === 'CIF' ? 'OK' : 'TIPO_INCORRECTO';
      return r.error.code === 'TAX_ID_INVALID_CHECKSUM' && r.error.taxIdType === 'CIF' ? 'CHECKSUM' : r.error.code;
    };
    expect([outcomeOf(`${type}12345674`), outcomeOf(`${type}1234567D`)]).toEqual([withDigit, withLetter]);
  });
});
