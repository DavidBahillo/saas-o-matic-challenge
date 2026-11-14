// Hoja "Presupuesto" (RF45, RF-importes): chip de divisa, total siempre en EUR, vista previa convertida bajo el total, barra, tabla y pie.
import type { Currency, Quote } from '@saas-o-matic/shared';
import { useId } from 'react';
import type { ReactNode } from 'react';
import { formatMoney } from '../lib/format-money';
import { Badge } from '../ui/Badge';
import { ConvertedPreview } from './ConvertedPreview';
import { QuoteChart } from './QuoteChart';
import { QuoteTable } from './QuoteTable';

export interface BudgetSheetProps {
  quote: Quote;
  currency: Currency;
  /** Tipo de la divisa activa en texto de 6 decimales; undefined si no hay tipos. */
  rateText: string | undefined;
  /** Pie de la hoja: nota de la divisa de guardado y botón "Guardar simulación". */
  footer: ReactNode;
}

const eur = (cents: number): string => formatMoney(cents, 'EUR');

export function BudgetSheet({ quote, currency, rateText, footer }: BudgetSheetProps) {
  const titleId = useId();
  return (
    <section className="sheet" aria-labelledby={titleId}>
      <div className="sheet__head">
        <h3 id={titleId}>Presupuesto</h3>
        <Badge translate="no">{currency}</Badge>
      </div>
      <div className="sheet__total-box">
        <p className="sheet__total money" data-testid="total">{eur(quote.totalCents)}</p>
      </div>
      {currency !== 'EUR' && rateText !== undefined && (
        <ConvertedPreview quote={quote} currency={currency} rateText={rateText} />
      )}
      <QuoteChart quote={quote} />
      <QuoteTable quote={quote} label="Desglose por tramos" />
      {footer}
    </section>
  );
}
