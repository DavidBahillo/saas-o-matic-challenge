// Alta de cliente (RF10 a RF15): al crear, va al detalle y la lista se invalida.
import { useNavigate } from 'react-router';
import { useCreateCustomer } from '../api/customers.mutations';
import { useDocumentTitle } from '../layout/use-document-title';
import { CustomerForm } from './CustomerForm';
import { FormCard } from './FormCard';

export function NewCustomerPage() {
  const navigate = useNavigate();
  const mutation = useCreateCustomer();
  useDocumentTitle('Nuevo cliente');
  return (
    <FormCard title="Nuevo cliente">
      <CustomerForm
        pending={mutation.isPending}
        error={mutation.error}
        onSubmit={(values) => {
          mutation.mutate(values, { onSuccess: (customer) => void navigate(`/customers/${String(customer.id)}`) });
        }}
      />
    </FormCard>
  );
}
