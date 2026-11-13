import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFakeClock, useRealClock } from '../test/fake-timers';
import { Badge } from './Badge';
import { Field } from './Field';
import { LiveRegion } from './LiveRegion';
import { EmptyState, ErrorState, Skeleton } from './States';

beforeEach(useFakeClock);
afterEach(useRealClock);

const live = (): HTMLElement => {
  const region = document.querySelector<HTMLElement>('[aria-live="polite"]');
  if (region === null) throw new Error('sin región aria-live');
  return region;
};

describe('LiveRegion (V7, RF33)', () => {
  it('anuncia el mensaje tras 500 ms de calma', () => {
    render(<LiveRegion message="Guardado" />);
    expect(live()).toBeEmptyDOMElement();
    act(() => void vi.advanceTimersByTime(499));
    expect(live()).toBeEmptyDOMElement();
    act(() => void vi.advanceTimersByTime(1));
    expect(live()).toHaveTextContent('Guardado');
  });

  it('un cambio de mensaje reinicia la espera', () => {
    const { rerender } = render(<LiveRegion message="uno" />);
    act(() => void vi.advanceTimersByTime(400));
    rerender(<LiveRegion message="dos" />);
    act(() => void vi.advanceTimersByTime(400));
    expect(live()).toBeEmptyDOMElement();
    act(() => void vi.advanceTimersByTime(100));
    expect(live()).toHaveTextContent('dos');
  });
});

describe('estados reutilizables (principio 8)', () => {
  it('Skeleton dibuja bloques ocultos y anuncia la carga', () => {
    render(<Skeleton lines={2} label="Cargando clientes…" />);
    expect(screen.getByTestId('skeleton').querySelectorAll('.skeleton')).toHaveLength(2);
    act(() => void vi.advanceTimersByTime(500));
    expect(live()).toHaveTextContent('Cargando clientes…');
  });

  it('ErrorState muestra el mensaje y "Reintentar" llama a onRetry', async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="No se pudo cargar." onRetry={onRetry} />);
    expect(screen.getByText('No se pudo cargar.')).toBeVisible();
    await userEvent.setup({ delay: null }).click(
      screen.getByRole('button', { name: 'Reintentar' }),
    );
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('EmptyState muestra el título y la llamada a la acción', () => {
    render(<EmptyState title="Sin clientes" action={<a href="/customers/new">Dar de alta un cliente</a>} />);
    expect(screen.getByText('Sin clientes')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Dar de alta un cliente' })).toBeVisible();
  });
});

describe('Field y Badge (RF33)', () => {
  it('asocia el error al control con aria-describedby y aria-invalid', () => {
    render(
      <Field label="Email" errors={['Email no válido.']}>
        {(control) => <input {...control} />}
      </Field>,
    );
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Email no válido.');
  });

  it('sin errores no hay aria-describedby', () => {
    render(<Field label="Email">{(control) => <input {...control} />}</Field>);
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-describedby');
  });

  it('Badge muestra su texto', () => {
    render(<Badge tone="warning">Aviso</Badge>);
    expect(screen.getByText('Aviso')).toHaveClass('badge--warning');
  });
});
