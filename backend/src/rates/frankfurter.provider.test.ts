// Adaptador de Frankfurter con `fetch` falso (RF11, RF16): nunca hay red.
import { describe, expect, it } from 'vitest';
import { RATE_FETCH_TIMEOUT_MS } from './constants';
import { createFrankfurterProvider } from './frankfurter.provider';
import { RateProviderError } from './rate-provider';

const BASE_URL = 'https://rates.example.test/v1/latest?apikey=SECRET-KEY';

function respond(body: string, status = 200): typeof fetch {
  return () => Promise.resolve(new Response(body, { status }));
}

function provider(fetchFn: typeof fetch) {
  return createFrankfurterProvider({ baseUrl: BASE_URL, fetchFn });
}

describe('frankfurter.provider · éxito', () => {
  it('devuelve el texto del número sin pasar por Number', async () => {
    const body = '{"amount":1.0,"base":"EUR","date":"2026-11-12","rates":{"USD":1.1}}';
    await expect(provider(respond(body)).fetchRate('USD')).resolves.toBe('1.1');
  });

  it('conserva todos los decimales del texto original', async () => {
    const body = '{"base":"EUR","rates":{"GBP":0.12345678901234567890}}';
    await expect(provider(respond(body)).fetchRate('GBP')).resolves.toBe('0.12345678901234567890');
  });

  it('pide base=EUR y la divisa, con el timeout de 5 s', async () => {
    let seen: { url: string; signal: unknown } | undefined;
    const fetchFn: typeof fetch = (input, init) => {
      seen = { url: input instanceof URL ? input.href : '', signal: init?.signal };
      return Promise.resolve(new Response('{"rates":{"USD":1.1}}'));
    };
    await provider(fetchFn).fetchRate('USD');
    const url = new URL(seen?.url ?? '');
    expect(url.searchParams.get('base')).toBe('EUR');
    expect(url.searchParams.get('symbols')).toBe('USD');
    expect(seen?.signal).toBeInstanceOf(AbortSignal);
    expect(RATE_FETCH_TIMEOUT_MS).toBe(5000);
  });
});

describe('frankfurter.provider · fallos (RF16)', () => {
  const failures: [string, typeof fetch][] = [
    ['estado distinto de 200', respond('SECRET-BODY', 500)],
    ['red caída', () => Promise.reject(new TypeError('connect ECONNREFUSED rates.example.test SECRET-KEY'))],
    ['timeout', () => Promise.reject(new DOMException('The operation was aborted due to timeout', 'TimeoutError'))],
    ['cuerpo que no es JSON', respond('SECRET-BODY <html>')],
    ['forma que no pasa Zod', respond('{"rates":"SECRET-BODY"}')],
    ['divisa ausente', respond('{"base":"EUR","rates":{"GBP":0.85}}')],
    ['tipo que no es número', respond('{"rates":{"USD":"1.1"}}')],
    ['null', respond('null')],
  ];

  it.each(failures)('%s lanza RateProviderError sin filtrar URL, clave ni cuerpo', async (_label, fetchFn) => {
    const error: unknown = await provider(fetchFn)
      .fetchRate('USD')
      .then(
        () => undefined,
        (e: unknown) => e,
      );
    expect(error).toBeInstanceOf(RateProviderError);
    const failure = error as Error;
    const text = `${failure.message} ${JSON.stringify(failure.cause ?? '')}`;
    for (const secret of ['SECRET', 'rates.example.test', 'apikey', 'html']) expect(text).not.toContain(secret);
  });
});
