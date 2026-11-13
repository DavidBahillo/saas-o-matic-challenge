// Alta de cliente (RF10 a RF15): al crear, va al detalle y la lista se invalida.
import { useNavigate } from 'react-router';
import { useCreateCustomer } from '../api/customers.mutations';
import { CustomerForm } from './CustomerForm';

export function NewCustomerPage() {
  const navigate = useNavigate();
  const mutation = useCreateCustomer();
  return (
    <section className="page page--narrow">
      <h1>Nuevo cliente</h1>
      <CustomerForm
        pending={mutation.isPending}
        error={mutation.error}
        onSubmit={(values) => {
          mutation.mutate(values, { onSuccess: (customer) => void navigate(`/customers/${String(customer.id)}`) });
        }}
      />
    </section>
  );
}
