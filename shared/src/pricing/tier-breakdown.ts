// Desglose acumulativo por tramos (RF1–RF3).
// Precondición: users ya validado, entero +0 … MAX_USERS.
import { PRICING_TIERS } from './tiers';
import type { TierLine } from './types';

export function computeTierBreakdown(users: number): TierLine[] {
  return PRICING_TIERS.map(({ tier, from, to, unitPriceCents }) => {
    const upper = to ?? users;
    const billedUsers = Math.max(0, Math.min(users, upper) - (from - 1));
    return { tier, from, to, unitPriceCents, billedUsers, subtotalCents: billedUsers * unitPriceCents };
  });
}

export function sumSubtotals(lines: readonly TierLine[]): number {
  return lines.reduce((sum, line) => sum + line.subtotalCents, 0);
}
