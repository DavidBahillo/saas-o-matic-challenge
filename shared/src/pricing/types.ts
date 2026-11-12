// Tipos de resultado del cálculo de precios (importes en céntimos enteros, D2).
import type { FieldError } from '../customers/types';
import type { TierNumber } from './tiers';

export interface TierLine {
  readonly tier: TierNumber;
  readonly from: number;
  readonly to: number | null;
  readonly unitPriceCents: number;
  readonly billedUsers: number;
  readonly subtotalCents: number;
}

export interface BaseCost {
  readonly users: number;
  readonly tiers: readonly TierLine[];
  readonly baseCents: number;
}

export interface Quote extends BaseCost {
  readonly country: string;
  readonly vatRatePercent: number;
  readonly vatCents: number;
  readonly totalCents: number;
}

export type PricingResult<T> = { ok: true; value: T } | { ok: false; errors: FieldError[] };
export type BaseCostResult = PricingResult<BaseCost>;
export type QuoteResult = PricingResult<Quote>;
