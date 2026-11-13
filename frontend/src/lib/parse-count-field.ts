// Interpretación de los campos numéricos (RF20, RF22): solo dígitos ASCII, entero de 0 a max.
export type CountParse = { ok: true; value: number } | { ok: false; message: string };

const DIGITS = /^[0-9]+$/;
const MAX_DIGITS = 15;
const GROUPED = new Intl.NumberFormat('es-ES', { useGrouping: 'always' });

export function parseCountField(text: string, max: number): CountParse {
  const trimmed = text.trim();
  if (trimmed === '') return { ok: false, message: 'Introduce un número entero.' };
  if (!DIGITS.test(trimmed)) {
    return { ok: false, message: 'Solo se admiten dígitos: sin signo, decimales, exponente ni separadores.' };
  }
  const tooBig = { ok: false, message: `El valor no puede ser mayor que ${GROUPED.format(max)}.` } as const;
  if (trimmed.replace(/^0+/, '').length > MAX_DIGITS) return tooBig;
  const value = Number(trimmed);
  return value > max ? tooBig : { ok: true, value };
}
