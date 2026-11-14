// Ruta desconocida (V1, D-P17).
import { Link } from 'react-router';
import { useDocumentTitle } from '../layout/use-document-title';

export function NotFoundPage() {
  useDocumentTitle('Página no encontrada');
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
