// Reglas de los tests de tokens y espaciado (RF3, RF4): funciones puras sobre texto CSS o TSX.
const COLOR_NAMES = [
  'red', 'blue', 'green', 'white', 'black', 'gray', 'grey', 'orange', 'yellow', 'purple', 'pink', 'brown', 'cyan',
  'magenta', 'teal', 'navy', 'lime', 'olive', 'maroon', 'silver', 'gold', 'indigo', 'violet', 'coral', 'salmon',
  'turquoise', 'crimson', 'tomato', 'aqua', 'fuchsia', 'khaki', 'beige', 'ivory', 'lavender', 'plum', 'tan', 'azure',
];
const COLOR_PROPS = /(^|-)(color|background|border|outline|fill|stroke|shadow|decoration)(-|$)/;
const COLOR_FUNCTIONS = /\b(rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(|color-mix\(/;
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const SPACE_PROPS = /^(padding|margin|gap|row-gap|column-gap|inset)(-[a-z]+)*$/;
const LITERAL_SPACES = new Set(['6px', '10px', '14px', '22px', '28px']);

export interface Decl { selector: string; prop: string; value: string }

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Quita los bloques `@media (forced-colors: active)`, donde valen los colores de sistema. */
export function stripForcedColors(css: string): string {
  let out = css;
  for (;;) {
    const start = out.indexOf('@media (forced-colors: active)');
    if (start < 0) return out;
    let depth = 0;
    let end = out.indexOf('{', start);
    for (; end < out.length; end += 1) {
      depth += out[end] === '{' ? 1 : out[end] === '}' ? -1 : 0;
      if (depth === 0) break;
    }
    out = out.slice(0, start) + out.slice(end + 1);
  }
}

export function declarations(css: string): Decl[] {
  const out: Decl[] = [];
  for (const rule of stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = (rule[1] ?? '').trim();
    for (const d of (rule[2] ?? '').matchAll(/([\w-]+)\s*:\s*([^;]+)/g)) {
      out.push({ selector, prop: d[1] ?? '', value: (d[2] ?? '').trim() });
    }
  }
  return out;
}

function checkDecl({ prop, value }: Decl): string | undefined {
  const words = value.toLowerCase().split(/[\s,()/]+/);
  if (COLOR_PROPS.test(prop) && words.some((w) => COLOR_NAMES.includes(w))) return `color con nombre: ${prop}: ${value}`;
  if (prop === 'box-shadow' && value !== 'none' && !value.includes('var(')) return `box-shadow sin token: ${value}`;
  if (prop === 'border-radius') {
    const ok = (value.match(/var\([^)]*\)|\S+/g) ?? []).every((t) => /^var\(--radius[\w-]*\)$|^(0|50%|inherit)$/.test(t));
    return ok ? undefined : `border-radius sin token: ${value}`;
  }
  if ((prop === 'font-family' || prop === 'font') && !/var\(--font-|^inherit$/.test(value)) return `${prop} sin token: ${value}`;
  return undefined;
}

/** Hexadecimales, funciones de color, nombres, sombras, radios y familias literales (fuera de `forced-colors`). */
export function colorViolations(css: string): string[] {
  const clean = stripForcedColors(stripComments(css));
  const found: string[] = [];
  if (HEX.test(clean)) found.push('hexadecimal');
  if (COLOR_FUNCTIONS.test(clean)) found.push('función de color');
  return [...found, ...declarations(clean).map(checkDecl).filter((v): v is string => v !== undefined)];
}

function spaceTokenOk(token: string, selector: string): boolean {
  if (/^(0|auto|inherit)$/.test(token) || LITERAL_SPACES.has(token)) return true;
  if (/^var\(--space-\w+\)$/.test(token)) return true;
  if (token === '4px' && selector.includes('quote-table')) return true;
  return token.startsWith('calc(') && token.includes('var(--space-');
}

const SPACE_TOKENS = /calc\((?:[^()]|\([^()]*\))*\)|var\([^)]*\)|\S+/g;

/** Valores de padding, margin, gap e inset fuera de la escala y de las excepciones de DESIGN.md. */
export function spacingViolations(css: string): string[] {
  return declarations(css)
    .filter((d) => SPACE_PROPS.test(d.prop) && d.selector !== '.sr-only')
    .filter((d) => !(d.value.match(SPACE_TOKENS) ?? []).every((t) => spaceTokenOk(t, d.selector)))
    .map((d) => `${d.selector} { ${d.prop}: ${d.value} }`);
}

/** Estilos en línea con color, fondo, borde, sombra o familia, y `fill`/`stroke` literales en TSX. */
export function inlineStyleViolations(tsx: string): string[] {
  const found: string[] = [];
  for (const m of tsx.matchAll(/style=\{\{([^}]*)\}\}/g)) {
    if (/\b(color|background\w*|border\w*|boxShadow|outline\w*|fontFamily|fill|stroke)\s*:/.test(m[1] ?? '')) found.push(`style: ${m[1] ?? ''}`);
  }
  for (const m of tsx.matchAll(/\b(fill|stroke)="([^"]*)"/g)) {
    if (!/^(none|currentColor)$/.test(m[2] ?? '')) found.push(`${m[1] ?? ''}="${m[2] ?? ''}"`);
  }
  return found;
}
