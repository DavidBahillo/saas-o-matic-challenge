// Edición de cliente (RF7 a RF12, RF14, RF16, RF18, RF30): reutiliza CustomerForm con los datos del servidor ya cargados
// (también por URL directa o recarga). Al guardar vuelve a la búsqueda y página de origen con un aviso.
import type { Customer } from '@saas-o-matic/shared';
import { useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { useUpdateCustomer } from '../api/customers.mutations';
import type { NewCustomerValues } from '../api/customers.mutations';
import { useCustomerForEdit } from '../api/customers.queries';
import { generalMessage, isNotFoundError } from '../api/errors';
import { useDocumentTitle } from '../layout/use-document-title';
import { ErrorState, Skeleton } from '../ui/States';
import { CustomerForm } from './CustomerForm';
import { FormCard } from './FormCard';
import { safeFrom } from './list-url';

function toValues(customer: Customer): NewCustomerValues {
  const { companyName, country, taxId, email, plan } = customer;
  return { companyName, country, taxId, email, plan };
}

function NotFound() {
  return (
    <FormCard title="Cliente no encontrado">
      <Link to="/" className="btn btn--primary">
        Volver a la lista
      </Link>
    </FormCard>
  );
}

function EditForm({ id, customer, from }: { id: string; customer: Customer; from: string }) {
  const navigate = useNavigate();
  const mutation = useUpdateCustomer(id);
  return (
    <FormCard title="Editar cliente">
      <CustomerForm
        key={id}
        initialValues={toValues(customer)}
        cancelTo={from}
        pending={mutation.isPending}
        error={mutation.error}
        onSubmit={(values) => {
          mutation.mutate(values, {
            onSuccess: (saved) => {
              void navigate(from, { state: { notice: `Cliente «${saved.companyName}» actualizado.` } });
            },
          });
        }}
      />
    </FormCard>
  );
}

function EditLoader({ id }: { id: string }) {
  const state: unknown = useLocation().state;
  const query = useCustomerForEdit(id);
  // Latch (RF8): el formulario se monta con datos del servidor y no se desmonta en refetches posteriores.
  const loaded = useRef<Customer | undefined>(undefined);
  if (loaded.current === undefined && query.isFetchedAfterMount && query.data !== undefined) loaded.current = query.data;
  useDocumentTitle('Editar cliente');
  if (loaded.current !== undefined) return <EditForm id={id} customer={loaded.current} from={safeFrom(state)} />;
  if (query.isError) {
    if (isNotFoundError(query.error)) return <NotFound />;
    return (
      <FormCard title="Editar cliente">
        <ErrorState message={generalMessage(query.error)} onRetry={() => void query.refetch()} />
      </FormCard>
    );
  }
  return (
    <FormCard title="Editar cliente">
      <Skeleton lines={3} label="Cargando cliente…" />
    </FormCard>
  );
}

export function EditCustomerPage() {
  const { id = '' } = useParams();
  return <EditLoader key={id} id={id} />;
}
