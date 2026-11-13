// Ruta desconocida (V1, D-P17).
import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <section className="state">
      <h1>No encontrado</h1>
      <p>La página que buscas no existe.</p>
      <Link to="/" className="btn btn--primary">
        Volver al inicio
      </Link>
    </section>
  );
}
