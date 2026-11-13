// Resumen de texto del seed (plan §4 y §7). Función pura.
import type { SeedSummary } from './seed-types';

export function formatSummary(s: SeedSummary): string {
  return [
    `Clientes: ${String(s.customersCreated)} creados, ${String(s.customersExisting)} ya existentes`,
    `Simulaciones: ${String(s.simulationsCreated)} creadas`,
  ].join('\n');
}
