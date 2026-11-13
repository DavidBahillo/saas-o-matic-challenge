// Lista de clientes y búsqueda (RF4 a RF8): la búsqueda vive en la URL (?q=).
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useCustomers } from '../api/customers.queries';
import { generalMessage } from '../api/errors';
import { Button } from '../ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../ui/States';
import { CustomerCard } from './CustomerCard';

function NoCustomers({ q }: { q: string }) {
  const navigate = useNavigate();
  return (
    <EmptyState
      title={q === '' ? 'Todavía no hay clientes.' : `Sin resultados para «${q}»`}
      action={
        q === '' ? (
          <Link to="/customers/new" className="btn btn--primary">
            Dar de alta un cliente
          </Link>
        ) : (
          <Button onClick={() => void navigate('/')}>Borrar búsqueda</Button>
        )
      }
    />
  );
}

function CustomerList({ q }: { q: string }) {
  const query = useCustomers(q);
  if (query.isPending) return <Skeleton lines={3} label="Cargando clientes…" />;
  if (query.isError) return <ErrorState message={generalMessage(query.error)} onRetry={() => void query.refetch()} />;
  const { items, total } = query.data;
  if (items.length === 0) return <NoCustomers q={q} />;
  return (
    <>
      {total > items.length && <p className="muted">{`Mostrando ${String(items.length)} de ${String(total)}`}</p>}
      <div className="grid">
        {items.map((customer) => (
          <CustomerCard key={customer.id} customer={customer} />
        ))}
      </div>
    </>
  );
}

export function CustomersPage() {
  const [params] = useSearchParams();
  return (
    <section className="page">
      <div className="page__head">
        <h1>Clientes</h1>
        <Link to="/customers/new" className="btn btn--primary">
          Nuevo cliente
        </Link>
      </div>
      <CustomerList q={(params.get('q') ?? '').trim()} />
    </section>
  );
}
