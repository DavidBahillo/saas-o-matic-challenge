// Paginación de la lista (RF2, RF6): anterior/siguiente, selector con elipsis y rango visible. No se pinta con una página o ninguna.
import { lastPage, pageRange, pageWindow } from '@saas-o-matic/shared';
import { Link } from 'react-router';
import { listUrl } from './list-url';

export interface PaginationProps {
  q: string;
  page: number;
  pageSize: number;
  total: number;
}

function Step({ label, target, q }: { label: string; target: number | undefined; q: string }) {
  if (target === undefined) {
    return (
      <span className="pagination__link pagination__link--step" aria-disabled="true">
        {label}
      </span>
    );
  }
  return (
    <Link className="pagination__link pagination__link--step" to={listUrl(q, target)}>
      {label}
    </Link>
  );
}

export function Pagination({ q, page, pageSize, total }: PaginationProps) {
  const last = lastPage(total, pageSize);
  if (last <= 1) return null;
  const { from, to } = pageRange(page, pageSize, total);
  return (
    <nav className="pagination" aria-label="Paginación">
      <p className="muted pagination__range">{`Mostrando ${String(from)}-${String(to)} de ${String(total)}`}</p>
      <ul className="pagination__list">
        <li>
          <Step label="Anterior" target={page > 1 ? page - 1 : undefined} q={q} />
        </li>
        {pageWindow(page, last).map((item) =>
          typeof item === 'number' ? (
            <li key={item}>
              <Link
                className="pagination__link"
                to={listUrl(q, item)}
                aria-current={item === page ? 'page' : undefined}
              >
                {item}
              </Link>
            </li>
          ) : (
            <li key={item} className="pagination__gap" aria-hidden="true">
              …
            </li>
          ),
        )}
        <li>
          <Step label="Siguiente" target={page < last ? page + 1 : undefined} q={q} />
        </li>
      </ul>
    </nav>
  );
}
