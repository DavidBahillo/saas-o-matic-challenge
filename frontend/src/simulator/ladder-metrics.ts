// Medidas de la escalera (RF51): única fuente de los tamaños de fuente y del lado de los cuadrados que usa TierLadder para
// decidir si el texto cabe. `design-metrics.test.ts` las compara con los tokens del CSS (--fs-code, --fs-caption, --space-*).

/** Precio por usuario: Fira Code 14 px (`--fs-code`), en décimas de px. */
export const PRICE_FONT_TENTHS = 140;
/** Rango: caption de 12 px (`--fs-caption`), en décimas de px. */
export const RANGE_FONT_TENTHS = 120;
/** Escala del modo presentación (`--scale` en `.workspace--presentation`), en porcentaje. */
export const PRESENTATION_SCALE_PERCENT = 125;
/** Lado del cuadrado: `calc(var(--space-2xl) * 2)` y, en presentación, por la escala. */
export const SIDE_PX = 96;
export const PRESENTATION_SIDE_PX = (SIDE_PX * PRESENTATION_SCALE_PERCENT) / 100;
/** Relleno interior a cada lado: `--space-sm`. */
export const PADDING_PX = 8;

export interface LadderFontSizes {
  price: number;
  range: number;
}

export function ladderFontSizes(presentation: boolean): LadderFontSizes {
  const scale = presentation ? PRESENTATION_SCALE_PERCENT : 100;
  return { price: (PRICE_FONT_TENTHS * scale) / 100, range: (RANGE_FONT_TENTHS * scale) / 100 };
}

export const defaultSidePx = (presentation: boolean): number => (presentation ? PRESENTATION_SIDE_PX : SIDE_PX);
