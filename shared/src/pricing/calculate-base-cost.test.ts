import { describe, expect, it } from 'vitest';
import { calculateBaseCost } from './calculate-base-cost';
import type { BaseCost } from './types';

const BASE_15: BaseCost = {
  users: 15,
  tiers: [
    { tier: 1, from: 1, to: 10, unitPriceCents: 1000, billedUsers: 10, subtotalCents: 10000 },
    { tier: 2, from: 11, to: 50, unitPriceCents: 800, billedUsers: 5, subtotalCents: 4000 },
    { tier: 3, from: 51, to: null, unitPriceCents: 500, billedUsers: 0, subtotalCents: 0 },
  ],
  baseCents: 14000,
};

const INPUT_ERROR = {
  ok: false,
  errors: [{ field: 'input', code: 'INVALID_TYPE', message: 'La entrada del cálculo debe ser un objeto.' }],
};

function numericOutputs(value: BaseCost): number[] {
  return [value.users, value.baseCents, ...value.tiers.flatMap((t) => [t.billedUsers, t.subtotalCents])];
}

describe('calculateBaseCost', () => {
  it('15 usuarios da el JSON de la spec, sin claves de IVA (RF11)', () => {
    const result = calculateBaseCost({ users: 15 });
    expect(result).toEqual({ ok: true, value: BASE_15 });
    if (result.ok) expect(Object.keys(result.value)).toEqual(['users', 'tiers', 'baseCents']);
  });

  it('1e1 es 10 usuarios → 10000', () => {
    const result = calculateBaseCost({ users: 1e1 });
    expect(result).toEqual({
      ok: true,
      value: {
        users: 10,
        tiers: [
          { tier: 1, from: 1, to: 10, unitPriceCents: 1000, billedUsers: 10, subtotalCents: 10000 },
          { tier: 2, from: 11, to: 50, unitPriceCents: 800, billedUsers: 0, subtotalCents: 0 },
          { tier: 3, from: 51, to: null, unitPriceCents: 500, billedUsers: 0, subtotalCents: 0 },
        ],
        baseCents: 10000,
      },
    });
  });

  it('-0 da users 0 y todas las salidas +0 (RF15)', () => {
    const result = calculateBaseCost({ users: -0 });
    expect(result).toEqual({
      ok: true,
      value: {
        users: 0,
        tiers: [
          { tier: 1, from: 1, to: 10, unitPriceCents: 1000, billedUsers: 0, subtotalCents: 0 },
          { tier: 2, from: 11, to: 50, unitPriceCents: 800, billedUsers: 0, subtotalCents: 0 },
          { tier: 3, from: 51, to: null, unitPriceCents: 500, billedUsers: 0, subtotalCents: 0 },
        ],
        baseCents: 0,
      },
    });
    if (!result.ok) return;
    for (const n of numericOutputs(result.value)) expect(Object.is(n, -0)).toBe(false);
  });

  it('ignora storage, apiCalls y plan (RF5)', () => {
    const extra = calculateBaseCost({ users: 15, storage: 999, apiCalls: 1000000, plan: 'enterprise' });
    expect(extra).toEqual(calculateBaseCost({ users: 15 }));
  });

  it('un users heredado del prototipo se trata como ausente (D-P8)', () => {
    const inherited: unknown = Object.create({ users: 15 });
    expect(calculateBaseCost(inherited)).toEqual({
      ok: false,
      errors: [{ field: 'users', code: 'REQUIRED', message: 'El número de usuarios es obligatorio.' }],
    });
  });

  it('sin argumento da INVALID_TYPE en input (RF16)', () => {
    expect(calculateBaseCost()).toEqual(INPUT_ERROR);
  });

  it.each([null, undefined, [], [15, 'ES'], 15, '15', true])('%j da INVALID_TYPE en input', (input) => {
    expect(() => calculateBaseCost(input)).not.toThrow();
    expect(calculateBaseCost(input)).toEqual(INPUT_ERROR);
  });

  it('{} da REQUIRED en users', () => {
    expect(calculateBaseCost({})).toEqual({
      ok: false,
      errors: [{ field: 'users', code: 'REQUIRED', message: 'El número de usuarios es obligatorio.' }],
    });
  });

  it('users no válido da un único error sin importes', () => {
    expect(calculateBaseCost({ users: -1 })).toEqual({
      ok: false,
      errors: [
        { field: 'users', code: 'INVALID_USERS', reason: 'NEGATIVE', message: 'El número de usuarios no puede ser negativo.' },
      ],
    });
  });

  it('es determinista y devuelve objetos nuevos (RF14)', () => {
    const a = calculateBaseCost({ users: 51 });
    const b = calculateBaseCost({ users: 51 });
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    if (a.ok && b.ok) {
      expect(a.value).not.toBe(b.value);
      expect(a.value.tiers).not.toBe(b.value.tiers);
      expect(a.value.tiers[0]).not.toBe(b.value.tiers[0]);
    }
  });
});
