import { describe, expect, it } from 'vitest';
import { PLANS, isPlan } from './plans';

describe('PLANS', () => {
  it('es la lista cerrada de D9', () => {
    expect(PLANS).toEqual(['starter', 'growth', 'enterprise']);
  });

  it.each([
    ['starter', true],
    ['growth', true],
    ['enterprise', true],
    ['Starter', false],
    ['pro', false],
    ['', false],
  ])('isPlan(%j) → %s', (input, expected) => {
    expect(isPlan(input)).toBe(expected);
  });
});
