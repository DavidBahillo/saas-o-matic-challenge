// Controller de clientes: traduce HTTP ↔ service. Valida cuerpo, id y query con los esquemas Zod
// del borde y delega en el service; los errores siguen hasta el errorHandler (Express 5).
import type { Request, Response } from 'express';
import { validationError } from '../http/errors';
import { parseCreateCustomerBody } from '../schemas/customer-body.schema';
import { parseCustomerId, parseSearchQuery } from '../schemas/customer-query.schema';
import type { CustomersService } from '../services/customers.service';

export interface CustomersController {
  create(req: Request, res: Response): void;
  getById(req: Request, res: Response): void;
  search(req: Request, res: Response): void;
}

export function createCustomersController(service: CustomersService): CustomersController {
  return {
    create(req, res) {
      const body: unknown = req.body;
      const parsed = parseCreateCustomerBody(body);
      if (!parsed.ok) throw validationError(parsed.errors);
      res.status(201).json(service.create(parsed.value));
    },
    getById(req, res) {
      const id = parseCustomerId(req.params['id']);
      if (!id.ok) throw validationError(id.errors);
      res.status(200).json(service.getById(id.value));
    },
    search(req, res) {
      const query: unknown = req.query;
      const q = parseSearchQuery(query);
      if (!q.ok) throw validationError(q.errors);
      res.status(200).json(service.search(q.value));
    },
  };
}
