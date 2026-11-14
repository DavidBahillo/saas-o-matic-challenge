// Modelo del gráfico (RF21, RF40) con los importes de la tabla "Tramos e IVA" de la spec.
import { calculateQuote } from '@saas-o-matic/shared';
import type { Quote } from '@saas-o-matic/shared';
import { describe, expect, it } from 'vitest';
import { buildChartModel, labelFits } from './chart-model';

function quoteFor(users: number, country = 'ES'): Quote {
  const result = calculateQuote({ users, country });
  if (!result.ok) throw new Error('cálculo no válido');
  return result.value;
}

const NB = String.fromCharCode(0xa0);
const nb = (text: string): string => text.replaceAll(' ', NB);

describe('buildChartModel: segmentos', () => {
  it('0 usuarios: sin segmentos y sin porcentaje', () => {
    const model = buildChartModel(quoteFor(0));
    expect(model.segments).toEqual([]);
    expect(model.title).toBe('Desglose del coste mensual');
  });

  it('1 usuario: tramo 1 e IVA', () => {
    const model = buildChartModel(quoteFor(1));
    expect(model.segments.map((s) => [s.key, s.cents])).toEqual([
      ['tier1', 1000],
      ['vat', 210],
    ]);
  });

  it('11 usuarios: claves y céntimos de los segmentos', () => {
    const model = buildChartModel(quoteFor(11));
    expect(model.segments.map((s) => [s.key, s.cents])).toEqual([
      ['tier1', 10000],
      ['tier2', 800],
      ['vat', 2268],
    ]);
  });

  it('51 usuarios: entra el tramo 3 con 5,00 EUR', () => {
    const keys = buildChartModel(quoteFor(51)).segments.map((s) => s.key);
    expect(keys).toEqual(['tier1', 'tier2', 'tier3', 'vat']);
  });

  it('IVA 0 %: el segmento del IVA no se dibuja', () => {
    const keys = buildChartModel(quoteFor(15, 'US')).segments.map((s) => s.key);
    expect(keys).toEqual(['tier1', 'tier2']);
  });
  it('1 y 10 usuarios a 480 px: "Tramo 1" e "IVA 21 %" completos; a 300 px, el IVA abreviado', () => {
    for (const users of [1, 10]) {
      const wide = buildChartModel(quoteFor(users), 480).segments;
      expect(wide.map((s) => [s.fullText, s.display])).toEqual([[nb('Tramo 1'), 'full'], [nb('IVA 21 %'), 'full']]);
      const narrow = buildChartModel(quoteFor(users), 300).segments;
      expect(narrow.map((s) => [s.key, s.display])).toEqual([['tier1', 'full'], ['vat', 'short']]);
      expect(narrow[1]?.shortText).toBe(nb('21 %'));
      expect(narrow[1]?.name).toBe(nb('IVA 21 %'));
    }
  });

  it('11 usuarios: el tramo 2 (6 %) queda sin texto a 480 y a 300 px', () => {
    for (const width of [480, 300]) {
      const t2 = buildChartModel(quoteFor(11), width).segments.find((s) => s.key === 'tier2');
      expect(t2?.display).toBe('none');
      expect(t2?.name).toBe(nb('Tramo 2'));
      expect(t2?.shortText).toBe('T2');
    }
  });

  it('51 usuarios: el tramo 3 (1 %) no tiene texto visible y conserva su nombre', () => {
    for (const width of [480, 300]) {
      const t3 = buildChartModel(quoteFor(51), width).segments.find((s) => s.key === 'tier3');
      expect(t3?.display).toBe('none');
      expect(t3?.name).toBe(nb('Tramo 3'));
    }
  });

  it('el nivel de texto sigue labelFits en el orden nombre, abreviatura, nada (1, 10, 11, 50 y 51 usuarios)', () => {
    for (const users of [1, 10, 11, 50, 51]) {
      for (const width of [300, 480]) {
        const quote = quoteFor(users);
        const total = quote.baseCents + quote.vatCents;
        for (const s of buildChartModel(quote, width).segments) {
          const expected = labelFits(s.fullText, s.cents, total, width) ? 'full' : labelFits(s.shortText, s.cents, total, width) ? 'short' : 'none';
          expect(s.display).toBe(expected);
        }
      }
    }
  });

  it('ningún texto lleva importes y el tipo de IVA sale del cliente', () => {
    for (const s of buildChartModel(quoteFor(51)).segments) {
      expect(s.fullText + s.shortText).not.toMatch(/EUR|,\d\d/);
    }
    const pt = buildChartModel(quoteFor(10, 'PT')).segments.find((s) => s.key === 'vat');
    expect(pt?.name).toBe(nb(`IVA ${String(quoteFor(10, 'PT').vatRatePercent)} %`));
  });
});

describe('labelFits', () => {
  it('es exacta en el límite: 20 caracteres necesitan 160 px', () => {
    const label = 'x'.repeat(20);
    expect(labelFits(label, 160, 1000, 1000)).toBe(true);
    expect(labelFits(label, 159, 1000, 1000)).toBe(false);
  });
});
