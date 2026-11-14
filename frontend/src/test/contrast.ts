// Ayudas del test de contraste WCAG 2.x (RF31), sin librerías.
export interface Rgba { r: number; g: number; b: number; a: number }

export function parseHex(hex: string): Rgba {
  const digits = hex.trim().replace('#', '');
  const full = digits.length <= 4 ? digits.replace(/./g, (c) => c + c) : digits;
  const byte = (i: number): number => parseInt(full.slice(i, i + 2), 16);
  return { r: byte(0), g: byte(2), b: byte(4), a: full.length === 8 ? byte(6) / 255 : 1 };
}

export function blendOver(fg: Rgba, bg: Rgba): Rgba {
  const mix = (f: number, b: number): number => f * fg.a + b * (1 - fg.a);
  return { r: mix(fg.r, bg.r), g: mix(fg.g, bg.g), b: mix(fg.b, bg.b), a: 1 };
}

function channel(value: number): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(c: Rgba): number {
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

export function contrastRatio(a: Rgba, b: Rgba): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

function declarations(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1] ?? ''] = (m[2] ?? '').trim();
  return out;
}

/** Oscuro = `:root`; claro = `[data-theme="light"]` sobre el oscuro (hereda fuentes, escala y espaciado). */
export function parseTokenBlock(css: string): { dark: Record<string, string>; light: Record<string, string> } {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const body = (start: string): string => {
    const open = clean.indexOf('{', clean.indexOf(start));
    return clean.slice(open + 1, clean.indexOf('}', open));
  };
  const dark = declarations(body(':root'));
  return { dark, light: { ...dark, ...declarations(body('[data-theme="light"]')) } };
}
