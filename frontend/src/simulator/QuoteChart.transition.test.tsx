// RF19, RF28: la barra anima la entrada y salida de segmentos; la decisión de texto usa el ancho final.
import { calculateQuote } from '@saas-o-matic/shared';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFakeClock, useRealClock } from '../test/fake-timers';
import { QuoteChart } from './QuoteChart';

const NB = String.fromCharCode(0xa0);
const quoteFor = (users: number) => {
  const result = calculateQuote({ users, country: 'ES' });
  if (!result.ok) throw new Error('cálculo no válido');
  return result.value;
};
const bar = () => screen.getByTestId('stack-bar');
const items = () => Array.from(bar().children) as HTMLElement[];
const grow = (item: HTMLElement | undefined): string => item?.style.flexGrow ?? '';
const frames = () => { act(() => void vi.advanceTimersByTime(50)); };

class FakeObserver {
  constructor(private readonly cb: () => void) {}
  observe(): void { this.cb(); }
  disconnect(): void { /* sin efecto */ }
}
const stubMedia = (reduced: boolean) => {
  vi.stubGlobal('matchMedia', () => ({ matches: reduced, addEventListener: () => undefined, removeEventListener: () => undefined }));
};

describe('QuoteChart: transición de segmentos (RF19)', () => {
  beforeEach(() => { useFakeClock(); stubMedia(false); });
  afterEach(() => { vi.restoreAllMocks(); useRealClock(); });

  it('un tramo que entra nace con flex-grow 0, con su texto ya decidido, y crece en los fotogramas siguientes', () => {
    const { rerender } = render(<QuoteChart quote={quoteFor(10)} />);
    expect(items()).toHaveLength(2);
    rerender(<QuoteChart quote={quoteFor(11)} />);
    expect(items()).toHaveLength(3);
    expect(grow(items()[1])).toBe('0');
    expect(items()[1]).toHaveTextContent('Tramo 2');
    frames();
    expect(grow(items()[1])).toBe(String(quoteFor(11).tiers[1]?.subtotalCents));
  });

  it('un tramo que sale encoge a 0, queda inerte y sin texto, y se desmonta en transitionend', () => {
    const { rerender } = render(<QuoteChart quote={quoteFor(11)} />);
    rerender(<QuoteChart quote={quoteFor(10)} />);
    expect(items()).toHaveLength(3);
    const leaving = items()[1] as HTMLElement;
    expect(grow(leaving)).toBe('0');
    expect(leaving.querySelector('[aria-hidden="true"][inert]')).not.toBeNull();
    expect(within(leaving).queryByRole('button')).toBeNull();
    expect(leaving.textContent).toBe('');
    fireEvent.transitionEnd(bar(), { propertyName: 'flex-grow' });
    expect(items()).toHaveLength(2);
  });

  it('si no llega transitionend, se desmonta a los 350 ms', () => {
    const { rerender } = render(<QuoteChart quote={quoteFor(51)} />);
    rerender(<QuoteChart quote={quoteFor(50)} />);
    expect(items()).toHaveLength(4);
    act(() => void vi.advanceTimersByTime(349));
    expect(items()).toHaveLength(4);
    act(() => void vi.advanceTimersByTime(1));
    expect(items()).toHaveLength(3);
  });

  it('un segmento que permanece no se remonta y conserva el foco', () => {
    vi.stubGlobal('ResizeObserver', FakeObserver);
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(300);
    const { rerender } = render(<QuoteChart quote={quoteFor(10)} />);
    const vat = within(bar()).getByRole('button', { name: `IVA${NB}21${NB}%` });
    act(() => { vat.focus(); });
    rerender(<QuoteChart quote={quoteFor(11)} />);
    frames();
    const after = within(bar()).getByRole('button', { name: `IVA${NB}21${NB}%` });
    expect(after).toBe(vat);
    expect(after).toHaveFocus();
  });

  it('de 1 a 0 usuarios salen todos y de 0 a 1 entran todos', () => {
    const empty = { tiers: [], baseCents: 0, vatRatePercent: 21, vatCents: 0, totalCents: 0 };
    const { rerender } = render(<QuoteChart quote={quoteFor(1)} />);
    rerender(<QuoteChart quote={empty} />);
    expect(items().map(grow)).toEqual(['0', '0']);
    act(() => void vi.advanceTimersByTime(350));
    expect(items()).toHaveLength(0);
    rerender(<QuoteChart quote={quoteFor(1)} />);
    expect(items().map(grow)).toEqual(['0', '0']);
    frames();
    expect(items().every((i) => grow(i) !== '0')).toBe(true);
  });
});

describe('QuoteChart con movimiento reducido (RF28)', () => {
  beforeEach(() => { useFakeClock(); stubMedia(true); });
  afterEach(() => { vi.restoreAllMocks(); useRealClock(); });

  it('los segmentos entran con su valor final y los que salen desaparecen al instante', () => {
    const { rerender } = render(<QuoteChart quote={quoteFor(10)} />);
    rerender(<QuoteChart quote={quoteFor(11)} />);
    expect(grow(items()[1])).toBe(String(quoteFor(11).tiers[1]?.subtotalCents));
    rerender(<QuoteChart quote={quoteFor(10)} />);
    expect(items()).toHaveLength(2);
  });
});
