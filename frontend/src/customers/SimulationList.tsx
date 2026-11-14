// Simulaciones guardadas del cliente (RF30, RF57): tabla semántica con filas de 48 px expandibles, la más reciente primero,
// cada una en su divisa. Cada fila lleva un botón con aria-expanded y aria-controls que muestra su detalle en una fila oculta.
import type { Simulation } from '@saas-o-matic/shared';
import { useState } from 'react';
import { formatDateTime } from '../lib/format-date';
import { formatMoney } from '../lib/format-money';
import { usersLabel } from '../lib/pluralize';
import { Badge } from '../ui/Badge';
import { ChevronIcon } from '../ui/icons';
import { SavedQuote } from './SavedQuote';

/** createdAt DESC y, en empate, id DESC (RF16). */
function newestFirst(items: readonly Simulation[]): Simulation[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
}

interface RowProps {
  sim: Simulation;
  open: boolean;
  onToggle: () => void;
}

function SimulationRow({ sim, open, onToggle }: RowProps) {
  const detailId = `simulation-detail-${String(sim.id)}`;
  return (
    <tbody role="rowgroup">
      <tr role="row" className="sim-row">
        <td role="cell" className="sim-row__cell">{usersLabel(sim.users)}</td>
        <td role="cell" className="sim-row__cell money">{formatMoney(sim.convertedTotalCents, sim.currency)}</td>
        <td role="cell" className="sim-row__cell muted">{formatDateTime(sim.createdAt)}</td>
        <td role="cell" className="sim-row__cell">
          <Badge translate="no">{sim.currency}</Badge>
        </td>
        <td role="cell" className="sim-row__toggle">
          <button
            type="button"
            className="sim-row__button"
            aria-expanded={open}
            aria-controls={detailId}
            aria-label={`Desglose de la simulación del ${formatDateTime(sim.createdAt)}`}
            onClick={onToggle}
          >
            <ChevronIcon className="sim-row__chevron" size={16} />
          </button>
        </td>
      </tr>
      <tr role="row" id={detailId} className="sim-detail" hidden={!open}>
        <td role="cell" colSpan={5}>
          <SavedQuote simulation={sim} testId="simulation-quote" />
        </td>
      </tr>
    </tbody>
  );
}

export function SimulationList({ items }: { items: readonly Simulation[] }) {
  const [openIds, setOpenIds] = useState<ReadonlySet<number>>(new Set());
  const toggle = (id: number): void => {
    setOpenIds((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  };
  return (
    <table role="table" className="sim-table" aria-label="Simulaciones guardadas" data-testid="simulation-list">
      <thead role="rowgroup">
        <tr role="row" className="sim-row sim-row--head" data-testid="simulation-head">
          <th role="columnheader" scope="col">Usuarios</th>
          <th role="columnheader" scope="col">Total</th>
          <th role="columnheader" scope="col">Fecha</th>
          <th role="columnheader" scope="col">Divisa</th>
          <th role="columnheader" scope="col"><span className="sr-only">Detalle</span></th>
        </tr>
      </thead>
      {newestFirst(items).map((sim) => (
        <SimulationRow key={sim.id} sim={sim} open={openIds.has(sim.id)} onToggle={() => { toggle(sim.id); }} />
      ))}
    </table>
  );
}
