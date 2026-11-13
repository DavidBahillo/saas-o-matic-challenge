// Servicio de tipos de cambio sobre el snapshot (007, RF5, RF8): reloj y proveedor falsos, sin red.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RateProviderError } from '../rates/rate-provider';
import type { RateProvider, RawRates } from '../rates/rate-provider';
import { createExchangeRatesService } from './exchange-rates.service';

const T0 = new Date('2026-11-13T10:00:00.000Z').getTime();
const DAY = 86_400_000;
const UNAVAILABLE = { status: 500, code: 'EXCHANGE_RATE_UNAVAILABLE' };

let clock: number;
let calls: number;
let answer: RawRates | Error;

const provider: RateProvider = {
  fetchRates() {
    calls += 1;
    return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer);
  },
};

const service = () => createExchangeRatesService({ provider, now: () => new Date(clock) });

beforeEach(() => {
  clock = T0;
  calls = 0;
  answer = { USD: '1.1', GBP: '0.85', CHF: '0.95' };
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('exchange-rates.service · getRate', () => {
  it('devuelve el par (tipo, instante) del snapshot', async () => {
    expect(await service().getRate('CHF')).toEqual({ micros: 950_000, at: new Date(T0) });
    expect(calls).toBe(1);
  });

  it('todas las divisas comparten el mismo instante y una sola llamada', async () => {
    const s = service();
    const [usd, gbp] = await Promise.all([s.getRate('USD'), s.getRate('GBP')]);
    expect(usd.at).toEqual(gbp.at);
    expect(calls).toBe(1);
  });

  it('una divisa ausente da 500 sin llamar de nuevo al proveedor (PT4)', async () => {
    const s = service();
    await s.getRate('USD');
    await expect(s.getRate('SEK')).rejects.toMatchObject(UNAVAILABLE);
    await expect(s.getRate('SEK')).rejects.toMatchObject(UNAVAILABLE);
    expect(calls).toBe(1);
  });

  it('una divisa inválida (1e1) es no disponible y las demás siguen', async () => {
    answer = { SEK: '1e1', CHF: '0.95' };
    const s = service();
    await expect(s.getRate('SEK')).rejects.toMatchObject(UNAVAILABLE);
    expect((await s.getRate('CHF')).micros).toBe(950_000);
  });

  it('con el proveedor caído da 500 sin filtrar la causa', async () => {
    answer = new RateProviderError('causa interna secreta');
    const error: unknown = await service().getRate('USD').catch((e: unknown) => e);
    expect(error).toMatchObject(UNAVAILABLE);
    expect(JSON.stringify((error as { toBody(): unknown }).toBody())).not.toContain('secreta');
  });

  it('a las 24 h renueva el snapshot', async () => {
    const s = service();
    await s.getRate('USD');
    answer = { USD: '1.2' };
    clock = T0 + DAY;
    expect(await s.getRate('USD')).toEqual({ micros: 1_200_000, at: new Date(T0 + DAY) });
  });
});

describe('exchange-rates.service · getAll (RF8)', () => {
  it('devuelve las divisas disponibles en el orden de la lista, con el mismo instante', async () => {
    answer = { CHF: '0.95', GBP: '0.85', USD: '1.1' };
    expect(await service().getAll()).toEqual([
      { currency: 'USD', exchangeRate: '1.100000', exchangeRateAt: '2026-11-13T10:00:00.000Z' },
      { currency: 'GBP', exchangeRate: '0.850000', exchangeRateAt: '2026-11-13T10:00:00.000Z' },
      { currency: 'CHF', exchangeRate: '0.950000', exchangeRateAt: '2026-11-13T10:00:00.000Z' },
    ]);
  });

  it('omite la divisa ausente sin fallar (tolerancia)', async () => {
    answer = { USD: '1.1', CHF: '0.95' };
    const items = await service().getAll();
    expect(items.map((i) => i.currency)).toEqual(['USD', 'CHF']);
  });

  it('con cero divisas válidas da 500', async () => {
    answer = { USD: '1e0' };
    await expect(service().getAll()).rejects.toMatchObject(UNAVAILABLE);
  });

  it('con el snapshot vigente no llama al proveedor', async () => {
    const s = service();
    await s.getAll();
    await s.getAll();
    expect(calls).toBe(1);
  });
});
