// Cuerpo de la lista de clientes (RF1, RF2, RF6, RF27): carga, error con reintento, vacío, tabla y paginación.
import type { Customer } from '@saas-o-matic/shared';
import { Link, useNavigate } from 'react-router';
import type { useCustomers } from '../api/customers.queries';
import { generalMessage } from '../api/errors';
import { Button } from '../ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../ui/States';
import { CustomerRow } from './CustomerRow';
import { Pagination } from './Pagination';

const COLUMNS = ['Empresa', 'País', 'NIF', 'Plan', 'Simulaciones', 'Alta', 'Acciones'] as const;

function NoCustomers({ q }: { q: string }) {
  const navigate = useNavigate();
  return (
    <EmptyState
      title={q === '' ? 'Todavía no hay clientes.' : `Sin resultados para «${q}»`}
      action={
        q === '' ? (
          <Link to="/customers/new" className="btn btn--primary btn--md">
            Dar de alta un cliente
          </Link>
        ) : (
          <Button onClick={() => void navigate('/')}>Borrar búsqueda</Button>
        )
      }
    />
  );
}

export interface CustomerListViewProps {
  query: ReturnType<typeof useCustomers>;
  q: string;
  onDelete: (customer: Customer) => void;
}

export function CustomerListView({ query, q, onDelete }: CustomerListViewProps) {
  if (query.isPending) return <Skeleton lines={3} label="Cargando clientes…" />;
  if (query.isError) return <ErrorState message={generalMessage(query.error)} onRetry={() => void query.refetch()} />;
  const { items, total, page, pageSize } = query.data;
  if (items.length === 0) return <NoCustomers q={q} />;
  return (
    <>
      <table role="table" aria-label="Clientes" className="customer-list">
        <thead role="rowgroup">
          <tr role="row" className="customer-list__head">
            {COLUMNS.map((name) => (
              <th key={name} role="columnheader" scope="col">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {items.map((customer) => (
            <CustomerRow key={customer.id} customer={customer} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
      <Pagination q={q} page={page} pageSize={pageSize} total={total} />
    </>
  );
}
