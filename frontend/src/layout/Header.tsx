// Cabecera (RF18): marca, navegación "Clientes", selector de divisa y selector de tema. El aviso de tipos va debajo.
import { Link, useLocation } from 'react-router';
import { CurrencyNotice } from './CurrencyNotice';
import { CurrencySelect } from './CurrencySelect';
import { ThemeToggle } from './ThemeToggle';

/** Indicador en / y /customers/*; aria-current solo en / (sin indicador en la 404). */
function NavClientes() {
  const { pathname } = useLocation();
  const onList = pathname === '/';
  const active = onList || pathname === '/customers' || pathname.startsWith('/customers/');
  return (
    <nav aria-label="Principal">
      <Link
        to="/"
        className={active ? 'nav__link nav__link--active' : 'nav__link'}
        aria-current={onList ? 'page' : undefined}
      >
        Clientes
      </Link>
    </nav>
  );
}

export function Header() {
  return (
    <>
      <header className="header">
        <div className="header__inner">
          <Link to="/" className="logo" translate="no">
            SaaS-O-Matic
          </Link>
          <NavClientes />
          <div className="header__tools">
            <CurrencySelect />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <CurrencyNotice />
    </>
  );
}
