// Texto explicativo del cálculo (RF26): cuántos usuarios caen en cada tramo, sin cálculos nuevos.
import type { Quote } from '@saas-o-matic/shared';
import { usersLabel } from '../lib/pluralize';

export function explainTiers(tiers: Quote['tiers'], users: number): string {
  const paid = tiers.filter((t) => t.billedUsers > 0);
  if (paid.length === 0) return `Con ${usersLabel(users)} el importe es 0.`;
  const parts = paid.map((t, i) => `${String(t.billedUsers)} al ${i === 0 ? 'precio del' : 'del'} tramo ${String(t.tier)}`);
  const last = parts.pop();
  const list = parts.length === 0 ? (last ?? '') : `${parts.join(', ')} y ${last ?? ''}`;
  return `Con ${usersLabel(users)} pagas ${list}.`;
}
