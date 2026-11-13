// Rutas de tipos de cambio, sin lógica. Solo GET /exchange-rates; cualquier otro método llega al
// 404 sin leer el cuerpo porque no se monta el transporte JSON (RF18, plan §5).
import { Router } from 'express';
import type { ExchangeRatesController } from '../controllers/exchange-rates.controller';

export function createExchangeRatesRouter(controller: ExchangeRatesController): Router {
  const router = Router();
  router.get('/exchange-rates', async (req, res) => {
    await controller.list(req, res);
  });
  return router;
}
