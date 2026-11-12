// Ruta o método no definidos → 404 NOT_FOUND (RF30). Se monta después de todos los routers.
import type { NextFunction, Request, Response } from 'express';
import { routeNotFound } from './errors';

export function notFound(_req: Request, _res: Response, next: NextFunction): void {
  next(routeNotFound());
}
