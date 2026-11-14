// RF58: plurales con Intl.PluralRules('es').
import { describe, expect, it } from 'vitest';
import { pluralize, simulationsLabel, usersLabel } from './pluralize';

describe('pluralize', () => {
  it.each([
    [0, 'otros'],
    [1, 'uno'],
    [2, 'otros'],
    [101, 'otros'],
  ])('%i -> %s', (count, expected) => {
    expect(pluralize(count, 'uno', 'otros')).toBe(expected);
  });
});

describe('simulationsLabel (RF4)', () => {
  it('concuerda el número', () => {
    expect(simulationsLabel(0)).toBe('0 simulaciones');
    expect(simulationsLabel(1)).toBe('1 simulación');
    expect(simulationsLabel(2)).toBe('2 simulaciones');
    expect(simulationsLabel(101)).toBe('101 simulaciones');
  });
});

describe('usersLabel', () => {
  it('concuerda el número', () => {
    expect(usersLabel(0)).toBe('0 usuarios');
    expect(usersLabel(1)).toBe('1 usuario');
    expect(usersLabel(2)).toBe('2 usuarios');
    expect(usersLabel(101)).toBe('101 usuarios');
  });
});
