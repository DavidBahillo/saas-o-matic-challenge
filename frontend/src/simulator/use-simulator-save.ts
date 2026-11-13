// Guardado del simulador (RF25 a RF27): un solo envío a la vez, reintento con la misma solicitud y tipo de la vista previa.
import type { Currency, SimulationInput } from '@saas-o-matic/shared';
import { useState } from 'react';
import { useCreateSimulation } from '../api/simulations.mutations';
import type { SavedSimulation } from '../api/simulations.mutations';
import { useSubmitLock } from '../lib/use-submit-lock';
import { useCurrency } from '../state/currency-context';
import { buildSimulationRequest } from './request';
import type { SimulationDraft } from './request';
import { describeSimulationError } from './simulator-errors';
import type { SimulationErrorView } from './simulator-errors';

export interface SavedResult {
  simulation: SavedSimulation;
  /** Tipo de la vista previa en el momento de guardar, para avisar si el backend aplicó otro (RF26). */
  previewRate: string | undefined;
}

export interface SimulatorSave {
  pending: boolean;
  view: SimulationErrorView | undefined;
  saved: SavedResult | undefined;
  save: () => void;
  saveInEur: () => void;
  retry: () => void;
}

export function useSimulatorSave(customerId: number, draft: SimulationDraft): SimulatorSave {
  const { currency, rates } = useCurrency();
  const mutation = useCreateSimulation();
  const guard = useSubmitLock(mutation.isPending, mutation.data, mutation.error);
  const [saved, setSaved] = useState<SavedResult | undefined>(undefined);

  const rateFor = (c: Currency): string | undefined =>
    c === 'EUR' ? '1.000000' : rates.find((r) => r.currency === c)?.exchangeRate;

  function send(input: SimulationInput) {
    guard(() => {
      mutation.mutate(input, {
        onSuccess: (simulation) => { setSaved({ simulation, previewRate: rateFor(input.currency) }); },
      });
    });
  }

  return {
    pending: mutation.isPending,
    view: mutation.isError ? describeSimulationError(mutation.error) : undefined,
    saved,
    save: () => { send(buildSimulationRequest(customerId, draft, currency)); },
    saveInEur: () => { send(buildSimulationRequest(customerId, draft, 'EUR')); },
    retry: () => { if (mutation.variables !== undefined) send(mutation.variables); },
  };
}
