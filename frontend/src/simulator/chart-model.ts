// Modelo de la barra apilada (RF21, RF40): todo con enteros, sin coma flotante.
import type { Currency, Quote } from '@saas-o-matic/shared';
import { formatMoney } from '../lib/format-money';

export interface ChartSegment {
  key: 'tier1' | 'tier2' | 'tier3' | 'vat';
  label: string;
  cents: number;
  /** Menos del 12 % del ancho de la barra: la etiqueta va bajo la barra. */
  labelOutside: boolean;
}

export interface ChartModel {
  segments: ChartSegment[];
  title: string;
  subtitle: string | undefined;
}

type ChartQuote = Pick<Quote, 'tiers' | 'baseCents' | 'vatCents' | 'totalCents'>;

/** Porcentaje entero de `part` sobre `whole`, half-up y solo con enteros: ⌊(200·part + whole) / (2·whole)⌋. */
export function halfUpPercent(part: number, whole: number): number {
  if (whole === 0) return 0;
  return Math.floor((200 * part + whole) / (2 * whole));
}

const TIER_KEYS = { 1: 'tier1', 2: 'tier2', 3: 'tier3' } as const;

function buildSegments(quote: ChartQuote, currency: Currency): ChartSegment[] {
  const total = quote.baseCents + quote.vatCents;
  const raw = [
    ...quote.tiers.map((t) => ({ key: TIER_KEYS[t.tier], name: `Tramo ${String(t.tier)}`, cents: t.subtotalCents })),
    { key: 'vat' as const, name: 'IVA', cents: quote.vatCents },
  ];
  return raw
    .filter((s) => s.cents > 0)
    .map((s) => ({
      key: s.key,
      label: `${s.name} · ${formatMoney(s.cents, currency)}`,
      cents: s.cents,
      labelOutside: s.cents * 100 < 12 * total,
    }));
}

function buildSubtitle(quote: ChartQuote, currency: Currency): string {
  if (quote.baseCents === 0) return 'Sin usuarios: no hay coste que desglosar';
  const heaviest = quote.tiers.reduce((best, t) => (t.subtotalCents > best.subtotalCents ? t : best));
  const percent = halfUpPercent(heaviest.subtotalCents, quote.baseCents);
  return `Coste mensual: ${formatMoney(quote.baseCents, currency)} · el ${String(percent)} % sale del tramo ${String(heaviest.tier)}`;
}

export function buildChartModel(quote: ChartQuote, currency: Currency): ChartModel {
  return {
    segments: buildSegments(quote, currency),
    title: 'Desglose del coste mensual',
    subtitle: buildSubtitle(quote, currency),
  };
}
