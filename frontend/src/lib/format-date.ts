// Fechas y horas en la hora local del navegador (V5, V8, RF39).
const DATE_TIME = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const CLOCK = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}

export function formatClock(iso: string): string {
  return CLOCK.format(new Date(iso));
}

/** La hora más antigua de los tipos recibidos (V5); sin tipos, undefined. */
export function oldestRateAt(items: readonly { exchangeRateAt: string }[]): string | undefined {
  let oldest: string | undefined;
  for (const { exchangeRateAt } of items) {
    if (oldest === undefined || Date.parse(exchangeRateAt) < Date.parse(oldest)) oldest = exchangeRateAt;
  }
  return oldest;
}
