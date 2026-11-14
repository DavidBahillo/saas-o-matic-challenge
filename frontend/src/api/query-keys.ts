// Claves de caché (D-P2). Invalidar ['customers'] cubre lista, detalle y simulaciones.
export const queryKeys = {
  customers: ['customers'] as const,
  customerList: (q: string, page: number) => ['customers', 'list', q, page] as const,
  customerEdit: (id: string) => ['customers', 'edit', id] as const,
  customerListAll: ['customers', 'list'] as const,
  customer: (id: string) => ['customers', 'detail', id] as const,
  customerSimulations: (id: string) => ['customers', 'detail', id, 'simulations'] as const,
  exchangeRates: ['exchange-rates'] as const,
};
