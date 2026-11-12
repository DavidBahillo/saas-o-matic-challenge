// Presupuesto con IVA por país (RF8–RF10, RF12, RF13, RF16). Importes en céntimos (D2). Nunca lanza.
import type { FieldError } from '../customers/types';
import { buildBaseCost } from './calculate-base-cost';
import { readPricingInput } from './pricing-input';
import type { Quote, QuoteResult } from './types';
import { validateUsers } from './validate-users';
import { validateVatCountry } from './validate-vat-country';
import { vatCentsHalfUp } from './vat-cents';
import { vatRatePercentFor } from './vat-rates';

function buildQuote(users: number, country: string): Quote {
  const { tiers, baseCents } = buildBaseCost(users);
  const vatRatePercent = vatRatePercentFor(country);
  const vatCents = vatCentsHalfUp(baseCents, vatRatePercent); // una sola vez, sobre la base total
  return { users, tiers, baseCents, country, vatRatePercent, vatCents, totalCents: baseCents + vatCents };
}

export function calculateQuote(input?: unknown): QuoteResult {
  const fields = readPricingInput(input);
  if (!fields.ok) return fields;
  const users = validateUsers(fields.value.users);
  const country = validateVatCountry(fields.value.country);
  const errors: FieldError[] = [];
  if (!users.ok) errors.push(users.error);
  if (!country.ok) errors.push(country.error);
  if (!users.ok || !country.ok) return { ok: false, errors };
  return { ok: true, value: buildQuote(users.value, country.value) };
}
