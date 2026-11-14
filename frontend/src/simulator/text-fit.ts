// Criterio de ajuste compartido por la barra y la escalera (R3-3): Fira Code mide 0,6 em por carácter, todo con enteros.

/** Ancho estimado en px de `chars` caracteres de Fira Code a `fontSizeTenthsPx` décimas de px (120 = 12 px). */
export function textWidthPx(chars: number, fontSizeTenthsPx: number): number {
  return Math.ceil((chars * fontSizeTenthsPx * 6) / 100);
}

export function fitsInWidth(chars: number, fontSizeTenthsPx: number, availablePx: number): boolean {
  return textWidthPx(chars, fontSizeTenthsPx) <= availablePx;
}
