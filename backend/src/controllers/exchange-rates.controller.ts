// Controller de GET /exchange-rates (RF18): la query se ignora; los errores siguen al errorHandler.
import type { Request, Response } from 'express';
import type { ExchangeRatesService } from '../services/exchange-rates.service';

export interface ExchangeRatesController {
  list(req: Request, res: Response): Promise<void>;
}

export function createExchangeRatesController(service: ExchangeRatesService): ExchangeRatesController {
  return {
    async list(_req, res) {
      res.status(200).json({ items: await service.getAll() });
    },
  };
}
