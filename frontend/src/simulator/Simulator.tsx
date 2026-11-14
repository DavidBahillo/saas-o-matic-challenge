// Simulador (RF19 a RF29): configuración de usuarios y hoja de presupuesto; vista previa al instante con shared/.
import { MAX_USERS, RESOURCE_MAX, calculateQuote } from '@saas-o-matic/shared';
import type { Customer, Quote } from '@saas-o-matic/shared';
import { useMemo } from 'react';
import { Link } from 'react-router';
import type { SimulationErrorView } from './simulator-errors';
import type { CountField } from './use-count-field';
import { useCurrency } from '../state/currency-context';
import { BudgetSheet } from './BudgetSheet';
import { ResourceFields } from './ResourceFields';
import { SaveFeedback, SaveFooter } from './SaveSection';
import { UsersControl } from './UsersControl';
import { useCountField } from './use-count-field';
import { useSimulatorSave } from './use-simulator-save';

const DEFAULT_USERS = 10;

interface ConfigProps {
  users: CountField;
  storage: CountField;
  apiCalls: CountField;
  errors: SimulationErrorView['byControl'] | undefined;
  tiers: Quote['tiers'] | undefined;
  presentation: boolean;
}

function Config({ users, storage, apiCalls, errors, tiers, presentation }: ConfigProps) {
  return (
    <div className="workspace__config">
      <UsersControl field={users} serverErrors={errors?.users ?? []} tiers={tiers} presentation={presentation} />
      {!presentation && (
        <ResourceFields
          storage={storage}
          apiCalls={apiCalls}
          storageErrors={errors?.storage ?? []}
          apiCallsErrors={errors?.apiCalls ?? []}
        />
      )}
    </div>
  );
}

/** RF53: el mensaje lleva el siguiente paso y un enlace para salir. */
function PriceUnavailable() {
  return (
    <div className="state state--error" role="alert">
      <p>No se puede calcular el precio de este cliente. Revisa su país o vuelve a la lista.</p>
      <Link to="/">Volver a la lista</Link>
    </div>
  );
}

export function Simulator({ customer, presentation = false }: { customer: Customer; presentation?: boolean }) {
  const { currency, rates } = useCurrency();
  const users = useCountField(DEFAULT_USERS, MAX_USERS);
  const storage = useCountField(0, RESOURCE_MAX);
  const apiCalls = useCountField(0, RESOURCE_MAX);
  const state = useSimulatorSave(customer.id, { users: users.value, storage: storage.value, apiCalls: apiCalls.value });
  const result = useMemo(
    () => calculateQuote({ users: users.value, country: customer.country }),
    [users.value, customer.country],
  );
  const blocked = !result.ok || [users, storage, apiCalls].some((f) => f.error !== undefined);
  const footer = <SaveFooter currency={currency} blocked={blocked} state={state} />;

  return (
    <section className={presentation ? 'workspace workspace--presentation' : 'workspace'} aria-label="Simulador">
      <Config
        users={users}
        storage={storage}
        apiCalls={apiCalls}
        errors={state.view?.byControl}
        tiers={result.ok ? result.value.tiers : undefined}
        presentation={presentation}
      />
      <div className="workspace__result">
        {result.ok ? (
          <BudgetSheet
            quote={result.value}
            currency={currency}
            rateText={rates.find((r) => r.currency === currency)?.exchangeRate}
            footer={footer}
          />
        ) : (
          <PriceUnavailable />
        )}
        <SaveFeedback state={state} />
      </div>
    </section>
  );
}
