// Tabla fija de IVA por país (D5, RF8). Congelada (RF4).
export type VatTableCountry = 'ES' | 'PT' | 'FR' | 'DE' | 'IT' | 'GB' | 'US';

export const VAT_RATES_PERCENT: Readonly<Record<VatTableCountry, number>> = Object.freeze({
  ES: 21,
  PT: 23,
  FR: 20,
  DE: 19,
  IT: 22,
  GB: 20,
  US: 0,
});

function isVatTableCountry(country: string): country is VatTableCountry {
  return Object.hasOwn(VAT_RATES_PERCENT, country);
}

/** Precondición: país ISO válido. Fuera de la tabla → 0 (RF8, D5). */
export function vatRatePercentFor(country: string): number {
  return isVatTableCountry(country) ? VAT_RATES_PERCENT[country] : 0;
}
