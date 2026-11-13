import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QuoteChart } from './QuoteChart';

describe('QuoteChart', () => {
  it('cada etiqueta dentro de un segmento lleva su texto completo como title (RF21)', () => {
    const quote = {
      tiers: [{ tier: 1 as const, from: 1, to: 10, billedUsers: 10, unitPriceCents: 1000, subtotalCents: 10000 }],
      baseCents: 10000,
      vatCents: 2100,
      totalCents: 12100,
    };
    render(<QuoteChart quote={quote} />);
    const inside = screen.getByTestId('stack-bar').querySelectorAll('span');
    expect(inside.length).toBeGreaterThan(0);
    inside.forEach((el) => { expect(el.getAttribute('title')).toBe(el.textContent); });
  });
});
