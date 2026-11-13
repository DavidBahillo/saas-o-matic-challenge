import { describe, expect, expectTypeOf, it } from 'vitest';
import { TAX_ID_TYPES } from './types';
import type { Customer } from './types';

describe('TAX_ID_TYPES', () => {
  it('contiene los tipos del Glosario', () => {
    expect(TAX_ID_TYPES).toEqual([
      'DNI', 'NIE', 'CIF', 'PT_NIF', 'FR_SIREN', 'DE_VAT', 'IT_PIVA', 'GB_VAT', 'OTHER',
    ]);
  });
});

describe('Customer', () => {
  it('lleva simulationCount como número (spec 005, RF1)', () => {
    const customer: Customer = {
      id: 1,
      companyName: 'Acme Ibérica SL',
      taxId: 'B12345674',
      taxIdType: 'CIF',
      email: 'compras@acme.es',
      country: 'ES',
      plan: 'growth',
      createdAt: '2026-11-12T10:00:00.000Z',
      simulationCount: 3,
    };
    expectTypeOf(customer.simulationCount).toEqualTypeOf<number>();
    expect(customer.simulationCount).toBe(3);
  });
});
