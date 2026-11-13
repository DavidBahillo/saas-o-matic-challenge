// Tabla "Control de usuarios y campo numérico" de la spec (RF20, RF22).
import { describe, expect, it } from 'vitest';
import { parseCountField } from './parse-count-field';

const MAX = 100_000;

describe('parseCountField: válidos', () => {
  it.each([
    ['0', 0],
    ['25', 25],
    ['  25  ', 25],
    ['0010', 10],
    ['100', 100],
    ['101', 101],
    ['5000', 5000],
    ['100000', 100_000],
  ])('%j → %i', (text, value) => {
    expect(parseCountField(text, MAX)).toEqual({ ok: true, value });
  });

  it('el rango lo decide el máximo recibido', () => {
    expect(parseCountField('1000000', 1_000_000)).toEqual({ ok: true, value: 1_000_000 });
    expect(parseCountField('1000001', 1_000_000).ok).toBe(false);
  });
});

describe('parseCountField: errores', () => {
  it.each([
    ['100001'],
    ['99999999999999999999'],
    ['0000000000000000000000000000000100001'],
    ['-1'],
    ['+5'],
    ['1.5'],
    ['1,5'],
    ['1e3'],
    ['abc'],
    ['5x'],
    ['1 0'],
    ['٣'],
    [''],
    ['   '],
  ])('%j es un error con mensaje en español', (text) => {
    const result = parseCountField(text, MAX);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message.length).toBeGreaterThan(0);
  });

  it('el mensaje del exceso menciona el máximo', () => {
    const result = parseCountField('100001', MAX);
    expect(result).toEqual({ ok: false, message: 'El valor no puede ser mayor que 100.000.' });
  });
});
