# SaaS-O-Matic Design System

## Overview

SaaS-O-Matic uses a calm, trustworthy design system derived from Verdana: deep navy and soft sage greens, precision tempered by warmth. It is an internal tool for the sales team to simulate and quote multi-currency SaaS subscriptions, so the system prioritizes readability of figures, accessibility and a clear hierarchy: the number of users, the price per tier and the quote come first; everything else stays quiet. The dark theme is the default; the light theme is the alternative.

## Tokens

The single source of truth. This first CSS block is identical to `frontend/src/styles/tokens.css` (a test compares them). `:root` is the dark theme; `[data-theme="light"]` overrides it. The original Verdana colors are kept for fills and borders; the `-text` tokens are the accessible variants for text. Nothing else in the frontend may write a literal color, shadow, radius or font family.

```css
/* Tokens de DESIGN.md. Único archivo del frontend con colores literales. */
:root {
  /* Tema oscuro (por defecto) */
  --color-bg: #0B1120;
  --color-surface: #151B30;
  --color-surface-2: #1E2640;
  --color-border: #2B3550;
  --color-border-control: #6B7796;
  --color-text: #D8E0F8;
  --color-text-muted: #A3AECB;
  --color-action: #487898;
  --color-action-hover: #3A6683;
  --color-on-action: #FFFFFF;
  --color-sage: #68D8A8;
  --color-on-sage: #0B1120;
  --color-sage-text: #68D8A8;
  --color-sage-text-hover: #8FE5C0;
  --color-info: #78D0F8;
  --color-info-text: #78D0F8;
  --color-success: #4ADE80;
  --color-success-text: #86EFAC;
  --color-warning: #FACC15;
  --color-warning-text: #FDE047;
  --color-error: #F87171;
  --color-error-text: #FCA5A5;
  --color-error-strong: #DC2626;
  --color-error-strong-hover: #B91C1C;
  --color-on-error-strong: #FFFFFF;
  --color-success-bg: #4ADE8024;
  --color-warning-bg: #FACC1524;
  --color-error-bg: #F8717124;
  --color-info-bg: #78D0F824;
  --color-hover: #1A2240;
  --color-active: #FFFFFF0A;
  --color-ghost-hover: #1E2640;
  --color-secondary-hover: #FFFFFF0F;
  --color-focus: #68D8A8;
  --color-focus-ring: #68D8A840;
  --color-selection: #68D8A840;
  --color-chart-1: #487898;
  --color-chart-2: #68D8A8;
  --color-chart-3: #78D0F8;
  --color-chart-vat: #A3AECB;
  --color-on-chart-1: #FFFFFF;
  --color-on-chart-2: #0B1120;
  --color-on-chart-3: #0B1120;
  --color-on-chart-vat: #0B1120;
  --color-tooltip-bg: #D8E0F8;
  --color-tooltip-text: #0B1120;

  --shadow-sm: none;
  --shadow: none;
  --shadow-md: 0 4px 16px #0000004D;
  --shadow-lg: 0 8px 32px #00000066;

  --font-head: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'Fira Code', ui-monospace, Consolas, monospace;

  --fs-display: 40px;
  --fs-h1: 32px;
  --fs-h2: 24px;
  --fs-h3: 20px;
  --fs-h4: 16px;
  --fs-body-lg: 18px;
  --fs-body: 16px;
  --fs-body-sm: 14px;
  --fs-caption: 12px;
  --fs-code: 14px;
  --fs-figure: 48px;
  --fs-total: 64px;
  --lh-display: 1.15;
  --lh-h1: 1.2;
  --lh-h2: 1.25;
  --lh-h3: 1.3;
  --lh-h4: 1.35;
  --lh-body-lg: 1.6;
  --lh-body: 1.6;
  --lh-body-sm: 1.5;
  --lh-caption: 1.4;
  --lh-code: 1.6;

  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;

  --radius-sm: 4px;
  --radius: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  color-scheme: dark;
}

[data-theme="light"] {
  /* Tema claro (Verdana) */
  --color-bg: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-surface-2: #F1F5F9;
  --color-border: #E2E8F0;
  --color-border-control: #64748B;
  --color-text: #0F172A;
  --color-text-muted: #475569;
  --color-action: #0F172A;
  --color-action-hover: #020617;
  --color-on-action: #FFFFFF;
  --color-sage: #059669;
  --color-on-sage: #0F172A;
  --color-sage-text: #047857;
  --color-sage-text-hover: #065F46;
  --color-info: #0EA5E9;
  --color-info-text: #0369A1;
  --color-success: #22C55E;
  --color-success-text: #166534;
  --color-warning: #EAB308;
  --color-warning-text: #854D0E;
  --color-error: #EF4444;
  --color-error-text: #B91C1C;
  --color-error-strong: #DC2626;
  --color-error-strong-hover: #B91C1C;
  --color-on-error-strong: #FFFFFF;
  --color-success-bg: #22C55E15;
  --color-warning-bg: #EAB30815;
  --color-error-bg: #EF444415;
  --color-info-bg: #0EA5E915;
  --color-hover: #F8FAFC;
  --color-active: #0F172A06;
  --color-ghost-hover: #F1F5F9;
  --color-secondary-hover: #0F172A0A;
  --color-focus: #047857;
  --color-focus-ring: #04785333;
  --color-selection: #05966933;
  --color-chart-1: #0F172A;
  --color-chart-2: #059669;
  --color-chart-3: #0A9BDC;
  --color-chart-vat: #475569;
  --color-on-chart-1: #FFFFFF;
  --color-on-chart-2: #0F172A;
  --color-on-chart-3: #0F172A;
  --color-on-chart-vat: #FFFFFF;
  --color-tooltip-bg: #0F172A;
  --color-tooltip-text: #F8FAFC;

  --shadow-sm: 0 1px 3px #0F172A08;
  --shadow: 0 2px 6px #0F172A0D;
  --shadow-md: 0 4px 16px #0F172A12;
  --shadow-lg: 0 8px 32px #0F172A1A;

  color-scheme: light;
}
```

