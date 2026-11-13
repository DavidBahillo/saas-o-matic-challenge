// Adaptador de open.er-api.com con `fetch` falso (RF2, RF3, RF6): nunca hay red.
import { describe, expect, it } from 'vitest';
import { RATE_FETCH_TIMEOUT_MS } from './constants';
import { createOpenErApiProvider } from './open-er-api.provider';
import { RateProviderError } from './rate-provider';

const URL_WITH_SECRET = 'https://rates.example.test/v6/latest/EUR?apikey=SECRET-KEY';

function respond(body: string, status = 200): typeof fetch {
  return () => Promise.resolve(new Response(body, { status }));
}

const provider = (fetchFn: typeof fetch) => createOpenErApiProvider({ url: URL_WITH_SECRET, fetchFn });
const wrap = (rates: string) => `{"result":"success","base_code":"EUR","time_last_update_unix":1763000000,"rates":${rates}}`;

describe('open-er-api.provider · éxito', () => {
  it('devuelve el texto crudo de cada divisa de la lista, sin pasar por Number', async () => {
    const body = wrap('{"EUR":1,"USD":1.1,"CHF":0.95,"SEK":11.50,"GBP":0.12345678901234567890}');
    await expect(provider(respond(body)).fetchRates()).resolves.toEqual({
      USD: '1.1', CHF: '0.95', SEK: '11.50', GBP: '0.12345678901234567890',
    });
  });

  it('conserva la forma con exponente para que buildPairs la rechace', async () => {
    await expect(provider(respond(wrap('{"SEK":1e1}'))).fetchRates()).resolves.toEqual({ SEK: '1e1' });
  });

  it('omite divisas con valor texto o null, y las que no están en la lista', async () => {
    const body = wrap('{"USD":"1.1","SEK":null,"CHF":0.95,"JPY":170,"XYZ":2}');
    await expect(provider(respond(body)).fetchRates()).resolves.toEqual({ CHF: '0.95' });
  });

  it('usa la URL tal cual, sin añadir parámetros, con timeout de 5 s', async () => {
    let seen: { url: string; signal: unknown } | undefined;
    const fetchFn: typeof fetch = (input, init) => {
      seen = { url: typeof input === 'string' ? input : 'otro', signal: init?.signal };
      return Promise.resolve(new Response(wrap('{"USD":1.1}')));
    };
    await provider(fetchFn).fetchRates();
    expect(seen?.url).toBe(URL_WITH_SECRET);
    expect(seen?.signal).toBeInstanceOf(AbortSignal);
    expect(RATE_FETCH_TIMEOUT_MS).toBe(5000);
  });

  it('un objeto rates vacío es una respuesta válida sin divisas', async () => {
    await expect(provider(respond(wrap('{}'))).fetchRates()).resolves.toEqual({});
  });
});

describe('open-er-api.provider · fallos (RF3, RF6)', () => {
  const failures: [string, typeof fetch][] = [
    ['estado distinto de 200', respond('SECRET-BODY', 500)],
    ['red caída', () => Promise.reject(new TypeError('connect ECONNREFUSED rates.example.test SECRET-KEY'))],
    ['timeout', () => Promise.reject(new DOMException('The operation was aborted due to timeout', 'TimeoutError'))],
    ['cuerpo que no es JSON', respond('SECRET-BODY <html>')],
    ['result distinto de success', respond('{"result":"error","base_code":"EUR","rates":{"USD":1.1}}')],
    ['base distinta de EUR', respond('{"result":"success","base_code":"USD","rates":{"EUR":0.9}}')],
    ['sin rates', respond('{"result":"success","base_code":"EUR"}')],
    ['rates que no es objeto', respond('{"result":"success","base_code":"EUR","rates":"SECRET-BODY"}')],
    ['null', respond('null')],
  ];

  it.each(failures)('%s lanza RateProviderError sin filtrar URL, clave ni cuerpo', async (_label, fetchFn) => {
    const error: unknown = await provider(fetchFn).fetchRates().then(() => undefined, (e: unknown) => e);
    expect(error).toBeInstanceOf(RateProviderError);
    const failure = error as Error;
    const text = `${failure.message} ${JSON.stringify(failure.cause ?? '')}`;
    for (const secret of ['SECRET', 'rates.example.test', 'apikey', 'html']) expect(text).not.toContain(secret);
  });
});
