// Plan (RF2, RF3, RF7): trim sin cambiar mayúsculas; debe ser exactamente uno de PLANS.
import { fail, ok, readText } from './field-result';
import type { FieldResult } from './field-result';
import { isPlan } from './plans';
import type { Plan } from './plans';
import { trimWhitespace } from '../text/whitespace';

export const PLAN_MESSAGES = {
  REQUIRED: 'El plan es obligatorio.',
  INVALID_TYPE: 'El plan debe ser un texto.',
  INVALID_PLAN: 'El plan debe ser starter, growth o enterprise.',
} as const;

const FIELD = 'plan';

export function validatePlan(raw: unknown): FieldResult<Plan> {
  const text = readText(
    FIELD,
    raw,
    { required: PLAN_MESSAGES.REQUIRED, invalidType: PLAN_MESSAGES.INVALID_TYPE },
    trimWhitespace,
  );
  if (!text.ok) return text;
  return isPlan(text.value) ? ok(text.value) : fail(FIELD, 'INVALID_PLAN', PLAN_MESSAGES.INVALID_PLAN);
}
