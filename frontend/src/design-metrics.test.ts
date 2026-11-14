// RF51: las constantes de medida de la escalera tienen una única fuente de verdad con el CSS.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PADDING_PX,
  PRESENTATION_SCALE_PERCENT,
  PRESENTATION_SIDE_PX,
  PRICE_FONT_TENTHS,
  RANGE_FONT_TENTHS,
  SIDE_PX,
  ladderFontSizes,
} from './simulator/ladder-metrics';

const styles = (name: string): string => readFileSync(join(import.meta.dirname, 'styles', name), 'utf8');
const tokens = styles('tokens.css');
const px = (token: string): number => {
  const match = new RegExp(`${token}: *([0-9]+)px`).exec(tokens);
  if (match === null) throw new Error(`falta ${token}`);
  return Number(match[1]);
};

describe('constantes de la escalera frente a los tokens (RF51)', () => {
  it('el precio usa --fs-code (igual que --fs-body-sm) y el rango --fs-caption, en décimas de px', () => {
    expect(PRICE_FONT_TENTHS).toBe(px('--fs-code') * 10);
    expect(PRICE_FONT_TENTHS).toBe(px('--fs-body-sm') * 10);
    expect(RANGE_FONT_TENTHS).toBe(px('--fs-caption') * 10);
  });

  it('el relleno es --space-sm y el lado es --space-2xl por 2', () => {
    expect(PADDING_PX).toBe(px('--space-sm'));
    expect(SIDE_PX).toBe(px('--space-2xl') * 2);
  });

  it('la escala de presentación coincide con --scale de .workspace--presentation', () => {
    const match = /\.workspace--presentation\s*\{\s*--scale:\s*([\d.]+)/.exec(styles('workspace.css'));
    expect(Number(match?.[1]) * 100).toBe(PRESENTATION_SCALE_PERCENT);
    expect(PRESENTATION_SIDE_PX).toBe(120);
    expect(ladderFontSizes(true)).toEqual({ price: 175, range: 150 });
    expect(ladderFontSizes(false)).toEqual({ price: 140, range: 120 });
  });

  it('todos los cuadrados llevan borde de 1 px (transparente si están alcanzados) para que la medida no cambie', () => {
    const css = styles('workspace.css');
    expect(/\.ladder__step \{[^}]*border: 1px solid transparent/.test(css)).toBe(true);
    expect(/\.ladder__step--dim \{[^}]*border-style: dashed/.test(css)).toBe(true);
  });
});
