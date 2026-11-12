import { describe, expect, it } from 'vitest';
import { PLAN_MESSAGES, validatePlan } from './validate-plan';

function failure(code: string, message: string) {
  return { ok: false, error: { field: 'plan', code, message } };
}

describe('validatePlan (RF2, RF3, RF7)', () => {
  it.each([
    ['starter', 'starter'],
    ['growth', 'growth'],
    ['enterprise', 'enterprise'],
    [' growth ', 'growth'],
    ['\tenterprise\n', 'enterprise'],
  ])('%j → %j', (input, expected) => {
    expect(validatePlan(input)).toEqual({ ok: true, value: expected });
  });

  it.each([['Starter'], ['GROWTH'], ['pro'], ['grow th'], ['starter.']])(
    '%j → INVALID_PLAN',
    (input) => {
      expect(validatePlan(input)).toEqual(failure('INVALID_PLAN', PLAN_MESSAGES.INVALID_PLAN));
    },
  );

  it.each([[''], ['   '], [null], [undefined]])('%j → REQUIRED', (input) => {
    expect(validatePlan(input)).toEqual(failure('REQUIRED', PLAN_MESSAGES.REQUIRED));
  });

  it.each([[1], [false], [['growth']]])('%j → INVALID_TYPE', (input) => {
    expect(validatePlan(input)).toEqual(failure('INVALID_TYPE', PLAN_MESSAGES.INVALID_TYPE));
  });
});
