// Tabla unidades × precio = subtotal por tramo, base, IVA y total (RF21, RF18, RF44, RF52). Siempre los tres tramos.
import type { Quote } from '@saas-o-matic/shared';
import { formatMoney } from '../lib/format-money';
import { useOverflow } from './use-overflow';

type TableQuote = Pick<Quote, 'tiers' | 'baseCents' | 'vatRatePercent' | 'vatCents' | 'totalCents'>;

const NBSP = String.fromCharCode(0xa0);
const units = new Intl.NumberFormat('es-ES', { useGrouping: 'always' });
const money = (cents: number): string => formatMoney(cents, 'EUR');

function tierName(tier: number, from: number, to: number | null): string {
  const range = to === null ? `${String(from)}${NBSP}o${NBSP}más` : `${String(from)}–${String(to)}`;
  return `Tramo${NBSP}${String(tier)} (${range})`;
}

interface SummaryProps {
  row: 'base' | 'vat' | 'total';
  label: string;
  cents: number;
}

/** Etiqueta en "Concepto", una celda vacía que abarca Unidades y Precio, e importe en Subtotal. */
function SummaryRow({ row, label, cents }: SummaryProps) {
  return (
    <tr data-row={row}>
      <th scope="row">{label}</th>
      <td colSpan={2} />
      <td className="money">{money(cents)}</td>
    </tr>
  );
}

/** `label` da nombre único a la región; solo es enfocable si el contenido desborda de verdad. */
export function QuoteTable({ quote, label }: { quote: TableQuote; label: string }) {
  const { ref, overflows } = useOverflow<HTMLDivElement>();
  return (
    <div className="quote-table-wrap" role="region" aria-label={label} tabIndex={overflows ? 0 : undefined} ref={ref}>
      <table className="quote-table">
        <thead>
          <tr>
            <th scope="col">Concepto</th>
            <th scope="col">Unidades</th>
            <th scope="col">Precio</th>
            <th scope="col">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {quote.tiers.map((t) => (
            <tr key={t.tier} data-row="tier">
              <th scope="row">{tierName(t.tier, t.from, t.to)}</th>
              <td className="money">{units.format(t.billedUsers)}</td>
              <td className="money">{money(t.unitPriceCents)}</td>
              <td className="money">{money(t.subtotalCents)}</td>
            </tr>
          ))}
          <SummaryRow row="base" label="Base" cents={quote.baseCents} />
          <SummaryRow row="vat" label={`IVA (${String(quote.vatRatePercent)}${NBSP}%)`} cents={quote.vatCents} />
          <SummaryRow row="total" label="Total" cents={quote.totalCents} />
        </tbody>
      </table>
    </div>
  );
}