## Colors

Original Verdana values (light theme), kept as fills and borders:

- **Primary Navy** (#0F172A): Primary actions, strong headers
- **Secondary Slate** (#64748B): Secondary text, borders
- **Tertiary Sage** (#059669): Links, CTAs, highlights
- **Background** (#F8FAFC): Page background
- **Surface Default** (#FFFFFF): Card backgrounds
- **Success** (#22C55E): Confirmed, valid
- **Warning** (#EAB308): Pending, caution
- **Error** (#EF4444): Errors, invalid
- **Info** (#0EA5E9): Informational

Sage (#059669) and the success and warning fills are never used as text on light surfaces; text uses `--color-sage-text` and the `--color-*-text` tokens. The destructive fill is `--color-error-strong` (white text reaches AA). Field borders use `--color-border-control` (3:1 or more), not `--color-border`.

## Typography

- **Headline Font**: Plus Jakarta Sans
- **Body Font**: DM Sans
- **Mono Font**: Fira Code

- **Display**: Plus Jakarta Sans 40px bold, 1.15 line height
- **H1**: Plus Jakarta Sans 32px bold, 1.2 line height
- **H2**: Plus Jakarta Sans 24px semibold, 1.25 line height
- **H3**: Plus Jakarta Sans 20px semibold, 1.3 line height
- **H4**: Plus Jakarta Sans 16px medium, 1.35 line height
- **Body LG**: DM Sans 18px regular, 1.6 line height
- **Body**: DM Sans 16px regular, 1.6 line height
- **Body SM**: DM Sans 14px regular, 1.5 line height
- **Caption**: DM Sans 12px medium, 1.4 line height
- **Code**: Fira Code 14px regular, 1.6 line height
- **Figure**: Fira Code 600, 48px, line height 1 (number of users). **Total**: Fira Code 600, 64px, line height 1 (quote total, shrinks with the sheet width down to 28px).

Amounts, exchange rates, percentages, tax IDs and counts use Fira Code with tabular numerals. Dates, names, emails and texts use DM Sans. Fonts load from Google Fonts with `display=swap`; the fallback is `system-ui` and a system monospace.

---

## Spacing

Base unit: **8px**
- **xs**: 4px — Inline icon gaps
- **sm**: 8px — Tight component padding
- **md**: 16px — Default padding
- **lg**: 24px — Card padding
- **xl**: 32px — Section gaps
- **2xl**: 48px — Layout sections
- **3xl**: 64px — Page-level spacing

Only these tokens (and the component paddings below: 6, 10, 14, 22 and 28px) are allowed in `padding`, `margin` and `gap`. 12px is not part of the scale.

## Border Radius

- **sm** (4px): Chips, small tags
- **DEFAULT** (8px): Buttons, cards, inputs
- **md** (12px): Modals, dropdown panels
- **lg** (16px): Large containers, the quote sheet
- **full** (9999px): Avatars, status indicators

## Elevation

Gentle, diffused shadows in the light theme. In the dark theme depth comes from lightness (a surface lighter than the background) and a border, not from shadows.
- **sm**: 1px offset, 3px blur, #0F172A at 3%. Buttons, chips.
- **DEFAULT**: 2px offset, 6px blur, #0F172A at 5%. Cards, dropdowns.
- **md**: 4px offset, 16px blur, #0F172A at 7%. Elevated cards.
- **lg**: 8px offset, 32px blur, #0F172A at 10%. Modals, panels.

## Components

### Buttons
#### Variants
- **Primary**: `--color-action` fill, `--color-on-action` text, no border, `--color-action-hover` on hover.
- **Secondary**: transparent fill, `--color-text` text, 1px `--color-border-control` border, `--color-secondary-hover` on hover.
- **Ghost**: transparent fill, `--color-text-muted` text, no border, `--color-ghost-hover` on hover.
- **Destructive**: `--color-error-strong` fill, `--color-on-error-strong` text, no border, `--color-error-strong-hover` on hover.
#### Sizes
Sizes: sm (6px 14px, 14px, 32px), md (10px 22px, 14px, 44px), lg (12px 28px, 16px, 48px).
#### Disabled State
0.4 opacity.
- disabled cursor
- All hover and focus states suppressed (a native disabled element); an `aria-disabled` element keeps its focus ring
---

### Cards
- **Default**: surface fill, 1px `--color-border` border, no shadow, 8px radius.
- **Elevated**: surface fill, no border, md shadow (surface and border in the dark theme), 8px radius.
- 24px padding. Optional header bar (strip with `--color-action` fill and `--color-on-action` text) for category labels.
---

### Inputs
- **Default**: 1px `--color-border-control` border, surface fill, no shadow.
- **Hover**: 1px `--color-text` border.
- **Focus**: 2px `--color-focus` border, 3px ring `--color-focus-ring`.
- **Error**: 2px `--color-error` border, text `--color-error-text` with an icon prefix (never color alone).
- **Disabled**: 1px `--color-border` border, `--color-surface-2` fill, 40% opacity.
- Height 44px | Padding 10px 14px | Radius 8px | text 16px; label DM Sans 14px/500 with 6px bottom margin; helper text 12px `--color-text-muted`; error text 12px `--color-error-text`.
---

### Chips
- **Neutral** (plan, currency): surface-2 fill, `--color-text` text, 1px `--color-border` border.
- **Success / Warning / Error / Info**: `--color-*-bg` fill, `--color-*-text` text, no border.
- Padding 4px 12px | Radius 4px | Font 12px/500, uppercase by CSS only (the DOM text is unchanged), tracking 0.5px.
---

### Lists
Row height 48px minimum (customers: 64px), padding 8px 16px, 1px `--color-border` divider, `--color-hover` on hover (with a visible border), `--color-active` when pressed. Label DM Sans 16px/400, description 14px/400 `--color-text-muted`.
---

### Checkboxes
18px x 18px | Radius 4px. Unchecked: border 1.5px `--color-border-control`, surface background. Checked: `--color-action` background, `--color-on-action` checkmark. Indeterminate: same fill with a dash. Disabled: 40% opacity. Label spacing 8px.
---

### Radio Buttons
18px x 18px, circle. Unchecked: border 1.5px `--color-border-control`. Selected: border 2px `--color-action`, inner dot 8px `--color-action`. Disabled: 40% opacity. Label spacing 8px.
---

### Tooltips
`--color-tooltip-bg` background, `--color-tooltip-text` text, DM Sans 12px/400, padding 6px 12px, radius 8px, max width 240px, 150ms show and 0ms hide delay. `role="tooltip"` linked with `aria-describedby`; closes with Escape and stays open while the pointer is over it.
---

### Theme switch
Two always-visible icon buttons (sun for light, moon for dark), no visible text, accessible names "Tema claro" and "Tema oscuro", `aria-pressed` on the active one (filled `--color-action`) and an outlined inactive one. 44px minimum.

## Deviations from the Verdana original

- Interactive controls keep 44px minimum (md is 44px, not 42px); sm (32px) exists only as a component.
- Text fields use 16px (Body), not 14px.
- Plan chips (starter, growth, enterprise) are informational and use the neutral chip; status chips use success, warning, error and info.
- Dark theme derived from the Verdana Dark reference (approximate sampled values) with steel blue (`--color-action`) as the control color on dark surfaces.
- Links: `--color-sage-text`, 2px underline, 3px on hover, no visited style. Focus: 2px `--color-focus` outline with 2px offset.

## Screen composition

- **Header**: brand, "Clientes" navigation with a 2px sage active indicator (`aria-current="page"` only on the exact route), compact currency select labelled "Divisa", and the theme switch.
- **Customers**: H1 with the total count ("Mostrando N de M" when truncated), search and "Nuevo cliente"; dense list with column headers, rows of 64px minimum with a single link covering the row; stacked below 768px.
- **Customer detail**: header with the name on its own row and, right below, one wrapping line with flag, tax ID, email, plan chip and date; the presentation button sits at the right of the name row from 640px and under the data line below it; from 1024px two columns (5/12 configuration, 7/12 quote sheet, 48px gap), one column below with the sheet after the configuration.
- **Quote sheet**: radius 16px, titled "Presupuesto", currency chip, the total always in EUR (no VAT-included note, no rates time, no base/VAT line, no percentage subtitle), converted preview directly below the total if the currency is not EUR, tier bar (names only, no amounts: "Tramo N" / "IVA 21 %", then "TN" / "21 %", then no text; abbreviated or empty segments are focusable and show the full name in the tooltip; no legend), a centred full-width table (Base, VAT and Total labels in the "Concepto" column under the tiers, amounts in Subtotal) and a footer with the save button; sticky only from 1024 x 800px.
- **Tier ladder**: three equal squares in a row, left-aligned above the slider, 96px per side (`calc(var(--space-2xl) * 2)`, 120px in presentation capped at a third of the usable width) with `--space-sm` gaps, in the tier colours (navy, sage, info); each shows the price and the range inside; text that does not fit the inner width is abbreviated ("10 €", "51+") with the full text for screen readers; an unreached tier is dimmed with a dashed border; no legend under the slider (marks at 10 and 50 stay); the slider fill uses `--color-action`.
- **Saved simulations**: a semantic table (Usuarios, Total, Fecha, Divisa) with rows of 48px, stacked below 640px; each row has a button (`aria-expanded`, `aria-controls`) that shows or hides a row with the stored breakdown.
- **Presentation mode** (Alt+P, `event.code === 'KeyP'`; the button reads "Modo presentación (Alt+P)" with `aria-keyshortcuts`; focus moves to the opposite button and a stable `aria-live` region announces the change; Escape does not exit from a field or with an open tooltip): only the user figure, the tier ladder with the slider and the full sheet, scaled by 1.25, with a minimal bar (currency select and exit).

## Select arrow

Every `<select>` (currency, country, plan) is `appearance: none` with a filled chevron drawn in `currentColor`, its right edge `--space-md` (16px) from the field border, and a right padding of `--space-md` + `--space-lg`.

## Currency select

A native select listing the 23 currencies (EUR, USD, GBP, CHF and the rest) as code and name. Country flags come from flagcdn.com next to the ISO code; if a flag fails, only the code is shown. Border `--color-action`, focus `--color-focus`.

## Do's and Don'ts

1. **Do** use the Navy + White contrast as the primary visual rhythm; Sage green is reserved for interactive elements and positive states only.
2. **Do** lean on generous whitespace and breathing room — the interface should never feel cramped.
3. **Do** use softer radius (8px) consistently; rounded corners convey approachability and calm.
4. **Don't** introduce harsh neons or saturated accent colors — the system is calm and precise.
5. **Don't** use condensed or decorative fonts; Plus Jakarta Sans and DM Sans are chosen for legibility at all sizes.
6. **Do** use uppercase chip labels with tracking for a polished feel.
7. **Don't** overload screens with dense data; use progressive disclosure, collapsible sections and guided flows.
8. **Do** include clear iconography alongside text labels for accessibility.
9. **Don't** use heavy drop shadows; the diffused elevation system keeps the interface clean.
10. **Do** use Fira Code for amounts and figures so numerals align.

## Favicon

`public/favicon.svg` uses `--color-action` and `--color-sage` (dark and light values, switched by `prefers-color-scheme` inside the SVG, which cannot read page tokens); `favicon.test.ts` checks its colours against this file.
