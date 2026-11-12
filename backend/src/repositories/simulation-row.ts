// Fila de la tabla simulations y su conversión a Simulation (plan §3 y §6).
// tiers_json se valida al leer: los datos de la BD también son una entrada externa.
import { z } from 'zod';
import type { Simulation, TierLine } from '@saas-o-matic/shared';

export interface SimulationRow {
  id: number;
  customer_id: number;
  users: number;
  storage: number;
  api_calls: number;
  tiers_json: string;
  base_cents: number;
  country: string;
  vat_rate_percent: number;
  vat_cents: number;
  total_cents: number;
  created_at: string;
}

export const SIMULATION_COLUMNS =
  'id, customer_id, users, storage, api_calls, tiers_json, base_cents, country, ' +
  'vat_rate_percent, vat_cents, total_cents, created_at';

const cents = z.number().int().nonnegative();

const tierLineSchema = z.object({
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  from: cents,
  to: cents.nullable(),
  unitPriceCents: cents,
  billedUsers: cents,
  subtotalCents: cents,
});

const tiersSchema = z.array(tierLineSchema);

/** Serializa el desglose en el orden de claves de TierLine. */
export function tiersToJson(tiers: readonly TierLine[]): string {
  return JSON.stringify(
    tiers.map((t) => ({
      tier: t.tier,
      from: t.from,
      to: t.to,
      unitPriceCents: t.unitPriceCents,
      billedUsers: t.billedUsers,
      subtotalCents: t.subtotalCents,
    })),
  );
}

function parseTiers(row: SimulationRow): TierLine[] {
  const parsed = tiersSchema.safeParse(JSON.parse(row.tiers_json));
  if (!parsed.success) throw new Error(`Fila de simulación corrupta (id ${String(row.id)}).`);
  return parsed.data;
}

/** Convierte una fila en Simulation. Lee los importes tal cual: no recalcula (RF20). */
export function rowToSimulation(row: SimulationRow): Simulation {
  return {
    id: row.id,
    customerId: row.customer_id,
    users: row.users,
    storage: row.storage,
    apiCalls: row.api_calls,
    tiers: parseTiers(row),
    baseCents: row.base_cents,
    country: row.country,
    vatRatePercent: row.vat_rate_percent,
    vatCents: row.vat_cents,
    totalCents: row.total_cents,
    createdAt: row.created_at,
  };
}
