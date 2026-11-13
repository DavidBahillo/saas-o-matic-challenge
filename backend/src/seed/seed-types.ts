// Tipos de los datos semilla (plan §3). Los importes no aparecen: los calcula la regla compartida (RF2).
import type { Currency, Plan } from '@saas-o-matic/shared';

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
