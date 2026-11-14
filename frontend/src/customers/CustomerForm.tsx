// Formulario de alta (RF10 a RF14): valores tal cual, un solo envío a la vez y errores junto a su control.
import { PLANS } from '@saas-o-matic/shared';
import { useEffect, useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link } from 'react-router';
import type { NewCustomerValues } from '../api/customers.mutations';
import { useSubmitLock } from '../lib/use-submit-lock';
import { Button } from '../ui/Button';
import { CustomerFields } from './CustomerFields';
import { describeSubmitError } from './customer-form-errors';
import type { SubmitErrorView } from './customer-form-errors';

const INITIAL: NewCustomerValues = { companyName: '', country: '', taxId: '', email: '', plan: PLANS[0] };

export interface CustomerFormProps {
  pending: boolean;
  error: unknown;
  onSubmit: (values: NewCustomerValues) => void;
}

function Notice({ view, onRetry }: { view: SubmitErrorView; onRetry: () => void }) {
  if (view.general.length === 0) return null;
  return (
    <div className="state state--error" role="alert">
      {view.general.map((message) => (
        <p key={message}>{message}</p>
      ))}
      {view.existingId !== undefined && <Link to={`/customers/${String(view.existingId)}`}>Ver el cliente existente</Link>}
      {view.retryable && <Button onClick={onRetry}>Reintentar</Button>}
    </div>
  );
}

export function CustomerForm({ pending, error, onSubmit }: CustomerFormProps) {
  const [values, setValues] = useState<NewCustomerValues>(INITIAL);
  const formRef = useRef<HTMLFormElement>(null);
  const guard = useSubmitLock(pending, undefined, error);
  const view = error === null || error === undefined ? undefined : describeSubmitError(error);

  // Con errores de campo, el foco va al primer control marcado (RF12).
  useEffect(() => {
    if (error !== null && error !== undefined) {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [error]);

  const submit = () => { guard(() => { onSubmit(values); }); };
  const handleSubmit = (event: SyntheticEvent) => {
    event.preventDefault();
    submit();
  };

  return (
    <form ref={formRef} className="form" noValidate onSubmit={handleSubmit}>
      {view !== undefined && <Notice view={view} onRetry={submit} />}
      <CustomerFields
        values={values}
        errors={view?.byControl ?? {}}
        onChange={(key, value) => { setValues((current) => ({ ...current, [key]: value })); }}
      />
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? 'Creando…' : 'Crear cliente'}
      </Button>
    </form>
  );
}
