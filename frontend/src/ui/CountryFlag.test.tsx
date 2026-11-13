// RF18 a RF21: bandera con código visible, alt en español y respaldo solo por el evento error.
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CountryFlag } from './CountryFlag';

describe('CountryFlag', () => {
  it('ES: URL, srcset, tamaño, lazy, alt y código visible', () => {
    render(<CountryFlag code="ES" />);
    const img = screen.getByRole('img', { name: 'España' });
    expect(img).toHaveAttribute('src', 'https://flagcdn.com/w20/es.png');
    expect(img).toHaveAttribute('srcset', 'https://flagcdn.com/w40/es.png 2x');
    expect(img).toHaveAttribute('width', '20');
    expect(img).toHaveAttribute('height', '15');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(screen.getByText('ES')).toBeVisible();
  });

  it('GB: alt Reino Unido', () => {
    render(<CountryFlag code="GB" />);
    expect(screen.getByRole('img', { name: 'Reino Unido' })).toBeVisible();
  });

  it('XK: alt no vacío', () => {
    render(<CountryFlag code="XK" />);
    expect(screen.getByRole('img').getAttribute('alt')).not.toBe('');
  });

  it('el evento error deja solo el código, sin imagen', () => {
    render(<CountryFlag code="ES" />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('ES')).toBeVisible();
  });

  it('si cambia el código tras un error, se vuelve a intentar la imagen', () => {
    const { rerender } = render(<CountryFlag code="ES" />);
    fireEvent.error(screen.getByRole('img'));
    rerender(<CountryFlag code="FR" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://flagcdn.com/w20/fr.png');
  });

  it('sin error no hay respaldo por temporizador', () => {
    vi.useFakeTimers();
    try {
      render(<CountryFlag code="ES" />);
      vi.advanceTimersByTime(60_000);
      expect(screen.getByRole('img')).toBeVisible();
    } finally {
      vi.useRealTimers();
    }
  });

  it.each(['es', 'E1', ''])('código "%s": sin imagen ni petición, solo texto', (code) => {
    const { container } = render(<CountryFlag code={code} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container).toHaveTextContent(code);
  });
});
