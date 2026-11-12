// Repositorio de simulaciones (plan §6). Solo SQL, sin reglas de negocio: los importes
// llegan ya calculados por calculateQuote y se guardan congelados (RF20).
import type Database from 'better-sqlite3';
import type { Simulation } from '@saas-o-matic/shared';
import { SIMULATION_COLUMNS, rowToSimulation, tiersToJson } from './simulation-row';
import type { SimulationRow } from './simulation-row';

/** Lo que el service inserta: la simulación completa salvo el id. */
export type SimulationInsert = Omit<Simulation, 'id'>;

export interface SimulationsRepository {
  insert(input: SimulationInsert): Simulation;
  findById(id: number): Simulation | undefined;
  /** Orden created_at DESC, id DESC (RF16). */
  listByCustomer(customerId: number): Simulation[];
}

type InsertParams = Omit<SimulationRow, 'id'>;

const INSERT_SQL = `
INSERT INTO simulations
  (customer_id, users, storage, api_calls, tiers_json, base_cents, country,
   vat_rate_percent, vat_cents, total_cents, created_at)
VALUES
  (@customer_id, @users, @storage, @api_calls, @tiers_json, @base_cents, @country,
   @vat_rate_percent, @vat_cents, @total_cents, @created_at)
RETURNING ${SIMULATION_COLUMNS}`;

const SELECT_BY_ID_SQL = `SELECT ${SIMULATION_COLUMNS} FROM simulations WHERE id = ?`;
const SELECT_BY_CUSTOMER_SQL = `SELECT ${SIMULATION_COLUMNS} FROM simulations
WHERE customer_id = ? ORDER BY created_at DESC, id DESC`;

function toParams(input: SimulationInsert): InsertParams {
  return {
    customer_id: input.customerId,
    users: input.users,
    storage: input.storage,
    api_calls: input.apiCalls,
    tiers_json: tiersToJson(input.tiers),
    base_cents: input.baseCents,
    country: input.country,
    vat_rate_percent: input.vatRatePercent,
    vat_cents: input.vatCents,
    total_cents: input.totalCents,
    created_at: input.createdAt,
  };
}

export function createSimulationsRepository(db: Database.Database): SimulationsRepository {
  const insertStmt = db.prepare<[InsertParams], SimulationRow>(INSERT_SQL);
  const byIdStmt = db.prepare<[number], SimulationRow>(SELECT_BY_ID_SQL);
  const byCustomerStmt = db.prepare<[number], SimulationRow>(SELECT_BY_CUSTOMER_SQL);

  return {
    insert(input) {
      const row = insertStmt.get(toParams(input));
      if (row === undefined) throw new Error('El INSERT no devolvió la fila creada.');
      return rowToSimulation(row);
    },
    findById(id) {
      const row = byIdStmt.get(id);
      return row === undefined ? undefined : rowToSimulation(row);
    },
    listByCustomer(customerId) {
      return byCustomerStmt.all(customerId).map(rowToSimulation);
    },
  };
}
