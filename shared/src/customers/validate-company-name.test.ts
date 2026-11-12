import { describe, expect, it } from 'vitest';
import { COMPANY_NAME_MESSAGES, validateCompanyName } from './validate-company-name';

const ACUTE = String.fromCodePoint(0x301);
const E_ACUTE = String.fromCodePoint(0xe9);
const NBSP = String.fromCodePoint(0xa0);
const EMOJI = String.fromCodePoint(0x1f600);

function failure(code: string, message: string) {
  return { ok: false, error: { field: 'companyName', code, message } };
}

describe('validateCompanyName (RF2, RF3, RF4)', () => {
  it.each([
    ['2 code points', 'AB', 'AB'],
    ['120 code points', 'A'.repeat(120), 'A'.repeat(120)],
    ['trim de los extremos', `  Acme Ibérica SL${NBSP}\t`, 'Acme Ibérica SL'],
    ['conserva tildes, mayúsculas y espacios internos', 'ACME  Ibérica sl', 'ACME  Ibérica sl'],
    ['emoji = 1 code point', `Acme ${EMOJI}`, `Acme ${EMOJI}`],
    ['120 é en NFD (240 code points) → 120 en NFC', `e${ACUTE}`.repeat(120), E_ACUTE.repeat(120)],
  ])('%s → válido', (_label, input, expected) => {
    expect(validateCompanyName(input)).toEqual({ ok: true, value: expected });
  });

  it('el resultado está en NFC', () => {
    const result = validateCompanyName(`Ibe${ACUTE}rica`);
    expect(result).toEqual({ ok: true, value: `Ib${E_ACUTE}rica` });
  });

  it.each([['A'], ['A'.repeat(121)], [' A '], [`e${ACUTE}`]])('%j → INVALID_LENGTH', (input) => {
    expect(validateCompanyName(input)).toEqual(
      failure('INVALID_LENGTH', COMPANY_NAME_MESSAGES.INVALID_LENGTH),
    );
  });

  it.each([
    ['salto de línea interno', 'Acme\nIbérica'],
    ['tabulador interno', 'Acme\tIbérica'],
    ['U+007F', `Acme${String.fromCodePoint(0x7f)}SL`],
    ['U+0085', `Acme${String.fromCodePoint(0x85)}SL`],
    ['precede a la longitud (1 carácter + control)', `A${String.fromCodePoint(0)}`],
    ['precede a la longitud (más de 120)', `${'A'.repeat(130)}\n${'B'.repeat(5)}`],
  ])('%s → INVALID_CHARACTERS', (_label, input) => {
    expect(validateCompanyName(input)).toEqual(
      failure('INVALID_CHARACTERS', COMPANY_NAME_MESSAGES.INVALID_CHARACTERS),
    );
  });

  it.each([[''], ['   '], ['\r\n'], [null], [undefined]])('%j → REQUIRED', (input) => {
    expect(validateCompanyName(input)).toEqual(failure('REQUIRED', COMPANY_NAME_MESSAGES.REQUIRED));
  });

  it.each([[42], [false], [['Acme']], [{}]])('%j → INVALID_TYPE', (input) => {
    expect(validateCompanyName(input)).toEqual(
      failure('INVALID_TYPE', COMPANY_NAME_MESSAGES.INVALID_TYPE),
    );
  });
});
