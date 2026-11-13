import { describe, expect, it } from 'vitest';
import { ACME, CUSTOMER_LIST_BODY, RATES_BODY, SIMULATION_USD } from '../test/fixtures';
import { customerListSchema, customerSchema, exchangeRateListSchema, simulationListSchema } from './schemas';

describe('esquemas de respuesta (RF34, RF35)', () => {
  it('aceptan los literales de la spec', () => {
    expect(customerSchema.parse(ACME)).toEqual(ACME);
    expect(customerListSchema.parse(CUSTOMER_LIST_BODY).total).toBe(1);
    expect(exchangeRateListSchema.parse(RATES_BODY).items).toHaveLength(2);
  });

  it('la lista de simulaciones es { items } (R2: forma real del controlador de la 003)', () => {
    const parsed = simulationListSchema.parse({ items: [SIMULATION_USD] });
    expect(parsed.items[0]?.tiers).toHaveLength(3);
    expect(parsed.items[0]?.tiers[2]?.to).toBeNull();
    expect(simulationListSchema.safeParse([SIMULATION_USD]).success).toBe(false);
  });

  it('rechazan un cliente sin simulationCount o con importes decimales', () => {
    const withoutCount: Partial<typeof ACME> = { ...ACME };
    delete withoutCount.simulationCount;
    expect(customerSchema.safeParse(withoutCount).success).toBe(false);
    expect(simulationListSchema.safeParse({ items: [{ ...SIMULATION_USD, totalCents: 169.4 }] }).success).toBe(false);
  });

  it('aceptan cualquier divisa con formato ^[A-Z]{3}$ y rechazan el resto (RF17, PT6)', () => {
    const at = '2026-11-13T09:00:00.000Z';
    const parse = (currency: string) => exchangeRateListSchema.safeParse({ items: [{ currency, exchangeRate: '0.9', exchangeRateAt: at }] }).success;
    expect(parse('CHF')).toBe(true);
    expect(parse('JPY')).toBe(true);
    expect(parse('usd')).toBe(false);
    expect(parse('EURO')).toBe(false);
  });
});
