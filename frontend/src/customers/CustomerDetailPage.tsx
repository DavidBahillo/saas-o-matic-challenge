// Detalle del cliente (RF16, RF17, RF30, RF38): datos, simulador y simulaciones guardadas.
import type { Customer } from '@saas-o-matic/shared';
import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useCustomer, useCustomerSimulations } from '../api/customers.queries';
import { ApiError, generalMessage } from '../api/errors';
import { formatDateTime } from '../lib/format-date';
import { simulationsLabel } from '../lib/pluralize';
import { Simulator } from '../simulator/Simulator';
import { useCurrency } from '../state/currency-context';
import { usePresentation, usePresentationHotkeys } from '../state/presentation-context';
import { useCurrencyPreselection } from '../state/use-currency-preselection';
import { Button } from '../ui/Button';
import { CountryFlag } from '../ui/CountryFlag';
import { EmptyState, ErrorState, Skeleton } from '../ui/States';
import { SimulationList } from './SimulationList';

/** 404 CUSTOMER_NOT_FOUND o 400 INVALID_ID: el cliente no existe (RF17). */
function isNotFound(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.kind !== 'api') return false;
  return error.status === 404 || (error.status === 400 && error.fields.some((f) => f.code === 'INVALID_ID'));
}

function NotFound() {
  return (
    <section className="state">
      <h1>Cliente no encontrado</h1>
      <Link to="/" className="btn btn--primary">
        Volver a la lista
      </Link>
    </section>
  );
}

function CustomerData({ customer }: { customer: Customer }) {
  return (
    <section className="card customer-data" aria-label="Datos del cliente">
      <p>
        <CountryFlag code={customer.country} /> <span className="tabular">{customer.taxId}</span>
      </p>
      <p className="muted">{customer.email}</p>
      <p>
        <span className="chip">{customer.plan}</span>{' '}
        <span className="muted">{simulationsLabel(customer.simulationCount)}</span>
      </p>
      <p className="muted">{`Alta: ${formatDateTime(customer.createdAt)}`}</p>
    </section>
  );
}

function Simulations({ id, onCreateFirst }: { id: string; onCreateFirst: () => void }) {
  const query = useCustomerSimulations(id);
  if (query.isPending) return <Skeleton lines={2} label="Cargando simulaciones…" />;
  if (query.isError) return <ErrorState message={generalMessage(query.error)} onRetry={() => void query.refetch()} />;
  if (query.data.items.length > 0) return <SimulationList items={query.data.items} />;
  const action = (
    <Button variant="primary" onClick={onCreateFirst}>
      Crear la primera simulación
    </Button>
  );
  return <EmptyState title="Este cliente aún no tiene simulaciones." action={action} />;
}

/** Detalle ya cargado: espera la preselección de divisa antes de pintar el simulador (RF14). */
function VisitBody({ customer, id }: { customer: Customer; id: string }) {
  const { active, toggle } = usePresentation();
  const simulatorRef = useRef<HTMLDivElement>(null);
  const ready = useCurrencyPreselection(customer.country);
  if (!ready) return <Skeleton lines={3} label="Cargando tipos de cambio…" />;
  return (
    <div className="page">
      <div className="page__head">
        <h1>{customer.companyName}</h1>
        <Button onClick={toggle}>{active ? 'Salir de la presentación' : 'Modo presentación'}</Button>
      </div>
      {!active && <CustomerData customer={customer} />}
      <div ref={simulatorRef}>
        <Simulator key={customer.id} customer={customer} />
      </div>
      {!active && (
        <section aria-labelledby="saved-title">
          <h2 id="saved-title">Simulaciones guardadas</h2>
          <Simulations id={id} onCreateFirst={() => simulatorRef.current?.querySelector('input')?.focus()} />
        </section>
      )}
    </div>
  );
}

/** Una visita por cliente y entrada (RF15): `key={id}` reinicia la preselección. */
function CustomerVisit({ id }: { id: string }) {
  const query = useCustomer(id);
  const { beginVisit } = useCurrency();
  usePresentationHotkeys();
  // Antes que cualquier efecto de los hijos: solo borra una marca (ref), no cambia estado.
  useState(beginVisit);

  if (query.isPending) return <Skeleton lines={3} label="Cargando cliente…" />;
  if (query.isError) {
    if (isNotFound(query.error)) return <NotFound />;
    return <ErrorState message={generalMessage(query.error)} onRetry={() => void query.refetch()} />;
  }
  return <VisitBody customer={query.data} id={id} />;
}

export function CustomerDetailPage() {
  const { id = '' } = useParams();
  return <CustomerVisit key={id} id={id} />;
}
