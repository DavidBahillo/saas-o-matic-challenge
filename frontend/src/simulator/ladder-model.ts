// Modelo de la escalera de tramos (RF43, RF51): precio, límites del tramo, rango completo y corto, y tramo alcanzado.
import type { Quote } from '@saas-o-matic/shared';
import { formatMoney } from '../lib/format-money';

export interface LadderStep {
  tier: 1 | 2 | 3;
  unitPriceCents: number;
  /** Primer usuario del tramo y último (null en el tramo abierto). */
  from: number;
  to: number | null;
  /** "1–10", "11–50", "51 o más" (con espacios duros). */
  rangeFull: string;
  /** "1–10", "11–50", "51+". */
  rangeShort: string;
  /** Hay usuarios facturados en el tramo. */
  reached: boolean;
}

type Tiers = Quote['tiers'];

const NBSP = String.fromCharCode(0xa0);

export function buildLadder(tiers: Tiers): LadderStep[] {
  return tiers.map((t) => ({
    tier: t.tier,
    unitPriceCents: t.unitPriceCents,
    from: t.from,
    to: t.to,
    rangeFull: t.to === null ? `${String(t.from)}${NBSP}o${NBSP}más` : `${String(t.from)}–${String(t.to)}`,
    rangeShort: t.to === null ? `${String(t.from)}+` : `${String(t.from)}–${String(t.to)}`,
    reached: t.billedUsers > 0,
  }));
}

/** Precio abreviado localizado: 1000 → "10 €" (sin decimales si son 00); 1050 → "10,50 €". */
export function shortPrice(cents: number): string {
  const digits = cents % 100 === 0 ? 0 : 2;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(cents / 100);
}

/** Texto completo para lectores: "Tramo 1: 10,00 EUR por usuario al mes, de 1 a 10 usuarios". */
export function ladderAccessibleText(step: LadderStep): string {
  const range = step.to === null ? `desde ${String(step.from)} usuarios` : `de ${String(step.from)} a ${String(step.to)} usuarios`;
  return `Tramo ${String(step.tier)}: ${formatMoney(step.unitPriceCents, 'EUR')} por usuario al mes, ${range}`;
}
