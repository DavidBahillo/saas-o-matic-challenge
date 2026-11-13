// Barra apilada de tramos más IVA (RF21, RF40): etiqueta de texto en cada segmento; las estrechas, bajo la barra.
import type { Quote } from '@saas-o-matic/shared';
import { buildChartModel } from './chart-model';

type ChartQuote = Pick<Quote, 'tiers' | 'baseCents' | 'vatCents' | 'totalCents'>;

export function QuoteChart({ quote }: { quote: ChartQuote }) {
  const model = buildChartModel(quote, 'EUR');
  const outside = model.segments.filter((s) => s.labelOutside);
  return (
    <figure className="chart">
      <h3>{model.title}</h3>
      <p className="muted">{model.subtitle}</p>
      <div className="stack" data-testid="stack-bar">
        {model.segments.map((s) => (
          <div key={s.key} className={`stack__seg stack__seg--${s.key}`} style={{ flexGrow: s.cents }}>
            {!s.labelOutside && <span title={s.label}>{s.label}</span>}
          </div>
        ))}
      </div>
      {outside.length > 0 && (
        <ul className="stack__outside" data-testid="stack-outside">
          {outside.map((s) => (
            <li key={s.key}>
              <span className={`stack__swatch stack__seg--${s.key}`} aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
