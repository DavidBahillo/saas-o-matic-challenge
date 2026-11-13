import { describe, expect, expectTypeOf, it } from 'vitest';
import type { FieldErrorCode, FieldErrorReason } from '../customers/types';
import type { Currency } from '../currency/types';
import type { Quote } from '../pricing/types';
import { RESOURCE_MAX, SIMULATION_FIELDS } from './types';
import type { ResourceReason, Simulation, SimulationInput } from './types';

describe('tipos de simulaciones (spec 003)', () => {
  it('fija el máximo de recursos y el orden de campos', () => {
    expect(RESOURCE_MAX).toBe(1_000_000);
    expect(SIMULATION_FIELDS).toEqual(['customerId', 'users', 'storage', 'apiCalls', 'currency']);
  });

  it('Simulation extiende Quote de la 002', () => {
    expectTypeOf<Simulation>().toExtend<Quote>();
    expectTypeOf<SimulationInput>().toEqualTypeOf<{
      customerId: number; users: number; storage: number; apiCalls: number; currency: Currency;
    }>();
  });

  it('añade los códigos nuevos', () => {
    expectTypeOf<'INVALID_RESOURCE'>().toExtend<FieldErrorCode>();
    expectTypeOf<'INVALID_CURRENCY' | 'CURRENCY_NOT_AVAILABLE'>().toExtend<FieldErrorCode>();
    expectTypeOf<ResourceReason>().toExtend<FieldErrorReason>();
  });
});
