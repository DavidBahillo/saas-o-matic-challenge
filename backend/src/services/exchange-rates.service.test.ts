// Servicio de tipos de cambio con caché (RF12, RF15-RF18): reloj y proveedor falsos, sin red.
import type { ForeignCurrency } from '@saas-o-matic/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RateProviderError } from '../rates/rate-provider';
import type { RateProvider } from '../rates/rate-provider';
import { createExchangeRatesService } from './exchange-rates.service';

const T0 = new Date('2026-11-13T10:00:00.000Z').getTime();
const DAY = 86_400_000;

let clock: number;
let calls: ForeignCurrency[];
let answers: Record<ForeignCurrency, string | Error>;

const provider: RateProvider = {
  fetchRate(currency) {
    calls.push(currency);
    const answer = answers[currency];
    return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer);
  },
};

const service = () => createExchangeRatesService({ provider, now: () => new Date(clock) });
const UNAVAILABLE = { status: 500, code: 'EXCHANGE_RATE_UNAVAILABLE' };

beforeEach(() => {
  clock = T0;
  calls = [];
  answers = { USD: '1.1', GBP: '0.85' };
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('exchange-rates.service · caché (RF15)', () => {
  it('la primera petición llama al proveedor y devuelve el par (tipo, instante)', async () => {
    expect(await service().getRate('USD')).toEqual({ micros: 1_100_000, at: new Date(T0) });
    expect(calls).toEqual(['USD']);
  });

  it('usa la caché a 23 h 59 min 59,999 s', async () => {
    const s = service();
    await s.getRate('USD');
    clock = T0 + DAY - 1;
    expect((await s.getRate('USD')).at).toEqual(new Date(T0));
    expect(calls).toHaveLength(1);
  });

  it('renueva a exactamente 24 h con el tipo nuevo y su instante', async () => {
    const s = service();
    await s.getRate('USD');
    answers.USD = '1.2';
    clock = T0 + DAY;
    expect(await s.getRate('USD')).toEqual({ micros: 1_200_000, at: new Date(T0 + DAY) });
    expect(calls).toHaveLength(2);
  });

  it('renueva con antigüedad negativa (reloj hacia atrás, V4)', async () => {
    const s = service();
    await s.getRate('USD');
    clock = T0 - 3_600_000;
    await s.getRate('USD');
    expect(calls).toHaveLength(2);
  });

  it('mantiene una caché por divisa: USD vigente y GBP sin caché llama solo por GBP', async () => {
    const s = service();
    await s.getRate('USD');
    calls = [];
    await s.getRate('GBP');
    await s.getRate('USD');
    expect(calls).toEqual(['GBP']);
  });
});

describe('exchange-rates.service · fallos (RF16)', () => {
  it('sin caché y con el proveedor caído da EXCHANGE_RATE_UNAVAILABLE y escribe la causa en el log', async () => {
    answers.USD = new RateProviderError('causa interna');
    await expect(service().getRate('USD')).rejects.toMatchObject(UNAVAILABLE);
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('el mensaje de la respuesta no contiene la causa', async () => {
    answers.USD = new RateProviderError('causa interna secreta');
    const error: unknown = await service().getRate('USD').catch((e: unknown) => e);
    expect(JSON.stringify((error as { toBody(): unknown }).toBody())).not.toContain('secreta');
  });

  it('con el tipo caducado y la API caída falla: nunca usa un tipo caducado', async () => {
    const s = service();
    await s.getRate('USD');
    clock = T0 + DAY;
    answers.USD = new RateProviderError('caída');
    await expect(s.getRate('USD')).rejects.toMatchObject(UNAVAILABLE);
  });

  it.each([['0.0099994'], ['100.0000005'], ['abc'], ['0'], ['1e0'], ['']])(
    'un tipo %j del proveedor da EXCHANGE_RATE_UNAVAILABLE y no se guarda en caché',
    async (bad) => {
      const s = service();
      answers.USD = bad;
      await expect(s.getRate('USD')).rejects.toMatchObject(UNAVAILABLE);
      answers.USD = '1.1';
      expect((await s.getRate('USD')).micros).toBe(1_100_000);
      expect(calls).toHaveLength(2);
    },
  );
});

describe('exchange-rates.service · concurrencia (RF17)', () => {
  it('dos peticiones simultáneas con la caché vacía devuelven un par válido cada una', async () => {
    const s = service();
    const [a, b] = await Promise.all([s.getRate('USD'), s.getRate('USD')]);
    for (const r of [a, b]) expect(r).toEqual({ micros: 1_100_000, at: new Date(T0) });
  });

  it('cada petición recibe el par que ella misma obtuvo (RF17)', async () => {
    let release: (text: string) => void = () => undefined;
    const slow: RateProvider = {
      fetchRate: () => new Promise<string>((resolve) => { release = resolve; }),
    };
    const slowService = createExchangeRatesService({ provider: slow, now: () => new Date(clock) });
    const first = slowService.getRate('USD');
    release('1.5');
    expect(await first).toEqual({ micros: 1_500_000, at: new Date(T0) });
  });
});

describe('exchange-rates.service · getAll (RF18)', () => {
  it('devuelve USD y GBP, en ese orden, con tipo en texto e instante ISO', async () => {
    expect(await service().getAll()).toEqual([
      { currency: 'USD', exchangeRate: '1.100000', exchangeRateAt: '2026-11-13T10:00:00.000Z' },
      { currency: 'GBP', exchangeRate: '0.850000', exchangeRateAt: '2026-11-13T10:00:00.000Z' },
    ]);
    expect(calls).toEqual(['USD', 'GBP']);
  });

  it('falla entero si falla una divisa, sin tipos parciales (V2)', async () => {
    answers.GBP = new RateProviderError('caída');
    await expect(service().getAll()).rejects.toMatchObject(UNAVAILABLE);
  });

  it('con la caché vigente no llama al proveedor', async () => {
    const s = service();
    await s.getAll();
    calls = [];
    await s.getAll();
    expect(calls).toEqual([]);
  });
});
