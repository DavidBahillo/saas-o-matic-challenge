// Transporte del cuerpo JSON, montado solo en las rutas que lo necesitan (plan §6.4), de modo que
// una ruta inexistente responde 404 antes de mirar el transporte (RF30). Orden: Content-Type
// (RF26) → tamaño con express.raw (RF27) → UTF-8 estricto y JSON.parse propio (RF28). El
// resultado `unknown` queda en req.body; comprobar que es un objeto (RF29) es cosa del esquema Zod.
import express from 'express';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { isJsonContentType } from './content-type';
import { MAX_BODY_BYTES, malformedJson, unsupportedContentType } from './errors';

const BOM = String.fromCodePoint(0xfeff);

export function requireJsonContentType(req: Request, _res: Response, next: NextFunction): void {
  next(isJsonContentType(req.headers['content-type']) ? undefined : unsupportedContentType());
}

/**
 * UTF-8 estricto (RFC 8259 §8.1): `fatal` lanza TypeError ante cualquier secuencia no válida en
 * vez de sustituirla por U+FFFD, e `ignoreBOM` conserva el BOM como U+FEFF para rechazarlo
 * explícitamente. Devuelve `undefined` si el texto no es aceptable.
 */
function decodeStrictUtf8(bytes: Buffer): string | undefined {
  try {
    const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
    return text === '' || text.startsWith(BOM) ? undefined : text;
  } catch {
    return undefined;
  }
}

/**
 * express.raw no deja un Buffer en req.body si la petición no tiene cuerpo
 * (ni Content-Length ni Transfer-Encoding) y como Buffer vacío si lo tiene vacío: los dos casos,
 * el UTF-8 no válido, el BOM y la sintaxis incorrecta son MALFORMED_JSON.
 */
function parseJsonBytes(req: Request, _res: Response, next: NextFunction): void {
  const raw: unknown = req.body;
  const text = Buffer.isBuffer(raw) ? decodeStrictUtf8(raw) : undefined;
  if (text === undefined) {
    next(malformedJson());
    return;
  }
  try {
    const parsed: unknown = JSON.parse(text);
    req.body = parsed;
    next();
  } catch {
    next(malformedJson());
  }
}

/** Lee el cuerpo como bytes (máximo 10 240), lo decodifica como UTF-8 estricto y lo parsea. */
export const readJsonBody: readonly RequestHandler[] = [
  express.raw({ type: 'application/json', limit: MAX_BODY_BYTES }),
  parseJsonBytes,
];
