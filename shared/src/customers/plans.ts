// Lista cerrada de planes (D9). Solo informativo: no interviene en ningún cálculo (D4, RF7).
export const PLANS = ['starter', 'growth', 'enterprise'] as const;

export type Plan = (typeof PLANS)[number];

const PLAN_SET: ReadonlySet<string> = new Set(PLANS);

/** Comparación exacta, distingue mayúsculas y minúsculas (RF7). */
export function isPlan(value: string): value is Plan {
  return PLAN_SET.has(value);
}
