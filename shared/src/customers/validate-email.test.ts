import { describe, expect, it } from 'vitest';
import { EMAIL_MAX_LENGTH, EMAIL_MESSAGES, validateEmail } from './validate-email';

const NBSP = String.fromCodePoint(0xa0);

function failure(code: string, message: string) {
  return { ok: false, error: { field: 'email', code, message } };
}

/** Email con formato válido de exactamente `length` code points. */
function emailOfLength(length: number): string {
  const domain = '@acme.es';
  return 'a'.repeat(length - domain.length) + domain;
}

describe('validateEmail (RF2, RF3, RF5)', () => {
  it.each([
    ['compras@acme.es', 'compras@acme.es'],
    ['Ventas@Acme.ES', 'ventas@acme.es'],
    ['  Compras@Acme.ES ', 'compras@acme.es'],
    [`\tventas@acme.es${NBSP}`, 'ventas@acme.es'],
    ['a.b+c@sub.acme.co.uk', 'a.b+c@sub.acme.co.uk'],
  ])('%j → %j', (input, expected) => {
    expect(validateEmail(input)).toEqual({ ok: true, value: expected });
  });

  it('254 code points → válido', () => {
    const email = emailOfLength(EMAIL_MAX_LENGTH);
    expect(email).toHaveLength(254);
    expect(validateEmail(email)).toEqual({ ok: true, value: email });
  });

  it('255 code points → INVALID_LENGTH', () => {
    expect(validateEmail(emailOfLength(255))).toEqual(
      failure('INVALID_LENGTH', EMAIL_MESSAGES.INVALID_LENGTH),
    );
  });

  it('255 code points sin formato válido → INVALID_LENGTH (la longitud va primero)', () => {
    expect(validateEmail('a'.repeat(255))).toEqual(
      failure('INVALID_LENGTH', EMAIL_MESSAGES.INVALID_LENGTH),
    );
  });

  it.each([
    ['ventas@acme'],
    ['@acme.es'],
    ['ventas acme@x.es'],
    ['a@@b.es'],
    ['a@b.'],
    ['a@.es'],
    ['ventas@acmé.es'],
    ['ventaś@acme.es'],
    ['ventas@acme..es'],
    ['ventas.acme.es'],
    ['a@b@c.es'],
    ['ventas@acme.es\tx'],
    [`ventas${NBSP}x@acme.es`],
    [`${String.fromCodePoint(0x212a)}@acme.es`],
  ])('%j → INVALID_EMAIL', (input) => {
    expect(validateEmail(input)).toEqual(failure('INVALID_EMAIL', EMAIL_MESSAGES.INVALID_EMAIL));
  });

  it.each([[''], ['   '], [null], [undefined]])('%j → REQUIRED', (input) => {
    expect(validateEmail(input)).toEqual(failure('REQUIRED', EMAIL_MESSAGES.REQUIRED));
  });

  it.each([[42], [true], [['a@b.es']]])('%j → INVALID_TYPE', (input) => {
    expect(validateEmail(input)).toEqual(failure('INVALID_TYPE', EMAIL_MESSAGES.INVALID_TYPE));
  });
});
