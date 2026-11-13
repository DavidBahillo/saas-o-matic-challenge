// Validación pura de los datos semilla antes de tocar la base (RF2, D-P3). Reutiliza los validadores de shared/.
import { normalizeTaxId, validateCustomerInput, validateSimulationInput } from '@saas-o-matic/shared';
import type { FieldError } from '@saas-o-matic/shared';
import type { SeedData } from './seed-types';

export interface SeedIssue {
  /** `cliente <key>` o `simulación #n`. */
  subject: string;
  field: string;
  message: string;
}

const toIssues = (subject: string, errors: FieldError[]): SeedIssue[] =>
  errors.map((e) => ({ subject, field: e.field, message: e.message }));

function customerIssues(data: SeedData): SeedIssue[] {
  const issues: SeedIssue[] = [];
  const keys = new Set<string>();
  const identities = new Set<string>();
  for (const c of data.customers) {
    const subject = `cliente ${c.key}`;
    if (keys.has(c.key)) issues.push({ subject, field: 'key', message: 'Clave de cliente duplicada.' });
    keys.add(c.key);
    const result = validateCustomerInput({
      companyName: c.companyName,
      taxId: c.taxId,
      email: c.email,
      country: c.country,
      plan: c.plan,
    });
    if (!result.ok) {
      issues.push(...toIssues(subject, result.errors));
      continue;
    }
    const identity = `${c.country}:${normalizeTaxId(c.taxId)}`;
    if (identities.has(identity)) issues.push({ subject, field: 'taxId', message: 'País y tax ID duplicados.' });
    identities.add(identity);
  }
  return issues;
}

function simulationIssues(data: SeedData): SeedIssue[] {
  const keys = new Set(data.customers.map((c) => c.key));
  return data.simulations.flatMap((s, index) => {
    const subject = `simulación #${String(index + 1)}`;
    const issues: SeedIssue[] = [];
    if (!keys.has(s.customerKey)) {
      issues.push({ subject, field: 'customerKey', message: `El cliente "${s.customerKey}" no existe.` });
    }
    // El id real aún no existe: 1 es un marcador válido para comprobar el resto de campos.
    const result = validateSimulationInput({
      customerId: 1,
      users: s.users,
      storage: s.storage,
      apiCalls: s.apiCalls,
      currency: s.currency,
    });
    return result.ok ? issues : [...issues, ...toIssues(subject, result.errors)];
  });
}

export function validateSeedData(data: SeedData): SeedIssue[] {
  return [...customerIssues(data), ...simulationIssues(data)];
}
