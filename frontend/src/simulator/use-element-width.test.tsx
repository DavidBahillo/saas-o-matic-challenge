// RF51: el ancho se mide antes del primer pintado y con clientWidth (sin el borde).
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useElementWidth } from './use-element-width';

function Probe() {
  const { ref, width } = useElementWidth<HTMLDivElement>(480);
  return <div ref={ref} data-testid="probe">{width}</div>;
}

afterEach(() => { vi.restoreAllMocks(); });

describe('useElementWidth', () => {
  it('sin medida (jsdom) devuelve el ancho por defecto', () => {
    render(<Probe />);
    expect(screen.getByTestId('probe')).toHaveTextContent('480');
  });

  it('mide clientWidth ya en el primer render, sin esperar a un observador', () => {
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(310);
    render(<Probe />);
    expect(screen.getByTestId('probe')).toHaveTextContent('310');
  });
});
