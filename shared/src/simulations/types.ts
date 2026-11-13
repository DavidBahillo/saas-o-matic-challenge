// Tipos de la spec 003 (plan §4): simulaciones guardadas por cliente.
import type { Currency } from '../currency/types';
import type { Quote } from '../pricing/types';

export type { ResourceReason } from '../customers/types';

/** Máximo de `storage` (GB) y `apiCalls` (llamadas/mes), RF8. */
export const RESOURCE_MAX = 1_000_000;

/** Campos permitidos del cuerpo, en el orden fijo de validación. */
export const SIMULATION_FIELDS = ['customerId', 'users', 'storage', 'apiCalls', 'currency'] as const;

export interface SimulationInput {
  customerId: number;
  users: number;
  storage: number;
  apiCalls: number;
  currency: Currency;
}

/** Simulación guardada: el Quote congelado más los datos del alta. */
export interface Simulation extends Quote {
  id: number;
  customerId: number;
  storage: number;
  apiCalls: number;
  /** Conversión congelada (004, RF8): tipo en texto de 6 decimales e importes en céntimos de `currency`. */
  currency: Currency;
  exchangeRate: string;
  exchangeRateAt: string;
  convertedBaseCents: number;
  convertedVatCents: number;
  convertedTotalCents: number;
  createdAt: string;
}
