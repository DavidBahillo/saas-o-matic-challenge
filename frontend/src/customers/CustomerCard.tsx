// Tarjeta de cliente (RF4, RF9): toda la tarjeta es un enlace, así se activa con ratón y teclado.
import type { Customer } from '@saas-o-matic/shared';
import { Link } from 'react-router';
import { simulationsLabel } from '../lib/pluralize';
import { CountryFlag } from '../ui/CountryFlag';

export function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <Link to={`/customers/${String(customer.id)}`} className="card customer-card">
      <h2 className="customer-card__name">{customer.companyName}</h2>
      <p className="customer-card__tax">
        <CountryFlag code={customer.country} /> <span className="tabular">{customer.taxId}</span>
      </p>
      <p className="muted">{customer.email}</p>
      <p className="customer-card__meta">
        <span className="chip">{customer.plan}</span>
        <span className="muted">{simulationsLabel(customer.simulationCount)}</span>
      </p>
    </Link>
  );
}
