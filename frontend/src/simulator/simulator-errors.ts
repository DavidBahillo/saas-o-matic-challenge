// Errores de POST /simulations (RF27): cada uno junto a su control, o un aviso según el caso.
import { ApiError, generalMessage } from '../api/errors';
import { fieldErrorText } from '../customers/customer-form-errors';

export type SimulatorControl = 'users' | 'storage' | 'apiCalls' | 'currency';

export interface SimulationErrorView {
  kind: 'validation' | 'not-found' | 'rate-unavailable' | 'general';
  byControl: Partial<Record<SimulatorControl, string[]>>;
  general: string[];
}

const CONTROLS: readonly string[] = ['users', 'storage', 'apiCalls', 'currency'];

export const RATE_UNAVAILABLE_MESSAGE =
  'No se pudo obtener el tipo de cambio, así que no se ha guardado nada. Puedes reintentarlo o guardar la simulación en EUR.';

function isControl(field: string): field is SimulatorControl {
  return CONTROLS.includes(field);
}

function describeValidation(error: ApiError): SimulationErrorView {
  const byControl: SimulationErrorView['byControl'] = {};
  const general: string[] = [];
  for (const field of error.fields) {
    const text = fieldErrorText(field);
    if (isControl(field.field)) (byControl[field.field] ??= []).push(text);
    else general.push(text);
  }
  return { kind: 'validation', byControl, general: general.length === 0 && error.fields.length === 0 ? [error.message] : general };
}

export function describeSimulationError(error: unknown): SimulationErrorView {
  if (error instanceof ApiError && error.kind === 'api') {
    if (error.code === 'CUSTOMER_NOT_FOUND') return { kind: 'not-found', byControl: {}, general: [] };
    if (error.code === 'EXCHANGE_RATE_UNAVAILABLE') {
      return { kind: 'rate-unavailable', byControl: {}, general: [RATE_UNAVAILABLE_MESSAGE] };
    }
    if (error.code === 'VALIDATION_ERROR') return describeValidation(error);
  }
  return { kind: 'general', byControl: {}, general: [generalMessage(error)] };
}
