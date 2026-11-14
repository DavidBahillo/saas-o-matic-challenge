// Texto explicativo del cálculo por tramos (RF26), con los datos del desglose compartido.
import { calculateQuote } from '@saas-o-matic/shared';
import { describe, expect, it } from 'vitest';
import { explainTiers } from './explain-model';

function explain(users: number): string {
  const result = calculateQuote({ users, country: 'ES' });
  if (!result.ok) throw new Error('cálculo no válido');
  return explainTiers(result.value.tiers, users);
}

describe('explainTiers', () => {
  it.each([
    [0, 'Con 0 usuarios el importe es 0.'],
    [1, 'Con 1 usuario pagas 1 al precio del tramo 1.'],
    [10, 'Con 10 usuarios pagas 10 al precio del tramo 1.'],
    [11, 'Con 11 usuarios pagas 10 al precio del tramo 1 y 1 al del tramo 2.'],
    [23, 'Con 23 usuarios pagas 10 al precio del tramo 1 y 13 al del tramo 2.'],
    [50, 'Con 50 usuarios pagas 10 al precio del tramo 1 y 40 al del tramo 2.'],
    [51, 'Con 51 usuarios pagas 10 al precio del tramo 1, 40 al del tramo 2 y 1 al del tramo 3.'],
  ])('%i usuarios: %s', (users, expected) => {
    expect(explain(users)).toBe(expected);
  });
});
