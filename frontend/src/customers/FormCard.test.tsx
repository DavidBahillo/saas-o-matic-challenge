// RF22: tarjeta de formulario centrada solo en horizontal, con el título dentro.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormCard } from './FormCard';

describe('FormCard', () => {
  it('lleva el título como h1 y los hijos dentro de la tarjeta', () => {
    render(<FormCard title="Nuevo cliente"><button type="button">Hijo</button></FormCard>);
    const title = screen.getByRole('heading', { level: 1, name: 'Nuevo cliente' });
    const card = title.closest('.form-card') as HTMLElement;
    expect(card).toHaveClass('card');
    expect(card.closest('.form-page')).not.toBeNull();
    expect(card).toContainElement(screen.getByRole('button', { name: 'Hijo' }));
  });
});
