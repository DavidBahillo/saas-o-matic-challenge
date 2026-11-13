// Tipos de los datos semilla (plan §3). Los importes no aparecen: los calcula la regla compartida (RF2).
import type { Currency, Plan } from '@saas-o-matic/shared';

/** El seed solo siembra estas divisas, con tipos fijos y sin red (U5 de la 006; la 007 no lo cambia). */
export const SEED_CURRENCIES: readonly Currency[] = ['EUR', 'USD', 'GBP'];

export interface SeedCustomer {
  /** Clave interna para enlazar simulaciones; no se guarda en la base. */
  key: string;
  companyName: string;
  taxId: string;
  email: string;
  country: string;
  plan: Plan;
}

export interface SeedSimulation {
  customerKey: string;
  users: number;
  storage: number;
  apiCalls: number;
  currency: Currency;
}

export interface SeedData {
  customers: SeedCustomer[];
  simulations: SeedSimulation[];
}

export interface SeedSummary {
  customersCreated: number;
  customersExisting: number;
  simulationsCreated: number;
}
