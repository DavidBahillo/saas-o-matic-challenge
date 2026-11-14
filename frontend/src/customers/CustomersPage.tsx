// Lista de clientes, búsqueda y paginación (RF1 a RF6, RF19 a RF22, RF27): `q` y `page` viven en la URL; borrar y editar
// terminan con un aviso (banner visible + región aria-live).
import type { Customer } from '@saas-o-matic/shared';
import { parsePageParam } from '@saas-o-matic/shared';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useCustomers } from '../api/customers.queries';
import type { DeleteOutcome } from '../api/customers.mutations';
import { SearchBox } from '../layout/SearchBox';
import { useDocumentTitle } from '../layout/use-document-title';
import { simulationsLabel } from '../lib/pluralize';
import { LiveRegion } from '../ui/LiveRegion';
import { CustomerListView } from './CustomerListView';
import { DeleteCustomerDialog } from './DeleteCustomerDialog';
import { customersCountLabel } from './count-label';
import { listUrl, readNotice } from './list-url';

function deletedNotice(name: string, outcome: DeleteOutcome): string {
  if (outcome.alreadyGone) return `El cliente «${name}» ya no existía.`;
  if (outcome.deletedSimulations === 0) return `Cliente «${name}» borrado.`;
  return `Cliente «${name}» borrado junto con ${simulationsLabel(outcome.deletedSimulations)}.`;
}

/** Mantiene la URL en la página efectiva que devuelve el servidor (RF5, RF27), sin añadir entradas al historial. */
function useCanonicalUrl(q: string, effectivePage: number | undefined): void {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (effectivePage === undefined) return;
    const target = listUrl(q, effectivePage);
    if (pathname + search !== target) void navigate(target, { replace: true });
  }, [q, effectivePage, pathname, search, navigate]);
}

/** El aviso ya se copió al estado local: se limpia del historial para que no reaparezca al recargar. */
function useClearNotice(hasNotice: boolean): void {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (hasNotice) void navigate(pathname + search, { replace: true, state: null });
  }, [hasNotice, pathname, search, navigate]);
}

function useNoticeFromState(state: unknown) {
  const initial = readNotice(state);
  useClearNotice(initial !== '');
  return useState(initial);
}

export function CustomersPage() {
  const [params] = useSearchParams();
  const state: unknown = useLocation().state;
  const q = (params.get('q') ?? '').trim();
  const page = parsePageParam(params.get('page'));
  const query = useCustomers(q, page);
  const [target, setTarget] = useState<Customer | undefined>(undefined);
  const [notice, setNotice] = useNoticeFromState(state);
  useCanonicalUrl(q, query.data?.page);
  useDocumentTitle('Clientes');

  const handleDeleted = (outcome: DeleteOutcome) => {
    if (target !== undefined) setNotice(deletedNotice(target.companyName, outcome));
    setTarget(undefined);
  };

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
      {notice !== '' && <p className="notice notice--success">{notice}</p>}
      <LiveRegion message={notice} />
      <CustomerListView query={query} q={q} onDelete={setTarget} />
      {target !== undefined && (
        <DeleteCustomerDialog
          key={target.id}
          customer={target}
          onClose={() => { setTarget(undefined); }}
          onDeleted={handleDeleted}
        />
      )}
    </section>
  );
}
