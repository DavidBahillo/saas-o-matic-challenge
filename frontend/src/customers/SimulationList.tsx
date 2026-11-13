// Simulaciones guardadas del cliente (RF16, RF18): la más reciente primero, cada una en su propia divisa.
import type { Simulation } from '@saas-o-matic/shared';
import { formatDateTime } from '../lib/format-date';
import { formatMoney } from '../lib/format-money';
import { SavedQuote } from './SavedQuote';

/** createdAt DESC y, en empate, id DESC (RF16). */
function newestFirst(items: readonly Simulation[]): Simulation[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
}

export function SimulationList({ items }: { items: readonly Simulation[] }) {
  return (
    <ul className="simulation-list" data-testid="simulation-list">
      {newestFirst(items).map((sim) => (
        <li key={sim.id}>
          <details>
            <summary>
              <span>{sim.users === 1 ? '1 usuario' : `${String(sim.users)} usuarios`}</span>
              <span className="money">{formatMoney(sim.convertedTotalCents, sim.currency)}</span>
              <span className="muted">{formatDateTime(sim.createdAt)}</span>
            </summary>
            <SavedQuote simulation={sim} testId="simulation-quote" />
          </details>
        </li>
      ))}
    </ul>
  );
}
