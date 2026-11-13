// Header (RF28): logo (enlace a /), buscador, selector de divisa e interruptor de tema.
import { Link } from 'react-router';
import { CurrencySelect } from './CurrencySelect';
import { SearchBox } from './SearchBox';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header className="header">
      <div className="header__inner">
        <Link to="/" className="logo">
          SaaS-O-Matic
        </Link>
        <SearchBox />
        <CurrencySelect />
        <ThemeToggle />
      </div>
    </header>
  );
}
