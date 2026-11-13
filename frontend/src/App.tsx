// Rutas (V1) y marco de la aplicación: header + contenido. En presentación solo queda el selector de divisa (RF30).
import { Route, Routes } from 'react-router';
import { CustomerDetailPage } from './customers/CustomerDetailPage';
import { CustomersPage } from './customers/CustomersPage';
import { NewCustomerPage } from './customers/NewCustomerPage';
import { NotFoundPage } from './customers/NotFoundPage';
import { CurrencySelect } from './layout/CurrencySelect';
import { Header } from './layout/Header';
import { CurrencyProvider } from './state/currency-context';
import { PresentationProvider, usePresentation } from './state/presentation-context';

function Shell() {
  const { active } = usePresentation();
  return (
    <>
      {active ? (
        <div className="presentation-bar">
          <CurrencySelect />
        </div>
      ) : (
        <Header />
      )}
      <main className={active ? 'content content--presentation' : 'content'}>
        <Routes>
          <Route path="/" element={<CustomersPage />} />
          <Route path="/customers/new" element={<NewCustomerPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
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
