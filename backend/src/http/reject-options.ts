// OPTIONS es un método no definido en todas las rutas (RF30): sin este middleware, Express 5
// contesta automáticamente 200 con la cabecera Allow. Se monta antes de los routers.
import type { NextFunction, Request, Response } from 'express';
import { routeNotFound } from './errors';

export function rejectOptions(req: Request, _res: Response, next: NextFunction): void {
  next(req.method === 'OPTIONS' ? routeNotFound() : undefined);
}
