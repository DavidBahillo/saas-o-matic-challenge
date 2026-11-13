// Formato de importes con enteros (D-P9, RF39): parte entera con Intl y decimales con el resto,
// sin pasar por coma flotante. 0 nunca sale como "-0,00".
import type { Currency } from '@saas-o-matic/shared';

const NBSP = String.fromCharCode(0xa0);
const WHOLE_FORMAT = new Intl.NumberFormat('es-ES', { useGrouping: 'always', maximumFractionDigits: 0 });

export function formatMoney(cents: number, currency: Currency): string {
  const abs = Math.abs(cents);
  const rest = abs % 100;
  const whole = (abs - rest) / 100;
  const sign = cents < 0 && abs > 0 ? '-' : '';
  return `${sign}${WHOLE_FORMAT.format(whole)},${String(rest).padStart(2, '0')}${NBSP}${currency}`;
}
