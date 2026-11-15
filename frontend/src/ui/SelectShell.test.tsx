// RF12, RF24: contenedor del chevron de los select; no añade semántica ni cambia el control.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SelectShell } from './SelectShell';

describe('SelectShell', () => {
  it('envuelve el select hijo sin atributos aria ni roles propios', () => {
    const { container } = render(
      <SelectShell>
        <select aria-label="País" className="input"><option>ES</option></select>
      </SelectShell>,
    );
    const shell = container.firstElementChild as HTMLElement;
    expect(shell).toHaveClass('select-shell');
    expect(shell.getAttributeNames().sort()).toEqual(['class']);
    expect(shell).toContainElement(screen.getByRole('combobox', { name: 'País' }));
  });
});
