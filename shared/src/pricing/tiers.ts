// Definición única e inmutable de los tramos de usuarios (RF4, U1).
export type TierNumber = 1 | 2 | 3;

export interface PricingTier {
  readonly tier: TierNumber;
  /** Primera posición del tramo (1, 11, 51). */
  readonly from: number;
  /** Última posición; null = sin límite (tramo 3). */
  readonly to: number | null;
  readonly unitPriceCents: number;
}

export const MAX_USERS = 100_000;

export const PRICING_TIERS: readonly [PricingTier, PricingTier, PricingTier] = Object.freeze([
  Object.freeze({ tier: 1, from: 1, to: 10, unitPriceCents: 1000 }),
  Object.freeze({ tier: 2, from: 11, to: 50, unitPriceCents: 800 }),
  Object.freeze({ tier: 3, from: 51, to: null, unitPriceCents: 500 }),
] as const);
