// IVA half-up al céntimo con aritmética de enteros (RF10, D-P5). Interno: no se exporta (U6).

/** Precondición: baseCents y ratePercent enteros ≥ 0 y baseCents × ratePercent seguro. */
export function vatCentsHalfUp(baseCents: number, ratePercent: number): number {
  const product = baseCents * ratePercent;
  const rem = product % 100;
  return (product - rem) / 100 + (rem >= 50 ? 1 : 0);
}
