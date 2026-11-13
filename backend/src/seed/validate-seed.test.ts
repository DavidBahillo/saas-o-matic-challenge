import { describe, expect, it } from 'vitest';
import { validateCustomerInput } from '@saas-o-matic/shared';
import { SEED_DATA } from './seed-data';
import type { SeedData } from './seed-types';
import { validateSeedData } from './validate-seed';

function withCustomer(patch: Partial<SeedData['customers'][number]>): SeedData {
  const [first, ...rest] = SEED_DATA.customers;
  if (first === undefined) throw new Error('sin clientes');
  return { ...SEED_DATA, customers: [{ ...first, ...patch }, ...rest] };
}

function withSimulation(patch: Partial<SeedData['simulations'][number]>): SeedData {
  const [first, ...rest] = SEED_DATA.simulations;
  if (first === undefined) throw new Error('sin simulaciones');
  return { ...SEED_DATA, simulations: [{ ...first, ...patch }, ...rest] };
}

function toInput(c: SeedData['customers'][number]): Record<string, unknown> {
  return { companyName: c.companyName, taxId: c.taxId, email: c.email, country: c.country, plan: c.plan };
}

describe('datos semilla', () => {
  it('no tienen incidencias', () => {
    expect(validateSeedData(SEED_DATA)).toEqual([]);
  });

  it.each(SEED_DATA.customers.map((c) => [c.key, c] as const))('cliente %s pasa validateCustomerInput', (_key, c) => {
    expect(validateCustomerInput(toInput(c)).ok).toBe(true);
  });

  it('cubre RF3: tipos de tax ID, países, planes y divisas', () => {
    const types = SEED_DATA.customers.map((c) => {
      const r = validateCustomerInput(toInput(c));
      return r.ok ? r.value.taxIdType : 'ERR';
    });
    expect(types).toEqual(
      expect.arrayContaining(['DNI', 'NIE', 'CIF', 'PT_NIF', 'FR_SIREN', 'DE_VAT', 'IT_PIVA', 'GB_VAT']),
    );
    expect(new Set(SEED_DATA.customers.map((c) => c.country))).toEqual(
      new Set(['ES', 'PT', 'FR', 'DE', 'IT', 'GB', 'US']),
    );
    expect(new Set(SEED_DATA.customers.map((c) => c.plan))).toEqual(new Set(['starter', 'growth', 'enterprise']));
    expect(SEED_DATA.customers).toHaveLength(9);
    expect(SEED_DATA.simulations).toHaveLength(14);
    expect(new Set(SEED_DATA.simulations.map((s) => s.currency))).toEqual(new Set(['EUR', 'USD', 'GBP']));
    for (const u of [0, 1, 10, 11, 50, 51]) expect(SEED_DATA.simulations.some((s) => s.users === u)).toBe(true);
    const withSims = new Set(SEED_DATA.simulations.map((s) => s.customerKey));
    expect(withSims.size).toBeLessThan(SEED_DATA.customers.length);
    expect(SEED_DATA.simulations.filter((s) => s.customerKey === 'es-dni').length).toBeGreaterThan(1);
  });

  it('DNI con letra errónea → incidencia con sujeto y campo', () => {
    const issues = validateSeedData(withCustomer({ taxId: '12345678A' }));
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ subject: 'cliente es-dni', field: 'taxId' });
    expect(issues[0]?.message).not.toBe('');
  });

  it('país UK → incidencia en country', () => {
    expect(validateSeedData(withCustomer({ country: 'UK' })).map((i) => i.field)).toContain('country');
  });

  it('divisa CHF → incidencia en currency', () => {
    const issues = validateSeedData(withSimulation({ currency: 'CHF' as never }));
    expect(issues[0]).toMatchObject({ subject: 'simulación #1', field: 'currency' });
  });

  it('customerKey inexistente', () => {
    expect(validateSeedData(withSimulation({ customerKey: 'nadie' }))[0]).toMatchObject({
      subject: 'simulación #1',
      field: 'customerKey',
    });
  });

  it('usuarios 100001 → incidencia en users', () => {
    expect(validateSeedData(withSimulation({ users: 100001 }))[0]).toMatchObject({ field: 'users' });
  });

  it('clave y país + tax ID duplicados', () => {
    const [first] = SEED_DATA.customers;
    if (first === undefined) throw new Error('sin clientes');
    const issues = validateSeedData({ ...SEED_DATA, customers: [...SEED_DATA.customers, { ...first }] });
    expect(issues.map((i) => i.field)).toEqual(expect.arrayContaining(['key', 'taxId']));
  });
});
