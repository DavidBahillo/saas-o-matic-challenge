// Vista previa convertida (RF23): solo con USD o GBP, con la función de shared/ y marcada como "Vista previa".
import { convertQuote, parseRateText } from '@saas-o-matic/shared';
import type { Currency, Quote } from '@saas-o-matic/shared';
import { formatMoney } from '../lib/format-money';
import { formatRateShort } from '../lib/format-rate-text';
import { Badge } from '../ui/Badge';

export interface ConvertedPreviewProps {
  quote: Pick<Quote, 'baseCents' | 'vatCents'>;
  currency: Currency;
  /** Tipo en texto de 6 decimales, tal como lo sirve GET /exchange-rates. */
  rateText: string;
}

export function ConvertedPreview({ quote, currency, rateText }: ConvertedPreviewProps) {
  const rate = parseRateText(rateText);
  if (!rate.ok) return null;
  const { convertedBaseCents, convertedVatCents, convertedTotalCents } = convertQuote(quote, rate.micros);
  return (
    <div className="converted" data-testid="converted-preview">
      <Badge tone="info">Vista previa</Badge>
      <dl className="converted__amounts">
        <dt>Base</dt>
        <dd className="money">{formatMoney(convertedBaseCents, currency)}</dd>
        <dt>IVA</dt>
        <dd className="money">{formatMoney(convertedVatCents, currency)}</dd>
        <dt>Total</dt>
        <dd className="money">{formatMoney(convertedTotalCents, currency)}</dd>
      </dl>
      <p className="muted">Tipo {formatRateShort(rateText)}</p>
    </div>
  );
}
