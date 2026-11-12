// Rutas de clientes, sin lógica. El transporte JSON se monta solo en POST /customers, así que
// cualquier otra ruta o método llega al 404 sin pasar por él (RF30, plan §6.4).
import { Router } from 'express';
import type { CustomersController } from '../controllers/customers.controller';
import { readJsonBody, requireJsonContentType } from '../http/json-body';

export function createCustomersRouter(controller: CustomersController): Router {
  const router = Router();
  router.post('/customers', requireJsonContentType, ...readJsonBody, (req, res) => {
    controller.create(req, res);
  });
  router.get('/customers', (req, res) => {
    controller.search(req, res);
  });
  router.get('/customers/:id', (req, res) => {
    controller.getById(req, res);
  });
  return router;
}
