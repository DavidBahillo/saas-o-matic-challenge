// Tipos de la spec 003 (plan §4): simulaciones guardadas por cliente.
import type { Quote } from '../pricing/types';

export type { ResourceReason } from '../customers/types';

/** Máximo de `storage` (GB) y `apiCalls` (llamadas/mes), RF8. */
export const RESOURCE_MAX = 1_000_000;

/** Campos permitidos del cuerpo, en el orden fijo de validación. */
export const SIMULATION_FIELDS = ['customerId', 'users', 'storage', 'apiCalls'] as const;

export interface SimulationInput {
  customerId: number;
  users: number;
  storage: number;
  apiCalls: number;
}

/** Simulación guardada: el Quote congelado más los datos del alta. */
export interface Simulation extends Quote {
  id: number;
  customerId: number;
  storage: number;
  apiCalls: number;
  createdAt: string;
}
