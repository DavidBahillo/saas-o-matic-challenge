// GET /exchange-rates (RF18): tabla "GET /exchange-rates". Proveedor y reloj falsos, sin red.
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { providerDown } from '../test/helpers/fake-rates';
import { createTestApp, FIXED_NOW } from '../test/helpers/test-app';
import type { TestApp } from '../test/helpers/test-app';

let t: TestApp;

beforeEach(() => {
  t = createTestApp();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  t.close();
  vi.restoreAllMocks();
});

const ITEMS = [
  { currency: 'USD', exchangeRate: '1.100000', exchangeRateAt: FIXED_NOW },
  { currency: 'GBP', exchangeRate: '0.850000', exchangeRateAt: FIXED_NOW },
];

describe('GET /exchange-rates (RF18)', () => {
  it('con la caché vacía y la API operativa devuelve USD y GBP, en ese orden, con su instante', async () => {
    const res = await request(t.app).get('/exchange-rates');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: ITEMS });
    expect(t.rates.calls).toEqual(['USD', 'GBP']);
  });

  it('con la caché vigente no llama a la API', async () => {
    await request(t.app).get('/exchange-rates');
    const res = await request(t.app).get('/exchange-rates');
    expect(res.body).toEqual({ items: ITEMS });
    expect(t.rates.calls).toHaveLength(2);
  });

  it('si falla GBP y USD está bien, 500 sin tipos parciales (V2) y sin filtrar datos internos', async () => {
    t.rates.answers.GBP = providerDown();
    const res = await request(t.app).get('/exchange-rates');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: {
        code: 'EXCHANGE_RATE_UNAVAILABLE',
        message: 'No se pudo obtener el tipo de cambio. Inténtalo de nuevo más tarde.',
      },
    });
    expect(res.text).not.toMatch(/SECRET|secret\.example|apikey/);
  });

  it('ignora los parámetros de consulta', async () => {
    const res = await request(t.app).get('/exchange-rates?currency=USD');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: ITEMS });
  });

  it.each(['post', 'put', 'patch', 'delete'] as const)(
    '%s /exchange-rates con JSON no válido da 404 NOT_FOUND, no 400',
    async (method) => {
      const res = await request(t.app)[method]('/exchange-rates').set('Content-Type', 'application/json').send('{');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'La ruta solicitada no existe.' } });
      expect(t.rates.calls).toEqual([]);
    },
  );
});
