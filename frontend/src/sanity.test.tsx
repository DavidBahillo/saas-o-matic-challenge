// Prueba de humo del entorno: jsdom y los matchers de jest-dom (T2).
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('entorno de pruebas del frontend', () => {
  it('ve document y los matchers de jest-dom', () => {
    render(<p>Hola</p>);
    expect(document.body).toBeInTheDocument();
    expect(screen.getByText('Hola')).toBeVisible();
  });

  it('corre en UTC', () => {
    expect(process.env.TZ).toBe('UTC');
    expect(new Date('2026-11-13T09:00:00.000Z').getHours()).toBe(9);
  });
});
