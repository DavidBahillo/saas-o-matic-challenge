// Fila de la lista de clientes (RF19, RF20, RF55; spec 010 RF7, RF9, RF10): <tr> con roles explícitos (se conservan apilada);
// un solo enlace en el nombre, estirado a toda la fila salvo correo y NIF, que se pueden seleccionar.
// "País", "NIF" y "Alta" son texto real, oculto en escritorio. La celda de simulaciones lleva solo el número.
import type { Customer } from '@saas-o-matic/shared';
import { Link } from 'react-router';
import { CountryFlag } from '../ui/CountryFlag';
import { PlanBadge } from '../ui/PlanBadge';
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
        <span className="customer-row__label">País </span>
        <CountryFlag code={customer.country} />
      </td>
      <td role="cell" className="customer-row__taxid">
        <span className="customer-row__label">NIF </span>
        <span className="tabular" translate="no">{customer.taxId}</span>
      </td>
      <td role="cell" className="customer-row__plan">
        <PlanBadge plan={customer.plan} />
      </td>
      <td role="cell" className="customer-row__sims">{customer.simulationCount}</td>
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
