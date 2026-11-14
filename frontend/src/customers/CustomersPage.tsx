// Lista de clientes y búsqueda (RF19, RF20): la búsqueda vive en la URL (?q=) y en la cabecera de la lista.
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useCustomers } from '../api/customers.queries';
import { generalMessage } from '../api/errors';
import { SearchBox } from '../layout/SearchBox';
import { useDocumentTitle } from '../layout/use-document-title';
import { Button } from '../ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../ui/States';
import { CustomerRow } from './CustomerRow';
import { customersCountLabel } from './count-label';

const COLUMNS = ['Empresa', 'País y NIF', 'Plan', 'Simulaciones', 'Alta', 'Acciones'] as const;

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

type CustomersQuery = ReturnType<typeof useCustomers>;

function CustomerList({ query, q }: { query: CustomersQuery; q: string }) {
  if (query.isPending) return <Skeleton lines={3} label="Cargando clientes…" />;
  if (query.isError) return <ErrorState message={generalMessage(query.error)} onRetry={() => void query.refetch()} />;
  const { items, total } = query.data;
  if (items.length === 0) return <NoCustomers q={q} />;
  return (
    <>
      {total > items.length && <p className="muted">{`Mostrando ${String(items.length)} de ${String(total)}`}</p>}
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
            <CustomerRow key={customer.id} customer={customer} />
          ))}
        </tbody>
      </table>
    </>
  );
}

export function CustomersPage() {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const query = useCustomers(q);
  useDocumentTitle('Clientes');
  return (
    <section className="page">
      <div className="list-head">
        <h1>Clientes</h1>
        {query.data !== undefined && <span className="muted list-head__count">{customersCountLabel(query.data.total)}</span>}
        <div className="list-head__tools">
          <SearchBox />
          <Link to="/customers/new" className="btn btn--primary btn--md">
            Nuevo cliente
          </Link>
        </div>
      </div>
      <CustomerList query={query} q={q} />
    </section>
  );
}
