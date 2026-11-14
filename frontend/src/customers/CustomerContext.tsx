// Línea de contexto del detalle (RF21): nombre, país y NIF, correo, plan, antigüedad y botón de presentación.
import type { Customer } from '@saas-o-matic/shared';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CountryFlag } from '../ui/CountryFlag';
import { formatDateOnly } from './format-since';

interface Props {
  customer: Customer;
  /** En presentación solo queda el título, oculto a la vista (RF30). */
  presentation: boolean;
  onPresent: () => void;
}

export function CustomerContext({ customer, presentation, onPresent }: Props) {
  if (presentation) return <h1 className="sr-only">{customer.companyName}</h1>;
  return (
    <section className="customer-context" aria-label="Datos del cliente">
      <h1>{customer.companyName}</h1>
      <div className="customer-context__meta">
        <span className="customer-context__id">
          <CountryFlag code={customer.country} /> <span className="tabular" translate="no">{customer.taxId}</span>
        </span>
        <span translate="no">{customer.email}</span>
        <Badge translate="no">{customer.plan}</Badge>
        <span>{`Cliente desde ${formatDateOnly(customer.createdAt)}`}</span>
      </div>
      <Button
        className="customer-context__present"
        variant="secondary"
        data-presentation-toggle
        aria-keyshortcuts="Alt+P"
        onClick={onPresent}
      >
        Modo presentación (Alt+P)
      </Button>
    </section>
  );
}
