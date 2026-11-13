// Ejecución del seed (plan §5). No escribe SQL ni calcula importes: reutiliza los servicios del backend
// (que usan calculateQuote y convertQuote y congelan la fila) dentro de una transacción (todo o nada).
import type Database from 'better-sqlite3';
import { validateCustomerInput } from '@saas-o-matic/shared';
import { createCustomersRepository } from '../repositories/customers.repository';
import { createSimulationsRepository } from '../repositories/simulations.repository';
import { runInAsyncTransaction } from '../repositories/transaction';
import { createCustomersService } from '../services/customers.service';
import type { Clock } from '../services/customers.service';
import type { ExchangeRatesService } from '../services/exchange-rates.service';
import { createSimulationsService } from '../services/simulations.service';
import { SEED_DATA } from './seed-data';
import { createSeedRates } from './seed-rates';
import type { SeedCustomer, SeedData, SeedSummary } from './seed-types';
import { validateSeedData } from './validate-seed';
import type { SeedIssue } from './validate-seed';

export class SeedDataError extends Error {
  override readonly name = 'SeedDataError';
  constructor(readonly issues: SeedIssue[]) {
    super(issues.map((i) => `${i.subject}: ${i.field} — ${i.message}`).join('\n'));
  }
}

export interface RunSeedOptions {
  data?: SeedData;
  now?: Clock;
  rates?: ExchangeRatesService;
}

function toNewCustomer(c: SeedCustomer) {
  const result = validateCustomerInput({
    companyName: c.companyName,
    taxId: c.taxId,
    email: c.email,
    country: c.country,
    plan: c.plan,
  });
  if (!result.ok) {
    throw new SeedDataError(result.errors.map((e) => ({ subject: `cliente ${c.key}`, field: e.field, message: e.message })));
  }
  return result.value;
}

function buildServices(db: Database.Database, options: RunSeedOptions) {
  const now = options.now ?? (() => new Date());
  const customersRepo = createCustomersRepository(db);
  const simulations = createSimulationsService({
    customers: customersRepo,
    simulations: createSimulationsRepository(db),
    rates: options.rates ?? createSeedRates(),
    now,
    runInTransaction: (fn) => db.transaction(fn)(),
  });
  return { customersRepo, customers: createCustomersService(customersRepo, now), simulations };
}

export async function runSeed(db: Database.Database, options: RunSeedOptions = {}): Promise<SeedSummary> {
  const data = options.data ?? SEED_DATA;
  const issues = validateSeedData(data);
  if (issues.length > 0) throw new SeedDataError(issues);
  const { customersRepo, customers, simulations } = buildServices(db, options);

  return runInAsyncTransaction(db, async () => {
    const created = new Map<string, number>();
    let existing = 0;
    for (const seed of data.customers) {
      const input = toNewCustomer(seed);
      if (customersRepo.findByCountryAndTaxId(input.country, input.taxId) !== undefined) existing += 1;
      else created.set(seed.key, customers.create(input).id);
    }
    let simulationsCreated = 0;
    for (const s of data.simulations) {
      const customerId = created.get(s.customerKey);
      if (customerId === undefined) continue;
      await simulations.create({ customerId, users: s.users, storage: s.storage, apiCalls: s.apiCalls, currency: s.currency });
      simulationsCreated += 1;
    }
    return { customersCreated: created.size, customersExisting: existing, simulationsCreated };
  });
}
