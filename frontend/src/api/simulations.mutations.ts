// Guardar una simulación (RF25, RF26): al crearla se invalidan cliente, simulaciones y lista.
import type { SimulationInput } from '@saas-o-matic/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './client';
import { queryKeys } from './query-keys';
import { simulationSchema } from './schemas';
import type { z } from 'zod';

export type SavedSimulation = z.infer<typeof simulationSchema>;

export function useCreateSimulation() {
  const client = useQueryClient();
  return useMutation<SavedSimulation, Error, SimulationInput>({
    mutationFn: (input) =>
      apiRequest('/simulations', simulationSchema, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.customers }),
  });
}
