// Adaptador de Frankfurter (tipos de referencia del BCE, sin clave; plan §2). Usa `fetch` nativo
// con timeout, valida la forma con Zod y devuelve el texto decimal original del número (RF11):
// el reviver de JSON.parse recibe `source` (Node >= 22), así que el tipo nunca pasa por float.
// Los errores llevan mensajes fijos: ni la URL ni el cuerpo de la API salen de aquí (CA7).
import type { ForeignCurrency } from '@saas-o-matic/shared';
import { z } from 'zod';
import { RATE_FETCH_TIMEOUT_MS } from './constants';
import { RateProviderError } from './rate-provider';
import type { RateProvider } from './rate-provider';

export interface FrankfurterOptions {
  baseUrl: string;
  /** `fetch` inyectable para probar sin red; por defecto el global. */
  fetchFn?: typeof fetch;
}

/** Tercer argumento del reviver (V8 12); las definiciones de TypeScript pueden no incluirlo. */
interface ReviverContext {
  source?: string;
}

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

async function request(fetchFn: typeof fetch, url: URL): Promise<string> {
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

export function createFrankfurterProvider(options: FrankfurterOptions): RateProvider {
  const fetchFn = options.fetchFn ?? globalThis.fetch;
  return {
    async fetchRate(currency: ForeignCurrency): Promise<string> {
      const url = new URL(options.baseUrl);
      url.searchParams.set('base', 'EUR');
      url.searchParams.set('symbols', currency);
      const text = await request(fetchFn, url);
      let parsed: ReturnType<typeof parseWithSources>;
      try {
        parsed = parseWithSources(text);
      } catch {
        return fail('respuesta no válida');
      }
      const shape = z.object({ rates: z.object({ [currency]: z.number() }) }).safeParse(parsed.value);
      const source = parsed.sources.get(currency);
      if (!shape.success || source === undefined) return fail('respuesta con forma inesperada');
      return source;
    },
  };
}
