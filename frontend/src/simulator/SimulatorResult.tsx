// Resultado de la vista previa (RF19, RF21, RF23): total, conversión, gráfico y tabla.
import type { Currency, Quote } from '@saas-o-matic/shared';
import { formatMoney } from '../lib/format-money';
import { ConvertedPreview } from './ConvertedPreview';
import { QuoteChart } from './QuoteChart';
import { QuoteTable } from './QuoteTable';

export interface SimulatorResultProps {
  quote: Quote;
  currency: Currency;
  /** Tipo de la divisa activa en texto de 6 decimales; undefined si no hay tipos. */
  rateText: string | undefined;
}

export function SimulatorResult({ quote, currency, rateText }: SimulatorResultProps) {
  return (
    <div className="simulator__result">
      <p className="muted">Total mensual (IVA incluido)</p>
      <p className="total money" data-testid="total">
        {formatMoney(quote.totalCents, 'EUR')}
      </p>
      {currency !== 'EUR' && rateText !== undefined && (
        <ConvertedPreview quote={quote} currency={currency} rateText={rateText} />
      )}
      <QuoteChart quote={quote} />
      <QuoteTable quote={quote} />
    </div>
  );
}
