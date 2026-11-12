// Clave de búsqueda de nombres (RF23): NFC y minúscula simple de Unicode, carácter a carácter,
// sin case folding (ß no pasa a ss). U+0130 (İ) es la única minúscula multicarácter incondicional
// de toLowerCase (daría "i" + U+0307), así que se mapea a "i" para mantener la conversión simple.
// Si esta función cambia, hay que recalcular la columna company_name_search con una migración.
const DOTTED_CAPITAL_I = '\u0130';

function lowerSimple(ch: string): string {
  return ch === DOTTED_CAPITAL_I ? 'i' : ch.toLowerCase();
}

export function toSearchKey(s: string): string {
  let key = '';
  for (const ch of s.normalize('NFC')) key += lowerSimple(ch);
  return key;
}
