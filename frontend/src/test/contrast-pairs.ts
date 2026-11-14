// Lista cerrada de pares de contraste de la spec 008 (nombres de token, sin colores a mano).
export interface Pair { fg: string; bg: string; min: number }

const SURFACES = ['bg', 'surface', 'surface-2'];
const text = (fg: string, bgs: string[]): Pair[] => bgs.map((bg) => ({ fg, bg, min: 4.5 }));
const nonText = (fg: string, bgs: string[]): Pair[] => bgs.map((bg) => ({ fg, bg, min: 3 }));

export const PAIRS: Pair[] = [
  ...['text', 'text-muted', 'sage-text', 'sage-text-hover', 'error-text'].flatMap((t) => text(t, SURFACES)),
  ...['success', 'warning', 'error', 'info'].flatMap((s) => text(`${s}-text`, [`${s}-bg`])),
  ...text('on-action', ['action', 'action-hover']),
  ...text('on-error-strong', ['error-strong', 'error-strong-hover']),
  ...text('on-sage', ['sage']),
  ...['1', '2', '3', 'vat'].flatMap((k) => text(`on-chart-${k}`, [`chart-${k}`])),
  ...text('tooltip-text', ['tooltip-bg']),
  ...text('text', ['hover', 'active']),
  ...nonText('border-control', SURFACES),
  ...nonText('focus', SURFACES),
  ...nonText('action', ['bg', 'surface']),
  ...nonText('sage', ['surface']),
  ...nonText('error', ['surface']),
  ...['1', '2', '3', 'vat'].flatMap((k) => nonText(`chart-${k}`, ['surface'])),
];
