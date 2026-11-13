// Cuerpo de POST /simulations (RF25): solo estos cinco campos, nunca importes ni tipos (principio 3).
import type { Currency, SimulationInput } from '@saas-o-matic/shared';

export interface SimulationDraft {
  users: number;
  storage: number;
  apiCalls: number;
}

export function buildSimulationRequest(customerId: number, draft: SimulationDraft, currency: Currency): SimulationInput {
  return { customerId, users: draft.users, storage: draft.storage, apiCalls: draft.apiCalls, currency };
}
