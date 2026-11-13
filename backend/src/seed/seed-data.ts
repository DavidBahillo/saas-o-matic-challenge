// Conjunto completo de datos semilla (RF1).
import { SEED_CUSTOMERS } from './seed-customers';
import { SEED_SIMULATIONS } from './seed-simulations';
import type { SeedData } from './seed-types';

export const SEED_DATA: SeedData = {
  customers: [...SEED_CUSTOMERS],
  simulations: [...SEED_SIMULATIONS],
};
