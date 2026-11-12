// Manejador de errores final (plan §6.4): HttpError → su estado y cuerpo; fallo al decodificar el
// :id → INVALID_ID en GET/HEAD o 404 en otro método (RF22, RF30); otros 4xx → PAYLOAD_TOO_LARGE o
// MALFORMED_JSON; cualquier otro → 500 genérico (RF31). El detalle de un error inesperado solo va
// a console.error, nunca a la respuesta.
import type { NextFunction, Request, Response } from 'express';
import { INVALID_ID } from '../schemas/customer-query.schema';
import { HttpError, internalError, malformedJson, payloadTooLarge, routeNotFound, validationError } from './errors';

interface HttpLikeError {
  status: number;
  type?: unknown;
}

/** Errores de body-parser y del router (http-errors): objetos con un `status` numérico. */
function isHttpLikeError(err: unknown): err is HttpLikeError {
  return typeof err === 'object' && err !== null && 'status' in err && typeof err.status === 'number';
}

function isClientError(err: HttpLikeError): boolean {
  return err.status >= 400 && err.status < 500;
}

/**
 * El router de Express decodifica los parámetros antes de mirar el método, así que un
 * decodeURIComponent fallido (/customers/%ZZ) llega como URIError con status 400 con
 * cualquier método. En GET y HEAD, que tienen /customers/:id, es INVALID_ID (RF22); en el resto
 * es un método no definido → 404 (RF30).
 */
function fromRouteDecodeError(req: Request): HttpError {
  const hasIdRoute = (req.method === 'GET' || req.method === 'HEAD') && req.path.startsWith('/customers/');
  return hasIdRoute ? validationError([INVALID_ID]) : routeNotFound();
}

/**
 * Cualquier otro 4xx (body-parser, también la descompresión: un gzip corrupto trae status 400
 * sin type) es MALFORMED_JSON, salvo entity.too.large → PAYLOAD_TOO_LARGE (RF27, RF28).
 */
function toHttpError(err: unknown, req: Request): HttpError | undefined {
  if (err instanceof HttpError) return err;
  if (!isHttpLikeError(err) || !isClientError(err)) return undefined;
  if (err instanceof URIError && err.status === 400) return fromRouteDecodeError(req);
  return err.type === 'entity.too.large' ? payloadTooLarge() : malformedJson();
}

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }
  let httpError = toHttpError(err, req);
  if (httpError === undefined) {
    console.error('Error inesperado:', err);
    httpError = internalError();
  }
  res.status(httpError.status).json(httpError.toBody());
}
