// Alta de cliente (RF12 a RF14): errores del backend.
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ACME, apiError } from '../test/fixtures';
import { control, field, renderForm, submit, validation } from '../test/new-customer';

describe('NewCustomerPage: errores del backend (RF12, RF13, RF14)', () => {
  it('NIF con letra de control incorrecta: error junto a "Identificador fiscal"', async () => {
    const { user } = renderForm({
      'POST /api/customers': validation(
        field('taxId', 'TAX_ID_INVALID_CHECKSUM', 'La letra de control no es correcta.', { taxIdType: 'DNI' }),
      ),
    });
    await user.click(submit());
    await screen.findByText('La letra de control no es correcta.');
    expect(control('Identificador fiscal')).toHaveAttribute('aria-invalid', 'true');
    expect(control('Identificador fiscal')).toHaveAccessibleDescription('La letra de control no es correcta.');
  });

  it('GB con prefijo: el reason COUNTRY_PREFIX sale traducido', async () => {
    const { user } = renderForm({
      'POST /api/customers': validation(
        field('taxId', 'TAX_ID_INVALID_FORMAT', 'Formato no válido.', { reason: 'COUNTRY_PREFIX' }),
      ),
    });
    await user.click(submit());
    expect(await screen.findByText('El identificador fiscal no debe llevar el prefijo del país.')).toBeVisible();
    expect(screen.queryByText('Formato no válido.')).toBeNull();
  });

  it('un reason fuera del mapa muestra el message del backend', async () => {
    const { user } = renderForm({
      'POST /api/customers': validation(field('taxId', 'TAX_ID_INVALID_FORMAT', 'Mensaje del backend.', { reason: 'NOT_INTEGER' })),
    });
    await user.click(submit());
    expect(await screen.findByText('Mensaje del backend.')).toBeVisible();
  });

  it('país UK: "¿Querías decir GB?" junto a País', async () => {
    const { user } = renderForm({
      'POST /api/customers': validation(
        field('country', 'INVALID_COUNTRY', '¿Querías decir GB?', { suggestion: 'GB' }),
      ),
    });
    await user.click(submit());
    await screen.findByText('¿Querías decir GB?');
    expect(control('País')).toHaveAccessibleDescription('¿Querías decir GB?');
  });

  it('email y tax ID no válidos a la vez: dos errores, cada uno en su control', async () => {
    const { user } = renderForm({
      'POST /api/customers': validation(
        field('taxId', 'TAX_ID_INVALID_CHECKSUM', 'Control incorrecto.'),
        field('email', 'INVALID_EMAIL', 'Email no válido.'),
      ),
    });
    await user.click(submit());
    await screen.findByText('Control incorrecto.');
    expect(control('Email')).toHaveAccessibleDescription('Email no válido.');
    expect(control('Identificador fiscal')).toHaveAccessibleDescription('Control incorrecto.');
  });

  it.each([
    ['UNKNOWN_FIELD', validation(field('simulationCount', 'UNKNOWN_FIELD', 'Campo desconocido.'))],
    ['MALFORMED_JSON', apiError(400, 'MALFORMED_JSON', 'El JSON no es válido.')],
    ['un field fuera de la tabla', validation(field('otro', 'INVALID_TYPE', 'Campo raro.'))],
  ])('%s: aviso general sin perder lo escrito', async (_name, reply) => {
    const { user } = renderForm({ 'POST /api/customers': reply });
    await user.type(control('Empresa'), 'Mi empresa');
    await user.click(submit());
    expect(await screen.findByRole('alert')).toBeVisible();
    expect(control('Empresa')).toHaveValue('Mi empresa');
    expect(control('Empresa')).not.toHaveAttribute('aria-invalid');
  });

  it('409: mensaje y enlace al cliente existente', async () => {
    const { user } = renderForm({
      'POST /api/customers': apiError(409, 'CUSTOMER_ALREADY_EXISTS', 'Ya existe un cliente con ese identificador.', {
        existingId: 3,
      }),
    });
    await user.click(submit());
    expect(await screen.findByText('Ya existe un cliente con ese identificador.')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Ver el cliente existente' })).toHaveAttribute('href', '/customers/3');
  });

  it('500: error general con "Reintentar", conserva lo escrito y reintenta', async () => {
    let calls = 0;
    const { user, fetchMock } = renderForm({
      'POST /api/customers': () => (++calls === 1 ? apiError(500, 'INTERNAL_ERROR', 'Fallo interno.') : { status: 201, body: ACME }),
    });
    await user.type(control('Empresa'), 'Acme');
    await user.click(submit());
    await screen.findByText('Fallo interno.');
    expect(control('Empresa')).toHaveValue('Acme');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => { expect(fetchMock.callsTo('POST /api/customers')).toHaveLength(2); });
    expect(fetchMock.callsTo('POST /api/customers')[1]?.body).toMatchObject({ companyName: 'Acme' });
  });

  it('backend caído: error general con "Reintentar" y lo escrito se conserva', async () => {
    const { user } = renderForm({ 'POST /api/customers': 'network-error' });
    await user.type(control('Email'), 'a@b.es');
    await user.click(submit());
    expect(await screen.findByText(/Algo ha salido mal/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeVisible();
    expect(control('Email')).toHaveValue('a@b.es');
  });
});

