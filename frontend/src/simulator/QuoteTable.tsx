// Tabla unidades × precio = subtotal por tramo, base, IVA y total (RF21, RF18). Siempre los tres tramos.
import type { Quote } from "@saas-o-matic/shared";
import { formatMoney } from "../lib/format-money";

type TableQuote = Pick<
  Quote,
  "tiers" | "baseCents" | "vatRatePercent" | "vatCents" | "totalCents"
>;

const money = (cents: number): string => formatMoney(cents, "EUR");

function tierName(tier: number, from: number, to: number | null): string {
  const range =
    to === null ? `${String(from)} o más` : `${String(from)}–${String(to)}`;
  return `Tramo ${String(tier)} (${range})`;
}

function SummaryRow({
  row,
  label,
  cents,
}: {
  row: "base" | "vat" | "total";
  label: string;
  cents: number;
}) {
  return (
    <tr data-row={row}>
      <th scope="row" colSpan={3}>
        {label}
      </th>
      <td className="money">{money(cents)}</td>
    </tr>
  );
}

export function QuoteTable({ quote }: { quote: TableQuote }) {
  return (
    <div className="quote-table-wrap">
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
              <td className="money">{t.billedUsers}</td>
              <td className="money">{money(t.unitPriceCents)}</td>
              <td className="money">{money(t.subtotalCents)}</td>
            </tr>
          ))}
          <SummaryRow row="base" label="Base" cents={quote.baseCents} />
          <SummaryRow
            row="vat"
            label={`IVA (${String(quote.vatRatePercent)} %)`}
            cents={quote.vatCents}
          />
          <SummaryRow row="total" label="Total" cents={quote.totalCents} />
        </tbody>
      </table>
    </div>
  );
}
