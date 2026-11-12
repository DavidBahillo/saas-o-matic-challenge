// RF28 · UTF-8 estricto en POST /customers (T11, RFC 8259 §8.1): un cuerpo con una secuencia
// UTF-8 no válida o que empieza por el BOM da 400 MALFORMED_JSON y no crea filas (CA5); nunca
// se guarda el texto con U+FFFD. Los bytes no válidos se construyen con Buffer.from([...]).
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CONTRACT_REQUEST, CONTRACT_RESPONSE, createTestApp } from './helpers/test-app';
import type { TestApp } from './helpers/test-app';
import { rawPostCustomers } from './helpers/raw-http';
import type { RawResponse } from './helpers/raw-http';

const MALFORMED = { error: { code: 'MALFORMED_JSON', message: 'El cuerpo de la petición no es un JSON válido.' } };

let t: TestApp;

beforeEach(() => {
  t = createTestApp();
});

afterEach(() => {
  t.close();
});

/** Envía los bytes tal cual (supertest serializaría un Buffer como JSON). */
function postBytes(body: Buffer, contentType = 'application/json'): Promise<RawResponse> {
  const headers = [`Content-Type: ${contentType}`, `Content-Length: ${String(body.length)}`];
  return rawPostCustomers(t.app, headers, body);
}

/** El JSON del contrato con la "é" de "Ibérica" sustituida por los bytes indicados. */
function contractWithBytesForE(bytes: readonly number[]): Buffer {
  const [before = '', after = ''] = JSON.stringify(CONTRACT_REQUEST).split('é');
  return Buffer.concat([Buffer.from(before, 'utf8'), Buffer.from(bytes), Buffer.from(after, 'utf8')]);
}

describe('RF28 · UTF-8 no válido o BOM → 400 MALFORMED_JSON', () => {
  it.each([
    ['un byte 0xE9 suelto (é en Latin-1)', contractWithBytesForE([0xe9])],
    ['un 0xC3 sin byte de continuación', contractWithBytesForE([0xc3])],
    ['un 0xC3 al final del cuerpo', Buffer.concat([Buffer.from('{"a":"'), Buffer.from([0xc3])])],
    [
      'el BOM EF BB BF delante de un JSON válido',
      Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(JSON.stringify(CONTRACT_REQUEST), 'utf8')]),
    ],
  ])('cuerpo con %s → 400 MALFORMED_JSON sin crear filas', async (_label, body) => {
    const res = await postBytes(body);
    expect(res.status).toBe(400);
    expect(res.body).toEqual(MALFORMED);
    expect(t.countCustomers()).toBe(0);
  });

  it('"Ibérica" codificado correctamente en UTF-8 (C3 A9) → se procesa (201)', async () => {
    const body = contractWithBytesForE([0xc3, 0xa9]);
    expect(body.equals(Buffer.from(JSON.stringify(CONTRACT_REQUEST), 'utf8'))).toBe(true);
    const res = await postBytes(body);
    expect(res.status).toBe(201);
    expect(res.body).toEqual(CONTRACT_RESPONSE);
  });

  it('el orden se mantiene: un cuerpo de más de 10 240 bytes con UTF-8 no válido → PAYLOAD_TOO_LARGE', async () => {
    const res = await postBytes(Buffer.concat([Buffer.from([0xe9]), Buffer.alloc(10_240, 0x20)]));
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: 'PAYLOAD_TOO_LARGE' } });
  });

  it('el orden se mantiene: UTF-8 no válido con text/plain → UNSUPPORTED_CONTENT_TYPE', async () => {
    const res = await postBytes(Buffer.from([0xe9]), 'text/plain');
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: 'UNSUPPORTED_CONTENT_TYPE' } });
  });
});
