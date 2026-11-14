// Presupuesto guardado (RF18, RF26): importes tal como los devolvió el backend, siempre en su propia divisa.
import type { Simulation } from '@saas-o-matic/shared';
import { formatDateTime } from '../lib/format-date';
import { formatMoney } from '../lib/format-money';
import { formatRateFull } from '../lib/format-rate-text';
import { QuoteTable } from '../simulator/QuoteTable';

export function SavedQuote({ simulation, testId }: { simulation: Simulation; testId: string }) {
  const { currency } = simulation;
  return (
    <div className="saved-quote" data-testid={testId}>
      <QuoteTable quote={simulation} label={`Desglose de la simulación del ${formatDateTime(simulation.createdAt)}`} />
      <dl className="saved-quote__details">
        <dt>Divisa</dt>
        <dd translate="no">{currency}</dd>
        <dt>Tipo</dt>
        <dd className="money">{formatRateFull(simulation.exchangeRate)}</dd>
        <dt>Fecha del tipo</dt>
        <dd>{formatDateTime(simulation.exchangeRateAt)}</dd>
        <dt>Base convertida</dt>
        <dd className="money">{formatMoney(simulation.convertedBaseCents, currency)}</dd>
        <dt>IVA convertido</dt>
        <dd className="money">{formatMoney(simulation.convertedVatCents, currency)}</dd>
        <dt>Total convertido</dt>
        <dd className="money">{formatMoney(simulation.convertedTotalCents, currency)}</dd>
      </dl>
    </div>
  );
}
