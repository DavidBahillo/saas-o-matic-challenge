// Rutas (V1) y marco de la aplicación: header + contenido. En presentación solo queda la barra mínima: divisa, aviso y salir (RF30).
import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { Route, Routes } from 'react-router';
import { CustomerDetailPage } from './customers/CustomerDetailPage';
import { CustomersPage } from './customers/CustomersPage';
import { EditCustomerPage } from './customers/EditCustomerPage';
import { NewCustomerPage } from './customers/NewCustomerPage';
import { NotFoundPage } from './customers/NotFoundPage';
import { CurrencyNotice } from './layout/CurrencyNotice';
import { CurrencySelect } from './layout/CurrencySelect';
import { Header } from './layout/Header';
import { CurrencyProvider } from './state/currency-context';
import { Button } from './ui/Button';
import { LiveRegion } from './ui/LiveRegion';
import { PresentationProvider, usePresentation } from './state/presentation-context';

/** El ancla sola no mueve el foco dentro de una SPA con router: se lo damos a <main>. */
function focusContent(event: MouseEvent<HTMLAnchorElement>): void {
  event.preventDefault();
  document.getElementById('contenido')?.focus();
}

/** Foco al botón equivalente y anuncio estable al entrar o salir de la presentación (RF47); no actúa en el primer render. */
function usePresentationAnnouncement(active: boolean, consumeSilent: () => boolean): string {
  const [message, setMessage] = useState('');
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // Una salida por navegación (desmontar el detalle) no roba el foco ni se anuncia: solo cuando el usuario alterna.
    if (consumeSilent()) return;
    document.querySelector<HTMLElement>('[data-presentation-toggle]')?.focus();
    setMessage(active ? 'Modo presentación activado' : 'Modo presentación desactivado');
  }, [active, consumeSilent]);
  return message;
}

function Shell() {
  const { active, toggle, consumeSilent } = usePresentation();
  const announcement = usePresentationAnnouncement(active, consumeSilent);
  return (
    <>
      <LiveRegion message={announcement} />
      <a href="#contenido" className="skip-link" onClick={focusContent}>
        Saltar al contenido
      </a>
      {active ? (
        <>
          <div className="presentation-bar">
            <CurrencySelect />
            <Button data-presentation-toggle onClick={toggle}>
              Salir de la presentación
            </Button>
          </div>
          <CurrencyNotice />
        </>
      ) : (
        <Header />
      )}
      <main id="contenido" tabIndex={-1} className={active ? 'content content--presentation' : 'content'}>
        <Routes>
          <Route path="/" element={<CustomersPage />} />
          <Route path="/customers/new" element={<NewCustomerPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/customers/:id/edit" element={<EditCustomerPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  );
}

export function App() {
  return (
    <CurrencyProvider>
      <PresentationProvider>
        <Shell />
      </PresentationProvider>
    </CurrencyProvider>
  );
}
