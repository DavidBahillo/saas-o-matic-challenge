// Adaptador de open.er-api.com (tipos de referencia, sin clave; 007 RF2 y RF3). Usa `fetch` nativo con
// timeout, valida la forma con Zod y devuelve el texto crudo del número de cada divisa: el reviver de
// JSON.parse recibe `source` (Node >= 22), así que el tipo nunca pasa por coma flotante. `rates` se valida
// como registro de `unknown` para que un valor malo invalide solo esa divisa (RF5). Los errores llevan
// mensajes fijos: ni la URL ni el cuerpo de la API salen de aquí (CA7 de la 004).
import { CURRENCIES } from '@saas-o-matic/shared';
import type { ForeignCurrency } from '@saas-o-matic/shared';
import { z } from 'zod';
import { RATE_FETCH_TIMEOUT_MS } from './constants';
import { RateProviderError } from './rate-provider';
import type { RateProvider, RawRates } from './rate-provider';

export interface OpenErApiOptions {
  url: string;
  /** `fetch` inyectable para probar sin red; por defecto el global. */
  fetchFn?: typeof fetch;
}

/** Tercer argumento del reviver (V8 11.4+); las definiciones de TypeScript pueden no incluirlo. */
interface ReviverContext {
  source?: string;
}

const ResponseSchema = z.object({
  result: z.literal('success'),
  base_code: z.literal('EUR'),
  rates: z.record(z.string(), z.unknown()),
});

const FOREIGN: readonly ForeignCurrency[] = CURRENCIES.filter((c): c is ForeignCurrency => c !== 'EUR');

function fail(reason: string): never {
  throw new RateProviderError(`No se pudo obtener el tipo de cambio: ${reason}.`);
}

/** Parsea el JSON guardando el texto original de cada número, por nombre de clave. */
function parseWithSources(text: string): { value: unknown; sources: Map<string, string> } {
  const sources = new Map<string, string>();
  const reviver = (key: string, value: unknown, context?: ReviverContext): unknown => {
    if (typeof value === 'number' && context?.source !== undefined) sources.set(key, context.source);
    return value;
  };
  return { value: JSON.parse(text, reviver) as unknown, sources };
}

async function request(fetchFn: typeof fetch, url: string): Promise<string> {
  let response: Response;
  try {
    response = await fetchFn(url, { signal: AbortSignal.timeout(RATE_FETCH_TIMEOUT_MS) });
  } catch {
    return fail('el proveedor no respondió');
  }
  if (response.status !== 200) return fail('estado inesperado del proveedor');
  try {
    return await response.text();
  } catch {
    return fail('respuesta ilegible');
  }
}

/** Solo las divisas de la lista cuyo valor es un número JSON; el resto cuenta como ausente. */
function pickRawRates(rates: Record<string, unknown>, sources: Map<string, string>): RawRates {
  const raw: Partial<Record<ForeignCurrency, string>> = {};
  for (const currency of FOREIGN) {
    const source = sources.get(currency);
    if (typeof rates[currency] === 'number' && source !== undefined) raw[currency] = source;
  }
  return raw;
}

export function createOpenErApiProvider(options: OpenErApiOptions): RateProvider {
  const fetchFn = options.fetchFn ?? globalThis.fetch;
  return {
    async fetchRates(): Promise<RawRates> {
      const text = await request(fetchFn, options.url);
      let parsed: ReturnType<typeof parseWithSources>;
      try {
        parsed = parseWithSources(text);
      } catch {
        return fail('respuesta no válida');
      }
      const shape = ResponseSchema.safeParse(parsed.value);
      if (!shape.success) return fail('respuesta con forma inesperada');
      return pickRawRates(shape.data.rates, parsed.sources);
    },
  };
}
