// RF2, RF6: selector de páginas, anterior/siguiente deshabilitados en los extremos y rango visible.
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Pagination } from './Pagination';

function setup(page: number, total: number, q = '') {
  render(
    <MemoryRouter>
      <Pagination q={q} page={page} pageSize={20} total={total} />
    </MemoryRouter>,
  );
}

const nav = () => screen.getByRole('navigation', { name: 'Paginación' });

describe('Pagination', () => {
  it('no se pinta con 0 clientes ni con una sola página', () => {
    setup(1, 0);
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('una sola página (20 clientes) tampoco', () => {
    setup(1, 20);
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.queryByText(/Mostrando/)).toBeNull();
  });

  it('con 21 clientes hay dos páginas y el rango de la primera', () => {
    setup(1, 21);
    expect(screen.getByText('Mostrando 1-20 de 21')).toBeVisible();
    expect(within(nav()).getByRole('link', { name: '2' })).toHaveAttribute('href', '/?page=2');
  });

  it('en la primera, "Anterior" está deshabilitado y "Siguiente" enlaza a la 2', () => {
    setup(1, 230);
    expect(screen.getByText('Anterior')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByRole('link', { name: 'Anterior' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Siguiente' })).toHaveAttribute('href', '/?page=2');
  });

  it('en la última, "Siguiente" está deshabilitado y "Anterior" enlaza a la anterior', () => {
    setup(12, 230);
    expect(screen.getByText('Siguiente')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('link', { name: 'Anterior' })).toHaveAttribute('href', '/?page=11');
    expect(screen.getByText('Mostrando 221-230 de 230')).toBeVisible();
  });

  it('la página actual lleva aria-current, la primera enlaza sin page y q se conserva', () => {
    setup(2, 230, 'ac');
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '1' })).toHaveAttribute('href', '/?q=ac');
    expect(screen.getByRole('link', { name: '3' })).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Mostrando 21-40 de 230')).toBeVisible();
  });

  it('con muchas páginas usa elipsis (…) ocultas a lectores', () => {
    setup(6, 600);
    const gaps = within(nav()).getAllByText('…');
    expect(gaps).toHaveLength(2);
    for (const gap of gaps) expect(gap).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('link', { name: '30' })).toBeVisible();
  });
});
