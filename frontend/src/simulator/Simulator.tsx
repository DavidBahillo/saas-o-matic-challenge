// Simulador (RF19 a RF27): vista previa al instante con shared/, y guardado con POST /simulations.
import { MAX_USERS, RESOURCE_MAX, calculateQuote } from '@saas-o-matic/shared';
import type { Customer } from '@saas-o-matic/shared';
import { useMemo } from 'react';
import { useCurrency } from '../state/currency-context';
import { ResourceFields } from './ResourceFields';
import { SaveSection } from './SaveSection';
import { SimulatorResult } from './SimulatorResult';
import { UsersControl } from './UsersControl';
import { useCountField } from './use-count-field';
import type { CountField } from './use-count-field';
import type { SimulationErrorView } from './simulator-errors';
import { useSimulatorSave } from './use-simulator-save';

const DEFAULT_USERS = 10;

interface ControlsProps {
  users: CountField;
  storage: CountField;
  apiCalls: CountField;
  errors: SimulationErrorView['byControl'] | undefined;
}

function Controls({ users, storage, apiCalls, errors }: ControlsProps) {
  return (
    <div className="simulator__controls">
      <UsersControl field={users} serverErrors={errors?.users ?? []} />
      <ResourceFields
        storage={storage}
        apiCalls={apiCalls}
        storageErrors={errors?.storage ?? []}
        apiCallsErrors={errors?.apiCalls ?? []}
      />
    </div>
  );
}

export function Simulator({ customer }: { customer: Customer }) {
  const { currency, rates } = useCurrency();
  const users = useCountField(DEFAULT_USERS, MAX_USERS);
  const storage = useCountField(0, RESOURCE_MAX);
  const apiCalls = useCountField(0, RESOURCE_MAX);
  const state = useSimulatorSave(customer.id, { users: users.value, storage: storage.value, apiCalls: apiCalls.value });
  const result = useMemo(
    () => calculateQuote({ users: users.value, country: customer.country }),
    [users.value, customer.country],
  );

  return (
    <section className="simulator" aria-labelledby="simulator-title">
      <h2 id="simulator-title">Simulador</h2>
      <div className="simulator__grid">
        <Controls users={users} storage={storage} apiCalls={apiCalls} errors={state.view?.byControl} />
        {result.ok ? (
          <SimulatorResult
            quote={result.value}
            currency={currency}
            rateText={rates.find((r) => r.currency === currency)?.exchangeRate}
          />
        ) : (
          <p className="state state--error" role="alert">No se puede calcular el precio de este cliente.</p>
        )}
      </div>
      <SaveSection
        currency={currency}
        blocked={!result.ok || [users, storage, apiCalls].some((f) => f.error !== undefined)}
        state={state}
      />
    </section>
  );
}
