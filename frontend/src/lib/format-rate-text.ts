// Tipos de cambio como texto con coma decimal (RF18, RF23, RF26); solo manipula el texto, sin coma flotante.

/** "1.100000" → "1,100000": los 6 decimales tal como los guardó el backend. */
export function formatRateFull(text: string): string {
  return text.replace('.', ',');
}

/** "1.100000" → "1,10": sin ceros finales, con al menos 2 decimales. */
export function formatRateShort(text: string): string {
  const [integer = '', fraction = ''] = text.split('.');
  const trimmed = fraction.replace(/0+$/, '').padEnd(2, '0');
  return `${integer},${trimmed}`;
}
