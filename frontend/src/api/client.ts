// Cliente HTTP (RF34, RF37): prefijo /api, JSON y validación Zod de cada respuesta.
import type { z } from 'zod';
import { ApiError, GENERAL_ERROR_MESSAGE, toApiError } from './errors';

export const API_PREFIX = '/api';

async function readJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    return undefined;
  }
}

function buildHeaders(init: RequestInit | undefined): Headers {
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');
  if (init?.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return headers;
}

export async function apiRequest<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_PREFIX}${path}`, {
      ...init,
      headers: buildHeaders(init),
    });
  } catch {
    throw new ApiError('network', GENERAL_ERROR_MESSAGE);
  }
  const body = await readJson(response);
  if (!response.ok) throw toApiError(response.status, body);
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new ApiError('invalid-response', GENERAL_ERROR_MESSAGE, { status: response.status });
  return parsed.data;
}
