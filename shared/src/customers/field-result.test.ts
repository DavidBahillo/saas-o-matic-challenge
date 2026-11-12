import { describe, expect, it } from 'vitest';
import { fail, ok, readText } from './field-result';

describe('FieldResult', () => {
  it('ok envuelve el valor', () => {
    expect(ok('ES')).toEqual({ ok: true, value: 'ES' });
  });

  it('fail construye un FieldError con campo, código y mensaje', () => {
    expect(fail('email', 'INVALID_EMAIL', 'Email no válido.')).toEqual({
      ok: false,
      error: { field: 'email', code: 'INVALID_EMAIL', message: 'Email no válido.' },
    });
  });

  it('fail admite datos extra como suggestion', () => {
    expect(fail('country', 'INVALID_COUNTRY', '¿Querías decir GB?', { suggestion: 'GB' })).toEqual({
      ok: false,
      error: { field: 'country', code: 'INVALID_COUNTRY', message: '¿Querías decir GB?', suggestion: 'GB' },
    });
  });
});

describe('readText', () => {
  const messages = { required: 'Obligatorio.', invalidType: 'Debe ser texto.' };
  const upper = (s: string) => s.trim().toUpperCase();

  it('normaliza un texto', () => {
    expect(readText('x', ' ab ', messages, upper)).toEqual({ ok: true, value: 'AB' });
  });

  it.each([[null], [undefined], ['   ']])('%j → REQUIRED', (raw) => {
    expect(readText('x', raw, messages, upper)).toEqual({
      ok: false,
      error: { field: 'x', code: 'REQUIRED', message: 'Obligatorio.' },
    });
  });

  it.each([[1], [true], [[]], [{}]])('%j → INVALID_TYPE', (raw) => {
    expect(readText('x', raw, messages, upper)).toEqual({
      ok: false,
      error: { field: 'x', code: 'INVALID_TYPE', message: 'Debe ser texto.' },
    });
  });
});
