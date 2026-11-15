// Línea de contexto del detalle (RF21; spec 010 RF14 a RF17): nombre con su plan, datos con icono y botón "Presentar" con tooltip.
import type { Customer } from '@saas-o-matic/shared';
import { Button } from '../ui/Button';
import { CountryFlag } from '../ui/CountryFlag';
import { PlanBadge } from '../ui/PlanBadge';
import { Tooltip } from '../ui/Tooltip';
import { CalendarIcon, GlobeIcon, IdCardIcon, MailIcon } from '../ui/icons';
import { formatDateOnly } from './format-since';

interface Props {
  customer: Customer;
  /** En presentación solo queda el título, oculto a la vista (RF30). */
  presentation: boolean;
  onPresent: () => void;
}

function Meta({ customer }: { customer: Customer }) {
  return (
    <div className="customer-context__meta">
      <span className="customer-context__item">
        <GlobeIcon size={16} />
        <CountryFlag code={customer.country} />
      </span>
      <span className="customer-context__item">
        <IdCardIcon size={16} />
        <span className="tabular" translate="no">{customer.taxId}</span>
      </span>
      <span className="customer-context__item">
        <MailIcon size={16} />
        <span translate="no">{customer.email}</span>
      </span>
      <span className="customer-context__item">
        <CalendarIcon size={16} />
        <span>{`Cliente desde ${formatDateOnly(customer.createdAt)}`}</span>
      </span>
    </div>
  );
}

export function CustomerContext({ customer, presentation, onPresent }: Props) {
  if (presentation) return <h1 className="sr-only">{customer.companyName}</h1>;
  return (
    <section className="customer-context" aria-label="Datos del cliente">
      <div className="customer-context__name">
        <h1>{customer.companyName}</h1>
        <PlanBadge plan={customer.plan} />
      </div>
      <Meta customer={customer} />
      <Tooltip text="Alt+P" className="customer-context__present">
        <Button variant="secondary" data-presentation-toggle aria-keyshortcuts="Alt+P" onClick={onPresent}>
          Presentar
        </Button>
      </Tooltip>
    </section>
  );
}
