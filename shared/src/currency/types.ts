// Tipos y constantes de la spec 004 (plan §4): divisa y tipo de cambio en micro-unidades.

export const CURRENCIES = ['EUR', 'USD', 'GBP'] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Divisas con tipo de cambio externo (todas menos EUR). */
export type ForeignCurrency = Exclude<Currency, 'EUR'>;

/** Tipo de cambio como entero: 1,10 son 1_100_000 micro-unidades. */
export type RateMicros = number;

export const MICROS_PER_UNIT = 1_000_000;
export const EUR_MICROS: RateMicros = MICROS_PER_UNIT;

/** Rango válido del tipo, ya redondeado a 6 decimales (RF12): de 0,01 a 100. */
export const RATE_MIN_MICROS: RateMicros = 10_000;
export const RATE_MAX_MICROS: RateMicros = 100_000_000;

/** Importes de una simulación convertidos, en céntimos de la divisa destino. */
export interface ConvertedAmounts {
  convertedBaseCents: number;
  convertedVatCents: number;
  convertedTotalCents: number;
}
