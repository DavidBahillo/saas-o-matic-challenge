// Rutas de simulaciones, sin lógica. El transporte JSON se monta solo en POST /simulations:
// cualquier otra ruta o método llega al 404 sin leer el cuerpo (RF19, plan §5).
import { Router } from 'express';
import type { SimulationsController } from '../controllers/simulations.controller';
import { readJsonBody, requireJsonContentType } from '../http/json-body';

export function createSimulationsRouter(controller: SimulationsController): Router {
  const router = Router();
  router.post('/simulations', requireJsonContentType, ...readJsonBody, async (req, res) => {
    await controller.create(req, res);
  });
  router.get('/simulations/:id', (req, res) => {
    controller.getById(req, res);
  });
  router.get('/customers/:id/simulations', (req, res) => {
    controller.listByCustomer(req, res);
  });
  return router;
}
