// Lista cerrada de pares de contraste de las specs 008 y 010 (nombres de token, sin colores a mano).
// `over`: superficie sobre la que se mezcla un fondo con alfa (por defecto `surface`). `themes`: temas donde aplica (por defecto ambos).
export interface Pair { fg: string; bg: string; min: number; over?: 'surface' | 'bg'; themes?: ('dark' | 'light')[] }

const SURFACES = ['bg', 'surface', 'surface-2'];
const BOTH: ('surface' | 'bg')[] = ['surface', 'bg'];
const text = (fg: string, bgs: string[]): Pair[] => bgs.map((bg) => ({ fg, bg, min: 4.5 }));
const nonText = (fg: string, bgs: string[]): Pair[] => bgs.map((bg) => ({ fg, bg, min: 3 }));
/** Pares de texto con fondo semitransparente: se comprueban sobre la superficie y sobre el fondo de página. */
const overBoth = (fg: string, bg: string): Pair[] => BOTH.map((over) => ({ fg, bg, min: 4.5, over }));

export const PAIRS: Pair[] = [
  ...['text', 'text-muted', 'sage-text', 'sage-text-hover', 'error-text'].flatMap((t) => text(t, SURFACES)),
  ...['success', 'warning', 'error'].flatMap((s) => text(`${s}-text`, [`${s}-bg`])),
  ...overBoth('info-text', 'info-bg'),
  ...text('on-action', ['action', 'action-hover']),
  ...text('on-error-strong', ['error-strong', 'error-strong-hover']),
  ...text('on-sage', ['sage']),
  ...['1', '2', '3', 'vat'].flatMap((k) => text(`on-chart-${k}`, [`chart-${k}`])),
  ...text('tooltip-text', ['tooltip-bg']),
  ...text('text', ['hover', 'active']),
  ...['hover', 'active', 'ghost-hover', 'secondary-hover'].flatMap((h) => overBoth('text-muted', h)),
  ...overBoth('plan-growth-text', 'plan-growth-bg'),
  ...overBoth('info-text', 'plan-starter-bg'),
  ...overBoth('text', 'plan-enterprise-bg'),
  ...overBoth('text', 'selection'),
  // El oscuro no cambia en la 010 (muted sobre la selección da 4,3:1 sobre la superficie desde la 008); solo se exige en claro.
  ...overBoth('text-muted', 'selection').map((p): Pair => ({ ...p, themes: ['light'] })),
  ...nonText('border-control', SURFACES),
  ...nonText('focus', SURFACES),
  ...nonText('action', ['bg', 'surface']),
  ...nonText('toggle-line', ['action', 'surface', 'bg']),
  ...nonText('sage-text', ['bg', 'surface']),
  { fg: 'border', bg: 'bg', min: 2, themes: ['light'] },
  // Limitación declarada (spec 010, D-U5): en claro el relleno sage, info y chart no llega a 3:1 sobre la superficie.
  ...['sage', 'chart-2', 'chart-3'].map((fg): Pair => ({ fg, bg: 'surface', min: 3, themes: ['dark'] })),
  ...nonText('error', ['surface']),
  ...['1', 'vat'].flatMap((k) => nonText(`chart-${k}`, ['surface'])),
];
