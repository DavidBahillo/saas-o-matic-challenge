// Barra apilada de tramos más IVA (RF-barra, RF41, RF14): sin importes ni leyenda. Cada segmento muestra "Tramo N" /
// "IVA 21 %", su abreviatura ("TN", "21 %") o nada, según quepa (se mide el ancho real de la barra). Los abreviados o
// sin texto son un <button aria-expanded> que alterna el Tooltip con el nombre completo (ratón, foco y toque); los completos son un div sin foco.
import type { Quote } from '@saas-o-matic/shared';
import { Tooltip } from '../ui/Tooltip';
import { useElementWidth } from './use-element-width';
import { buildChartModel, DEFAULT_BAR_WIDTH_PX } from './chart-model';
import type { ChartSegment } from './chart-model';

type ChartQuote = Pick<Quote, 'tiers' | 'baseCents' | 'vatCents' | 'totalCents' | 'vatRatePercent'>;

/** Estructura estable (RF50): el Tooltip siempre está; solo cambia el interior, y el botón de "abreviado" y "sin texto" es el mismo. */
function Segment({ segment }: { segment: ChartSegment }) {
  const className = `stack__seg stack__seg--${segment.key}`;
  return (
    <Tooltip
      text={segment.name}
      className="stack__item"
      style={{ flexGrow: segment.cents }}
      enabled={segment.display !== 'full'}
      describe={false}
      toggle
    >
      {segment.display === 'full' ? (
        <div className={className}>
          <span>{segment.fullText}</span>
        </div>
      ) : (
        <button type="button" className={className}>
          <span className="sr-only">{segment.name}</span>
          {segment.display === 'short' && <span aria-hidden="true">{segment.shortText}</span>}
        </button>
      )}
    </Tooltip>
  );
}

export function QuoteChart({ quote }: { quote: ChartQuote }) {
  const { ref, width } = useElementWidth<HTMLDivElement>(DEFAULT_BAR_WIDTH_PX);
  const model = buildChartModel(quote, width);
  return (
    <figure className="chart">
      <h4 className="sr-only">{model.title}</h4>
      <div className="stack" data-testid="stack-bar" ref={ref}>
        {model.segments.map((s) => (
          <Segment key={s.key} segment={s} />
        ))}
      </div>
    </figure>
  );
}
