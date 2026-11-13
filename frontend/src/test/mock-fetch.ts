// Sustituye fetch con vi.stubGlobal (D-P7): ninguna prueba llama a una API real (CA1).
import { vi } from 'vitest';

export interface MockReply {
  status?: number;
  body?: unknown;
  /** Texto tal cual, para simular cuerpos que no son JSON. */
  rawBody?: string;
}
export type MockOutcome = MockReply | 'network-error';
/** El manejador puede devolver una promesa para simular respuestas lentas o que nunca llegan. */
export type MockHandler = MockOutcome | ((request: RecordedCall) => MockOutcome | Promise<MockOutcome>);

export interface RecordedCall {
  method: string;
  /** Ruta sin la query, p. ej. "/api/customers". */
  path: string;
  query: URLSearchParams;
  body: unknown;
  contentType: string | null;
}

export interface FetchMock {
  calls: RecordedCall[];
  callsTo(key: string): RecordedCall[];
}

function recordCall(input: RequestInfo | URL, init: RequestInit | undefined): RecordedCall {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, 'http://localhost');
  const headers = new Headers(init?.headers);
  const raw = typeof init?.body === 'string' ? init.body : undefined;
  return {
    method: (init?.method ?? 'GET').toUpperCase(),
    path: url.pathname,
    query: url.searchParams,
    body: raw === undefined ? undefined : (JSON.parse(raw) as unknown),
    contentType: headers.get('Content-Type'),
  };
}

/** Rutas con la forma "GET /api/customers". Una ruta sin definir falla la petición con un error claro. */
export function mockFetch(routes: Record<string, MockHandler>): FetchMock {
  const calls: RecordedCall[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const call = recordCall(input, init);
      calls.push(call);
      const handler = routes[`${call.method} ${call.path}`];
      if (handler === undefined) return Promise.reject(new Error(`mockFetch: sin ruta ${call.method} ${call.path}`));
      return Promise.resolve(typeof handler === 'function' ? handler(call) : handler).then((reply) => {
        if (reply === 'network-error') throw new TypeError('Failed to fetch');
        const text = reply.rawBody ?? JSON.stringify(reply.body ?? {});
        return new Response(text, { status: reply.status ?? 200 });
      });
    }),
  );
  return { calls, callsTo: (key) => calls.filter((c) => `${c.method} ${c.path}` === key) };
}
