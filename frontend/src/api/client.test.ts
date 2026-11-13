import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApiError } from './errors';
import { apiRequest } from './client';
import { mockFetch } from '../test/mock-fetch';

const schema = z.object({ ok: z.literal(true) });

afterEach(() => vi.unstubAllGlobals());

describe('apiRequest (RF34, RF37)', () => {
  it('llama a /api y devuelve el cuerpo validado', async () => {
    const mock = mockFetch({ 'GET /api/ping': { body: { ok: true } } });
    await expect(apiRequest('/ping', schema)).resolves.toEqual({ ok: true });
    expect(mock.calls).toHaveLength(1);
    expect(mock.calls[0]?.path).toBe('/api/ping');
  });

  it('un 400 se convierte en ApiError de tipo api', async () => {
    mockFetch({
      'GET /api/ping': {
        status: 400,
        body: { error: { code: 'VALIDATION_ERROR', message: 'Mal.', details: { fields: [] } } },
      },
    });
    const error = await apiRequest('/ping', schema).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: 'api', status: 400, code: 'VALIDATION_ERROR', message: 'Mal.' });
  });

  it('un 500 con la forma de error es de tipo api', async () => {
    mockFetch({ 'GET /api/ping': { status: 500, body: { error: { code: 'INTERNAL_ERROR', message: 'Fallo.' } } } });
    await expect(apiRequest('/ping', schema)).rejects.toMatchObject({ kind: 'api', status: 500 });
  });

  it('la red caída es de tipo network', async () => {
    mockFetch({ 'GET /api/ping': 'network-error' });
    await expect(apiRequest('/ping', schema)).rejects.toMatchObject({ kind: 'network' });
  });

  it('un cuerpo de error que no cumple la forma es invalid-response', async () => {
    mockFetch({ 'GET /api/ping': { status: 500, body: { trace: 'at x.js:1' } } });
    await expect(apiRequest('/ping', schema)).rejects.toMatchObject({ kind: 'invalid-response', status: 500 });
  });

  it('un 200 que no cumple el esquema es invalid-response', async () => {
    mockFetch({ 'GET /api/ping': { body: { ok: false } } });
    await expect(apiRequest('/ping', schema)).rejects.toMatchObject({ kind: 'invalid-response', status: 200 });
  });

  it('un 200 que no es JSON es invalid-response', async () => {
    mockFetch({ 'GET /api/ping': { rawBody: '<html>' } });
    await expect(apiRequest('/ping', schema)).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('envía el cuerpo JSON con su Content-Type', async () => {
    const mock = mockFetch({ 'POST /api/ping': { status: 201, body: { ok: true } } });
    await apiRequest('/ping', schema, { method: 'POST', body: JSON.stringify({ a: 1 }) });
    expect(mock.calls[0]).toMatchObject({ method: 'POST', body: { a: 1 } });
    expect(mock.calls[0]?.contentType).toBe('application/json');
  });
});
