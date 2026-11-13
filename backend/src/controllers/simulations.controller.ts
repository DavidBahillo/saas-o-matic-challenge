// Controller de simulaciones: traduce HTTP ↔ service (plan §3). Valida el cuerpo antes de tocar
// el service, así que un cuerpo no válido nunca consulta el cliente (RF10). Los ids de ruta
// reutilizan parseCustomerId de la 001 (RF15, RF17) y la query se ignora (RF18).
import type { Request, Response } from 'express';
import { simulationNotFound, validationError } from '../http/errors';
import { parseCustomerId } from '../schemas/customer-query.schema';
import { parseCreateSimulationBody } from '../schemas/simulation-body.schema';
import type { SimulationsService } from '../services/simulations.service';

export interface SimulationsController {
  create(req: Request, res: Response): Promise<void>;
  getById(req: Request, res: Response): void;
  listByCustomer(req: Request, res: Response): void;
}

function requireId(req: Request): number {
  const id = parseCustomerId(req.params['id']);
  if (!id.ok) throw validationError(id.errors);
  return id.value;
}

export function createSimulationsController(service: SimulationsService): SimulationsController {
  return {
    async create(req, res) {
      const body: unknown = req.body;
      const parsed = parseCreateSimulationBody(body);
      if (!parsed.ok) throw validationError(parsed.errors);
      res.status(201).json(await service.create(parsed.value));
    },
    getById(req, res) {
      const id = requireId(req);
      const simulation = service.getById(id);
      if (simulation === undefined) throw simulationNotFound(id);
      res.status(200).json(simulation);
    },
    listByCustomer(req, res) {
      res.status(200).json(service.listByCustomer(requireId(req)));
    },
  };
}
