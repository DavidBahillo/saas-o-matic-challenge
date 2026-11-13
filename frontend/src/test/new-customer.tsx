// Ayudas para probar el alta de cliente.
import { screen } from '@testing-library/react';
import { apiError } from './fixtures';
import type { MockReply } from './mock-fetch';
import { renderApp } from './render';
import type { RenderAppOptions } from './render';

export const control = (name: string) => screen.getByLabelText(name);
export const submit = () => screen.getByRole('button', { name: 'Crear cliente' });
export const validation = (...fields: unknown[]): MockReply =>
  apiError(400, 'VALIDATION_ERROR', 'Datos no válidos.', { fields });
export const field = (name: string, code: string, message: string, extra: object = {}) => ({
  field: name,
  code,
  message,
  ...extra,
});

export function renderForm(post: RenderAppOptions['routes'] = {}) {
  return renderApp({ route: '/customers/new', routes: { ...post } });
}

export async function fillValid(user: ReturnType<typeof renderApp>['user']) {
  await user.type(control('Empresa'), 'Acme Ibérica SL');
  await user.selectOptions(control('País'), 'ES');
  await user.type(control('Identificador fiscal'), 'b-12.345.674');
  await user.type(control('Email'), 'compras@acme.es');
  await user.selectOptions(control('Plan'), 'growth');
}
