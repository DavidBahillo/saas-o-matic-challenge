// Escalera de tramos (RF43, RF24): tres cuadrados iguales con precio y rango dentro. Si el texto no cabe en el ancho
// interior medido, se abrevia ("10 €", "51+") y el texto completo queda para lectores. Sin anuncios al mover el slider.
import type { Ref } from 'react';
import { formatMoney } from '../lib/format-money';
import { ladderAccessibleText, shortPrice } from './ladder-model';
import type { LadderStep } from './ladder-model';
import { defaultSidePx, ladderFontSizes, PADDING_PX } from './ladder-metrics';
import type { LadderFontSizes } from './ladder-metrics';
import { fitsInWidth } from './text-fit';
import { useElementWidth } from './use-element-width';

interface ItemProps { step: LadderStep; inner: number; sizes: LadderFontSizes; shortPrices: boolean; itemRef: Ref<HTMLLIElement> | undefined }

const fullPriceOf = (step: LadderStep): string => formatMoney(step.unitPriceCents, 'EUR');

function StepItem({ step, inner, sizes, shortPrices, itemRef }: ItemProps) {
  const price = shortPrices ? shortPrice(step.unitPriceCents) : fullPriceOf(step);
  const range = fitsInWidth(step.rangeFull.length, sizes.range, inner) ? step.rangeFull : step.rangeShort;
  return (
    <li
      ref={itemRef}
      className={`ladder__step ladder__step--${String(step.tier)}${step.reached ? '' : ' ladder__step--dim'}`}
    >
      <span className="sr-only">{`${ladderAccessibleText(step)}${step.reached ? '' : ' (no alcanzado)'}`}</span>
      <span className="ladder__text" aria-hidden="true">
        <b className="money">{price}</b>
        <span>{range}</span>
      </span>
    </li>
  );
}

export function TierLadder({ steps, presentation = false }: { steps: readonly LadderStep[]; presentation?: boolean }) {
  const { ref, width } = useElementWidth<HTMLLIElement>(defaultSidePx(presentation));
  const sizes = ladderFontSizes(presentation);
  const inner = width - 2 * PADDING_PX;
  // Si el precio completo de cualquier cuadrado no cabe, se abrevian los tres a la vez.
  const shortPrices = steps.some((s) => !fitsInWidth(fullPriceOf(s).length, sizes.price, inner));
  return (
    <ol className="ladder" aria-label="Precio por usuario según tramo">
      {steps.map((s, i) => (
        <StepItem key={s.tier} step={s} inner={inner} sizes={sizes} shortPrices={shortPrices} itemRef={i === 0 ? ref : undefined} />
      ))}
    </ol>
  );
}
