// Simulaciones semilla (RF3, plan §6): 14, con los límites de tramo 0, 1, 10, 11, 50 y 51 usuarios y
// las tres divisas. El cliente `gb` no tiene ninguna y `es-dni` tiene siete. Solo se declaran las
// entradas: los importes los calcula calculateQuote/convertQuote al crear (RF2).
import type { Currency } from '@saas-o-matic/shared';
import type { SeedSimulation } from './seed-types';

function sim(
  customerKey: string,
  users: number,
  storage: number,
  apiCalls: number,
  currency: Currency = 'EUR',
): SeedSimulation {
  return { customerKey, users, storage, apiCalls, currency };
}

export const SEED_SIMULATIONS: readonly SeedSimulation[] = [
  sim('es-dni', 0, 0, 0),
  sim('es-dni', 1, 5, 1_000),
  sim('es-dni', 10, 50, 20_000),
  sim('es-dni', 11, 120, 45_000),
  sim('es-dni', 50, 800, 300_000),
  sim('es-dni', 51, 1_000, 500_000),
  sim('es-dni', 51, 1_000, 500_000, 'USD'),
  sim('es-nie', 25, 250, 80_000, 'GBP'),
  sim('es-cif', 120, 10_000, 900_000),
  sim('us', 15, 300, 60_000),
  sim('pt', 30, 400, 150_000, 'USD'),
  sim('fr', 8, 40, 5_000),
  sim('de', 60, 2_500, 1_000_000, 'GBP'),
  sim('it', 12, 150, 30_000),
];
