// Chip de plan con color propio por plan (spec 010, RF11). El nombre va siempre en texto y no se traduce.
import type { Plan } from '@saas-o-matic/shared';

export function PlanBadge({ plan }: { plan: Plan }) {
  return <span className={`badge badge--plan-${plan}`} translate="no">{plan}</span>;
}
