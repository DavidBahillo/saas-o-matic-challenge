// Esquema Zod del cuerpo de POST /simulations (plan §3, RF5–RF9). Mismo patrón que la 001:
// Zod comprueba que es un objeto plano y las reglas vienen de validateSimulationInput, que
// recibe el objeto ORIGINAL para no perder una clave propia "__proto__" (UNKNOWN_FIELD).
import { z } from 'zod';
import { validateSimulationInput } from '@saas-o-matic/shared';
import type { SimulationInput } from '@saas-o-matic/shared';
import { BODY_INVALID_TYPE, isPlainObject, toFieldErrors } from './customer-body.schema';
import type { ParseResult } from './customer-body.schema';

const CreateSimulationBodySchema = z.unknown().transform((value, ctx): SimulationInput => {
  const result = isPlainObject(value) ? validateSimulationInput(value) : undefined;
  if (result?.ok === true) return result.value;
  for (const fieldError of result?.errors ?? [BODY_INVALID_TYPE]) {
    ctx.addIssue({ code: 'custom', message: fieldError.message, params: { fieldError } });
  }
  return z.NEVER;
});

export function parseCreateSimulationBody(body: unknown): ParseResult<SimulationInput> {
  const result = CreateSimulationBodySchema.safeParse(body);
  return result.success
    ? { ok: true, value: result.data }
    : { ok: false, errors: toFieldErrors(result.error.issues) };
}
