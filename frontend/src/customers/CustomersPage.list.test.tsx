// RF55, RF56: roles explícitos, "Alta" como texto real, contador con el total y nota "Mostrando N de M".
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ACME, customerList, makeCustomer } from '../test/fixtures';
import { renderApp } from '../test/render';

describe('lista de clientes: semántica (RF55)', () => {
  it('tabla, grupos de filas, filas, cabeceras y celdas con roles explícitos', async () => {
    renderApp({ routes: { 'GET /api/customers': customerList([ACME]) } });
    const table = await screen.findByRole('table', { name: 'Clientes' });
    expect(table).toHaveAttribute('role', 'table');
    const groups = within(table).getAllByRole('rowgroup');
    expect(groups.map((g) => g.tagName)).toEqual(['THEAD', 'TBODY']);
    for (const header of within(table).getAllByRole('columnheader')) expect(header).toHaveAttribute('role', 'columnheader');
    for (const row of within(table).getAllByRole('row')) expect(row).toHaveAttribute('role', 'row');
    for (const cell of within(table).getAllByRole('cell')) expect(cell).toHaveAttribute('role', 'cell');
  });

  it('"Alta" es texto real de la celda de fecha (oculto en escritorio por CSS), no un pseudoelemento', async () => {
    renderApp({ routes: { 'GET /api/customers': customerList([ACME]) } });
    const link = await screen.findByRole('link', { name: 'Acme Ibérica SL' });
    const label = (link.closest('tr') as HTMLElement).querySelector('.customer-row__since-label');
    expect(label?.textContent).toBe('Alta ');
  });
});

describe('lista de clientes: contador (RF56)', () => {
  it('con más resultados que filas, el contador muestra el total y la nota las filas', async () => {
    const items = Array.from({ length: 50 }, (_, i) => makeCustomer({ id: i + 1, companyName: `Empresa ${String(i + 1)}` }));
    renderApp({ routes: { 'GET /api/customers': customerList(items, 73) } });
    expect(await screen.findByText('73 clientes')).toBeVisible();
    expect(screen.getByText('Mostrando 50 de 73')).toBeVisible();
  });

  it('sin truncado, el contador coincide con las filas', async () => {
    renderApp({ routes: { 'GET /api/customers': customerList([ACME]) } });
    expect(await screen.findByText('1 cliente')).toBeVisible();
    expect(screen.queryByText(/Mostrando/)).toBeNull();
  });
});
