// Tarjeta de los formularios de cliente (spec 010, RF22): centrada solo en horizontal, hasta 560 px, con el título dentro.
import type { ReactNode } from 'react';
import { Card } from '../ui/Card';

export function FormCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="page form-page">
      <Card className="form-card">
        <h1>{title}</h1>
        {children}
      </Card>
    </section>
  );
}
