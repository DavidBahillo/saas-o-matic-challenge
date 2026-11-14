// Modelo de la barra apilada (RF-barra, RF41): sin importes; texto en tres niveles; todo con enteros.
import type { Quote } from '@saas-o-matic/shared';
import { textWidthPx } from './text-fit';

export type SegmentDisplay = 'full' | 'short' | 'none';

export interface ChartSegment {
  key: 'tier1' | 'tier2' | 'tier3' | 'vat';
  cents: number;
  /** Nombre completo accesible y del tooltip: "Tramo 1", "IVA 21 %". */
  name: string;
  /** Texto con el nombre completo (igual que `name`, sin importes). */
  fullText: string;
  /** Abreviatura: "T1", "21 %". */
  shortText: string;
  /** Qué texto cabe dentro del segmento (estimación de `labelFits`): el nombre, la abreviatura o nada. */
  display: SegmentDisplay;
}

export interface ChartModel {
  segments: ChartSegment[];
  title: string;
}

type ChartQuote = Pick<Quote, 'tiers' | 'baseCents' | 'vatCents' | 'totalCents' | 'vatRatePercent'>;

/** Ancho de barra supuesto cuando aún no se ha medido (jsdom, primer pintado). */
export const DEFAULT_BAR_WIDTH_PX = 480;
const FONT_TENTHS_PX = 120; // caption de 12 px en Fira Code
const SEGMENT_PADDING_PX = 16; // var(--space-sm) a cada lado

/** Estimación entera: ¿cabe `label` en el segmento que ocupa `cents/totalCents` de una barra de `barWidthPx`? */
export function labelFits(label: string, cents: number, totalCents: number, barWidthPx: number): boolean {
  const needed = textWidthPx(label.length, FONT_TENTHS_PX) + SEGMENT_PADDING_PX;
  return cents * barWidthPx >= needed * totalCents;
}

const NBSP = String.fromCharCode(0xa0);
const TIER_KEYS = { 1: 'tier1', 2: 'tier2', 3: 'tier3' } as const;

function displayFor(name: string, short: string, cents: number, total: number, width: number): SegmentDisplay {
  if (labelFits(name, cents, total, width)) return 'full';
  return labelFits(short, cents, total, width) ? 'short' : 'none';
}

function buildSegments(quote: ChartQuote, barWidthPx: number): ChartSegment[] {
  const total = quote.baseCents + quote.vatCents;
  const vatRate = String(quote.vatRatePercent);
  const raw = [
    ...quote.tiers.map((t) => ({ key: TIER_KEYS[t.tier], name: `Tramo${NBSP}${String(t.tier)}`, short: `T${String(t.tier)}`, cents: t.subtotalCents })),
    { key: 'vat' as const, name: `IVA${NBSP}${vatRate}${NBSP}%`, short: `${vatRate}${NBSP}%`, cents: quote.vatCents },
  ];
  return raw
    .filter((s) => s.cents > 0)
    .map((s) => ({
      key: s.key,
      cents: s.cents,
      name: s.name,
      fullText: s.name,
      shortText: s.short,
      display: displayFor(s.name, s.short, s.cents, total, barWidthPx),
    }));
}

export function buildChartModel(quote: ChartQuote, barWidthPx = DEFAULT_BAR_WIDTH_PX): ChartModel {
  return {
    segments: buildSegments(quote, barWidthPx),
    title: 'Desglose del coste mensual',
  };
}
