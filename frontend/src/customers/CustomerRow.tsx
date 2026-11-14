// Fila de la lista de clientes (RF19, RF20, RF55): <tr> con roles explícitos (se conservan apilada); un solo enlace en el nombre,
// estirado a toda la fila salvo correo y NIF, que se pueden seleccionar. "Alta" es texto real, oculto en escritorio.
import type { Customer } from '@saas-o-matic/shared';
import { Link } from 'react-router';
import { simulationsLabel } from '../lib/pluralize';
import { Badge } from '../ui/Badge';
import { CountryFlag } from '../ui/CountryFlag';
import { RowActions } from './RowActions';
import { formatDateOnly } from './format-since';

export function CustomerRow({ customer, onDelete }: { customer: Customer; onDelete: (customer: Customer) => void }) {
  return (
    <tr role="row" className="customer-row">
      <td role="cell" className="customer-row__company">
        <Link to={`/customers/${String(customer.id)}`} className="customer-row__link">
          {customer.companyName}
        </Link>
        <span className="muted" translate="no">{customer.email}</span>
      </td>
      <td role="cell" className="customer-row__country">
        <CountryFlag code={customer.country} />
        <span className="tabular" translate="no">{customer.taxId}</span>
      </td>
      <td role="cell" className="customer-row__plan">
        <Badge translate="no">{customer.plan}</Badge>
      </td>
      <td role="cell" className="customer-row__sims">
        {simulationsLabel(customer.simulationCount)}
      </td>
      <td role="cell" className="customer-row__since muted">
        <span className="customer-row__since-label">Alta </span>
        <time dateTime={customer.createdAt}>{formatDateOnly(customer.createdAt)}</time>
      </td>
      <td role="cell" className="customer-row__actions">
        <RowActions customer={customer} onDelete={onDelete} />
      </td>
    </tr>
  );
}
