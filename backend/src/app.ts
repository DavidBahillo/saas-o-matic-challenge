// Composición de la app Express (plan §6.4). Orden: query parser `extended` → OPTIONS (404) →
// routers (cada uno con su propio transporte; no hay parser de cuerpo global) → 404 → errores.
import express from 'express';
import type { Express } from 'express';
import type Database from 'better-sqlite3';
import { createCustomersController } from './controllers/customers.controller';
import { errorHandler } from './http/error-handler';
import { notFound } from './http/not-found';
import { rejectOptions } from './http/reject-options';
import { createCustomersRepository } from './repositories/customers.repository';
import type { CustomersRepository } from './repositories/customers.repository';
import { createCustomersRouter } from './routes/customers.routes';
import { createCustomersService } from './services/customers.service';
import type { Clock } from './services/customers.service';

export interface AppDeps {
  db: Database.Database;
  /** Reloj inyectable para tests deterministas; por defecto, la hora actual. */
  now?: Clock;
  /** Sustituye al repositorio real (tests de errores inesperados, RF31). */
  repository?: CustomersRepository;
}

export function createApp(deps: AppDeps): Express {
  const app = express();
  app.disable('x-powered-by');
  // Con qs, q=a&q=b y q[]=a llegan como array y q[a]=b como objeto → INVALID_TYPE (RF24).
  app.set('query parser', 'extended');

  const repository = deps.repository ?? createCustomersRepository(deps.db);
  const service = createCustomersService(repository, deps.now ?? (() => new Date()));
  // OPTIONS → 404 antes de que el router lo conteste solo (RF30). HEAD usa el handler del GET.
  app.use(rejectOptions);
  app.use(createCustomersRouter(createCustomersController(service)));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
