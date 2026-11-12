// Propiedades exhaustivas N = 0 … 100 000 (CA3, CA4, RF3, RF15). Sin fast-check: bucle que acumula fallos.
import { describe, expect, it } from 'vitest';
import { calculateBaseCost } from './calculate-base-cost';
import { calculateQuote } from './calculate-quote';
import type { BaseCost, Quote } from './types';

const MAX_N = 100_000;
// Tipos esperados escritos aquí a propósito (oráculo independiente de vat-rates.ts).
const COUNTRIES: readonly (readonly [string, number])[] = [
  ['ES', 21], ['PT', 23], ['FR', 20], ['DE', 19], ['IT', 22], ['GB', 20], ['US', 0], ['MX', 0],
];

function expectedIncrement(n: number): number {
  if (n <= 10) return 1000;
  if (n <= 50) return 800;
  return 500;
}

function isCleanAmount(v: number): boolean {
  return Number.isSafeInteger(v) && v >= 0 && !Object.is(v, -0);
}

function baseFailures(n: number, b: BaseCost, prevBase: number | null): string[] {
  const f: string[] = [];
  const billed = b.tiers.reduce((s, t) => s + t.billedUsers, 0);
  const subtotals = b.tiers.reduce((s, t) => s + t.subtotalCents, 0);
  if (billed !== n) f.push(`N=${String(n)}: Σ billedUsers=${String(billed)}`);
  if (subtotals !== b.baseCents) f.push(`N=${String(n)}: Σ subtotales≠base`);
  if (prevBase !== null && b.baseCents - prevBase !== expectedIncrement(n)) {
    f.push(`N=${String(n)}: incremento ${String(b.baseCents - prevBase)}`);
  }
  const nums = [b.users, b.baseCents, ...b.tiers.flatMap((t) => [t.billedUsers, t.subtotalCents])];
  if (!nums.every(isCleanAmount)) f.push(`N=${String(n)}: salida base no entera segura/≥0/+0`);
  return f;
}

function quoteFailures(n: number, country: string, rate: number, q: Quote): string[] {
  const f: string[] = [];
  const tag = `N=${String(n)} ${country}`;
  if (q.vatRatePercent !== rate) f.push(`${tag}: tipo ${String(q.vatRatePercent)}`);
  if (q.vatCents * 100 !== q.baseCents * rate) f.push(`${tag}: IVA ${String(q.vatCents)}`);
  if (q.totalCents !== q.baseCents + q.vatCents) f.push(`${tag}: total`);
  const nums = [q.users, q.baseCents, q.vatRatePercent, q.vatCents, q.totalCents,
    ...q.tiers.flatMap((t) => [t.billedUsers, t.subtotalCents])];
  if (!nums.every(isCleanAmount)) f.push(`${tag}: salida no entera segura/≥0/+0`);
  return f;
}

describe('propiedades exhaustivas de precios (N = 0 … 100 000)', () => {
  it('coste base: sumas, incremento por tramo y enteros limpios', () => {
    const fallos: string[] = [];
    let prevBase: number | null = null;
    for (let n = 0; n <= MAX_N; n++) {
      const r = calculateBaseCost({ users: n });
      if (!r.ok) { fallos.push(`N=${String(n)}: error`); prevBase = null; continue; }
      fallos.push(...baseFailures(n, r.value, prevBase));
      prevBase = r.value.baseCents;
    }
    expect(fallos).toEqual([]);
  });

  it('presupuesto: IVA exacto y total = base + IVA para los 8 países', () => {
    const fallos: string[] = [];
    for (let n = 0; n <= MAX_N; n++) {
      for (const [country, rate] of COUNTRIES) {
        const r = calculateQuote({ users: n, country });
        if (!r.ok) { fallos.push(`N=${String(n)} ${country}: error`); continue; }
        fallos.push(...baseFailures(n, r.value, null), ...quoteFailures(n, country, rate, r.value));
      }
    }
    expect(fallos).toEqual([]);
  });

  it('entrada -0 devuelve todo +0 (RF15)', () => {
    const r = calculateQuote({ users: -0, country: 'US' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const nums = [r.value.users, r.value.baseCents, r.value.vatCents, r.value.totalCents, r.value.vatRatePercent,
      ...r.value.tiers.flatMap((t) => [t.billedUsers, t.subtotalCents])];
    expect(nums.every(isCleanAmount)).toBe(true);
  });
});
