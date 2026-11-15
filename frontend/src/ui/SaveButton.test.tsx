// RF24, RF25: botón "Guardar" con icono; "Guardando…" sin icono; aria-label opcional y aria-disabled conservado.
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SaveButton } from './SaveButton';

describe('SaveButton', () => {
  it('muestra "Guardar" con un icono decorativo', () => {
    const { container } = render(<SaveButton pending={false} />);
    const button = screen.getByRole('button', { name: 'Guardar' });
    expect(button).toHaveClass('btn--primary');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('pendiente: "Guardando…", deshabilitado y sin icono', () => {
    const { container } = render(<SaveButton pending disabled />);
    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled();
    expect(container.querySelector('svg')).toBeNull();
  });

  it('ariaLabel solo se aplica si se pasa', () => {
    const { rerender } = render(<SaveButton pending={false} ariaLabel="Guardar simulación" />);
    expect(screen.getByRole('button', { name: 'Guardar simulación' })).toHaveAttribute('aria-label', 'Guardar simulación');
    rerender(<SaveButton pending={false} />);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-label');
  });

  it('conserva aria-disabled, el foco y el manejador de clic', () => {
    const onClick = vi.fn();
    render(<SaveButton pending={false} aria-disabled onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Guardar' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
