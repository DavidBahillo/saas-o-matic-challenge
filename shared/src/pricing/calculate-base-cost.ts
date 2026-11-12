// Coste base por tramos sin país (RF1–RF3, RF11). Importes en céntimos (D2).
import { readPricingInput } from './pricing-input';
import { computeTierBreakdown, sumSubtotals } from './tier-breakdown';
import type { BaseCost, BaseCostResult } from './types';
import { validateUsers } from './validate-users';

/** Interno: precondición users validado (entero +0 … MAX_USERS). Objetos nuevos en cada llamada. */
export function buildBaseCost(users: number): BaseCost {
  const tiers = computeTierBreakdown(users);
  return { users, tiers, baseCents: sumSubtotals(tiers) };
}

export function calculateBaseCost(input?: unknown): BaseCostResult {
  const fields = readPricingInput(input);
  if (!fields.ok) return fields;
  const users = validateUsers(fields.value.users);
  if (!users.ok) return { ok: false, errors: [users.error] };
  return { ok: true, value: buildBaseCost(users.value) };
}
