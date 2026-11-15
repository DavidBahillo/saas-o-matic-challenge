// RF11: chip de plan con color propio por plan; el nombre siempre va en texto y sin traducir.
import { PLANS } from '@saas-o-matic/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlanBadge } from './PlanBadge';

describe('PlanBadge', () => {
  it.each(PLANS)('muestra %s como texto, con su clase y sin traducir', (plan) => {
    render(<PlanBadge plan={plan} />);
    const chip = screen.getByText(plan);
    expect(chip).toHaveClass('badge', `badge--plan-${plan}`);
    expect(chip).toHaveAttribute('translate', 'no');
  });
});
