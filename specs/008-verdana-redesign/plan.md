# 008 · Plan técnico
Parte de `spec.md` (aprobada) y del mockup `mockup.html` (solo referencia visual). Alcance: `frontend/`, `DESIGN.md`, `MEMORY.md` e `frontend/index.html`. No se toca `shared/`, `backend/`, rutas, controladores, servicios, repositorios, `frontend/src/lib/` ni `package.json` (sin dependencias nuevas). Los RF sin etiqueta numérica se citan por su nombre (RF-aviso, RF-barra, RF-slider, RF-selector, RF-bandera, RF-estados, RF-importes, RF-tema1 a RF-tema4).

## 1. Decisiones técnicas (con la alternativa descartada)
| # | Decisión | Alternativa descartada |
|---|---|---|
| P1 | Fuente única: el primer bloque ```css de `DESIGN.md` y `tokens.css` son idénticos; el test `design-tokens` que ya existe los compara (RF2). | Generar `tokens.css` con un script: añade un paso de build que no hace falta. |
| P2 | Contraste WCAG calculado por un test propio y sin librerías, leyendo el bloque de `DESIGN.md` (RF31). Las mezclas con alfa se hacen sobre `--color-surface`. | Una librería de contraste: dependencia nueva. |
| P3 | Tema sin parpadeo: script en línea en `<head>` de `index.html` que repite la lógica de `readTheme` (oscuro salvo `som-theme === "light"`). `main.tsx` sigue llamando a `applyTheme`. | Aplicarlo solo en `main.tsx`: llega tarde, tras el primer pintado. |
| P4 (sustituida por R3-1 a R3-3 de la ronda 3, ver sección 10) | Escalera de tramos: `<ol>` con anchuras y alturas en porcentaje (estilo en línea con enteros) calculadas por una función pura; el texto estrecho va fuera por un umbral fijo (anchura < 25 %), sin medir el DOM. | SVG o medir con `ResizeObserver`: más código y no determinista en tests. |
| P5 | Modo presentación: `--scale: 1.25` en el contenedor `workspace--presentation` y tamaños con `calc(var(--fs-*) * var(--scale))`. | `zoom` o `transform: scale`: difuminan el texto y descolocan la disposición. |
| P6 | Total de la hoja: contenedor con `container-type: inline-size` y `font-size: clamp(28px, 12cqi, calc(var(--fs-total) * var(--scale)))`, con un `clamp` en `vw` anterior como respaldo. 13 caracteres de Fira Code caben a 12 % del ancho. | Medir con JS: innecesario. |
| P7 | Lista de clientes con roles ARIA (`table`, `row`, `columnheader`, `cell`) sobre `div` y enlace estirado en el nombre; así la fila se apila en móvil sin perder semántica. | `<table>` real: el apilado móvil obliga a romper su layout. Rejilla de tarjetas: descartada por la spec. |
| P8 | `CurrencySelect` se divide en `CurrencySelect` (solo el `<select>` compacto con su `<label>` "Divisa") y `CurrencyNotice` (aviso y "Reintentar"). El texto "Tipos actualizados: HH:MM" pasa a la hoja con el mismo texto exacto (muchos tests esperan `/Tipos actualizados/`). | Dejar el pie en el selector: la spec lo traslada a la hoja. |
| P9 | La atribución se retira del todo: se elimina `ui/RatesAttribution.tsx`, sus tests, las líneas comentadas y la mención en `DESIGN.md` (CA8). No se reactiva. | Dejarla comentada: viola CA8. |
| P10 | Porcentajes del subtítulo por método del mayor resto (`splitPercentages`), sobre la base sin IVA; sustituye al "el N % del tramo mayor" actual. `halfUpPercent` se conserva (altura de la escalera). | Redondeo simple: puede sumar 99 o 101. |
| P11b (vuelta 1; sustituida por R2-1 y R2-2 de la ronda 2, ver sección 9) | Etiquetas de la barra: `labelFits` en `chart-model.ts` estima con enteros si cabe (caracteres × 7,2 px de Fira Code 12 px + 16 px de relleno frente al ancho del segmento) usando el ancho real de la barra, medido con `ResizeObserver` en `QuoteChart` (480 px si no hay medida). Si no cabe, va fuera con leyenda; nunca se trunca, por lo que se retira el tooltip de los segmentos (RF14 sin elementos no enfocables). Sustituye al umbral fijo del 12 %. | Umbral fijo: trunca entre el 12 % y el 25 %. |
| P11 | `Tooltip` propio (150 ms al mostrar, Escape, `role="tooltip"`); sustituye al `title=` de la barra. | `title` nativo: no cumple RF14. |
| P12 | "Cliente desde" y "Alta" muestran solo la fecha, con un formateador local en `customers/` (no se toca `src/lib`). | Reutilizar `formatDateTime`: incluye la hora, que el mockup no muestra. |
| P13 | El relleno de la pista del slider usa `--color-action`; el color de tramo queda solo en la escalera (decisión de la spec). | Relleno sage como el mockup: mezclaría el color de tramo con el control. |

## 2. Archivos por capa
No hay cambios en `shared/`, `routes`, `controllers`, `services` ni `repositories`. Todo el trabajo está en `frontend/`, `DESIGN.md` y `MEMORY.md`. N = nuevo, M = modificado, D = eliminado.

### Raíz y documentación
- `DESIGN.md` (M): texto descriptivo adaptado a SaaS-O-Matic; un único bloque ```css al principio con todos los tokens (Anexo A de la spec, más `--fs-figure` 48 px y `--fs-total` 64 px); desviaciones (44 px, 16 px en campos, chips de plan neutros); composición de pantallas; selector (lista con CHF y bandera de flagcdn.com), sin ExchangeRate-API. El primer bloque ```css debe ser el de tokens (el test toma el primero).
- `MEMORY.md` (M): D6 reescrita, D19 nueva (008), derogación de la atribución de 007 y de D18, aceptación de Google Fonts, estado de la 008 y pendientes de 005 y 007 cerradas. Debe seguir por debajo de 60 líneas.
- `frontend/index.html` (M): quita Inter y `data-theme="dark"` fijo; `preconnect` a `fonts.googleapis.com` y `fonts.gstatic.com`; un `<link>` `css2` con DM Sans 400;500, Fira Code 400;600, Plus Jakarta Sans 500;600;700 y `display=swap`; script en línea del tema. Sin `theme-color`.

### `frontend/src/styles/` (cada archivo por debajo de 200 líneas)
- `tokens.css` (M): copia exacta del bloque de `DESIGN.md`: `:root` (oscuro, más fuentes, escala, espaciado, radios) y `[data-theme="light"]`; `color-scheme` en cada uno. Único archivo con literales.
- `base.css` (M): reset, `body` (DM Sans 16/1.6), títulos, enlaces (RF16), `::selection`, `:focus-visible` (RF32), `sr-only`, `reduced-motion`, `forced-colors` global.
- `layout.css` (M): cabecera, navegación con indicador, contenido, barra de presentación, `content--presentation` (máx. 1440 px).
- `components.css` (M): botones (4 variantes, 3 tamaños), campos, chips, avisos, estados y esqueleto.
- `controls.css` (N): tooltip, casillas, radios, tarjeta con cabecera y selector de tema de dos iconos.
- `lists.css` (N): lista de clientes (cabecera de columnas, filas, apilado < 768 px) y filas de simulaciones guardadas.
- `workspace.css` (N): línea de contexto, rejilla 5/12 y 7/12, cifra de usuarios, escalera, explicación, `<details>` de recursos, hoja (sticky solo en ≥ 1024 × 800 px) y `--scale`.
- `simulator.css` (M): slider (WebKit y Firefox), barra, tabla y vista previa convertida.
- `main.tsx` (M): importa los archivos nuevos.

### `frontend/src/ui/`
- `Button.tsx` (M): `variant: 'primary' | 'secondary' | 'ghost' | 'destructive'` y `size: 'sm' | 'md' | 'lg'`.
- `Badge.tsx` (M): chip neutro y de estado (éxito, aviso, error, info); mayúsculas solo por CSS.
- `Field.tsx` (M): `hideLabel` opcional (etiqueta solo para lectores) y prefijo de icono en el error.
- `Card.tsx` (N): `elevated` y `header` opcionales. `Checkbox.tsx`, `Radio.tsx` (N): inputs nativos estilados con `appearance: none`. `Tooltip.tsx` (N). `icons.tsx` (N): `SunIcon`, `MoonIcon`, `ChevronIcon`, `AlertIcon`, `InfoIcon` como SVG con `currentColor` y `aria-hidden`.
- `States.tsx` (M): estilos nuevos y esqueleto estático con movimiento reducido. `CountryFlag.tsx` (M): borde de bandera, respaldo solo con ISO sin hueco y ancho de columna estable. `RatesAttribution.tsx` (D).

### `frontend/src/layout/` y `App.tsx`
- `Header.tsx` (M): marca, `<nav>` con "Clientes", `CurrencySelect`, `ThemeToggle`; `CurrencyNotice` bajo la cabecera. Sin `SearchBox`.
- `ThemeToggle.tsx` (M): `role="group"` "Tema" con dos botones (`aria-pressed`, nombres "Tema claro" y "Tema oscuro", iconos `SunIcon` y `MoonIcon`); usa `readTheme`, `writeTheme` y `applyTheme` sin cambios.
- `CurrencySelect.tsx` (M, solo el `<select>` con etiqueta "Divisa"); `CurrencyNotice.tsx` (N). `SearchBox.tsx` sin cambios de código.
- `App.tsx` (M): en presentación, barra con `CurrencySelect`, `CurrencyNotice` y el botón "Salir de la presentación" (`toggle` del contexto).

### `frontend/src/customers/`
- `CustomersPage.tsx` (M): cabecera de la lista con H1, contador, `SearchBox` y "Nuevo cliente"; lista densa. `CustomerRow.tsx` (N, sustituye a `CustomerCard.tsx`, D). `count-label.ts` (N) y `format-since.ts` (N).
- `CustomerContext.tsx` (N): línea de contexto. `CustomerDetailPage.tsx` (M): contexto, espacio de trabajo y guardadas; presentación.
- `SimulationList.tsx` (M): filas de 48 px con columnas, expandibles; `SavedQuote.tsx` (M, solo clases).
- `CustomerForm.tsx`, `CustomerFields.tsx` (M): grupos "Empresa" y "Contacto y plan" (`<fieldset>` con `<legend>`), ancho máximo de 560 px. `NewCustomerPage.tsx`, `NotFoundPage.tsx` (M, estilo).

### `frontend/src/simulator/`
- `Simulator.tsx` (M): compone `workspace` con la columna de configuración y la hoja; recibe `presentation: boolean`.
- `UsersControl.tsx` (M): título "¿Cuántos usuarios?", campo numérico con la cifra de 48 px (mantiene la etiqueta "Usuarios" con `hideLabel`), `TierLadder`, slider con marcas y `explainTiers`.
- `TierLadder.tsx` (N), `ladder-model.ts` (N), `explain-model.ts` (N).
- `ResourceFields.tsx` (M): dentro de `<details open>` "Recursos que no suman al precio"; se abre si hay error.
- `BudgetSheet.tsx` (N, sustituye a `SimulatorResult.tsx`, D): cabecera con chip de divisa, "IVA incluido" y "Tipos actualizados: HH:MM"; total, base e IVA; `ConvertedPreview` si la divisa no es EUR; `QuoteChart`; `QuoteTable`; pie con la nota y el botón "Guardar simulación".
- `QuoteChart.tsx` (M): `Tooltip` en lugar de `title`, `h3` solo para lectores. `chart-model.ts` (M): subtítulo y `splitPercentages`. `SaveSection.tsx` (M): se divide en `SaveFooter` (dentro de la hoja) y `SaveFeedback` (avisos y presupuesto guardado, bajo la hoja). `ConvertedPreview.tsx`, `SaveNotices.tsx`, `QuoteTable.tsx` (M, clases y avisos con icono).

### Tests nuevos o modificados (Vitest, junto a cada archivo)
`design-tokens.test.ts` (M), `design-contrast.test.ts` (N), `design-spacing.test.ts` (N), `index-html.test.ts` (N), `test/contrast.ts` y `test/contrast-pairs.ts` (N, ayudas sin `.test` y sin literales de color), `ui/design-components.test.tsx` (N), `layout/Header.test.tsx` (N), `layout/CurrencyNotice.test.tsx` (N), `customers/*.test.ts(x)` y `simulator/*.test.ts(x)` (ver sección 6).

## 3. Funciones puras (firmas)
```ts
// simulator/chart-model.ts
export function splitPercentages(parts: readonly number[]): number[]; // mayor resto; suma 100; [0,0] → [0,0]
export function buildChartModel(quote: ChartQuote, currency: Currency): ChartModel;
// ChartModel.subtitle: string | undefined (undefined con base 0)

// simulator/ladder-model.ts
export interface LadderStep {
  tier: 1 | 2 | 3;
  widthPct: number;      // (min(to ?? SLIDER_MAX, SLIDER_MAX) - (from - 1)) * 100 / SLIDER_MAX → 10, 40, 50
  heightPct: number;     // halfUpPercent(precio del tramo, precio máximo) → 100, 80, 50
  unitPriceCents: number;
  rangeText: string;     // "1–10", "11–50", "51 o más"
  reached: boolean;      // billedUsers > 0
  labelOutside: boolean; // widthPct < 25
}
export function buildLadder(tiers: Quote['tiers'], sliderMax: number): LadderStep[];

// simulator/explain-model.ts
export function explainTiers(tiers: Quote['tiers'], users: number): string;
// "Con 23 usuarios pagas 10 al precio del tramo 1 y 13 al del tramo 2." / "Con 0 usuarios el importe es 0." / singular con 1

// customers/count-label.ts y customers/format-since.ts
export function customersCountLabel(count: number): string;  // "0 clientes", "1 cliente", "10 clientes"
export function formatDateOnly(iso: string): string;         // "13 nov 2026", hora local del navegador

// test/contrast.ts (solo tests)
export interface Rgba { r: number; g: number; b: number; a: number }
export function parseHex(hex: string): Rgba;                 // #RGB, #RRGGBB, #RRGGBBAA
export function blendOver(fg: Rgba, bg: Rgba): Rgba;         // mezcla con alfa
export function contrastRatio(a: Rgba, b: Rgba): number;     // WCAG 2.x
export function parseTokenBlock(css: string): { dark: Record<string, string>; light: Record<string, string> };
```
Todas son puras y sin efectos. Los importes siguen en céntimos y se formatean con `formatMoney`; ninguna función nueva calcula dinero.

## 4. Contrato de la API y base de datos
Sin cambios. Ninguna petición, respuesta, esquema Zod del frontend ni tabla se modifica. La lista de clientes usa los campos que ya llegan (`companyName`, `email`, `country`, `taxId`, `plan`, `simulationCount`, `createdAt`); por eso la columna es "Alta" y no "Última simulación".

## 5. Tokens, CSS y reglas de los tests
- Colores, sombras, radios, fuentes y escala: solo del Anexo A. Tamaños nuevos `--fs-figure: 48px` y `--fs-total: 64px`.
- Espaciado: en `padding`, `margin`, `gap` e `inset` solo `var(--space-*)`, `0`, `auto`, `calc()` con tokens, o los literales `6px`, `10px`, `14px`, `22px` y `28px` de los componentes de `DESIGN.md`.
- `design-tokens.test.ts` (M) falla con: hexadecimales, `rgb/hsl/oklch/oklab/lab/lch/color-mix()`, nombres de color (lista cerrada) en propiedades de color, `box-shadow` con color literal, `border-radius` distinto de `var(--radius*)`, `0`, `50%`, `inherit`, `font-family` o `font:` con familias literales, y estilos en línea con color, fondo, borde, sombra o familia en `.tsx`. Revisa `.css`, `.tsx` y `frontend/index.html`, salvo `tokens.css`. Se ignoran `transparent`, `currentColor`, `inherit` y los colores de sistema dentro de `@media (forced-colors: active)`. Se mantienen las comprobaciones de igualdad con `DESIGN.md` y de la descripción del selector; esta última deja de exigir `ExchangeRate-API` (RF36).
- `design-contrast.test.ts` (N): recorre la lista cerrada de la spec (sección Contraste) en ambos temas. Texto: umbral 4,5. No texto: umbral 3. Pares con alfa mezclados sobre `--color-surface`. Si un valor no llega, se ajusta solo su luminosidad en `DESIGN.md` y `tokens.css`, se anota en `MEMORY.md` y no se cambia el umbral.
- `design-spacing.test.ts` (N): aplica la regla de espaciado a todos los `.css`.
- `index-html.test.ts` (N): extrae el script en línea y lo ejecuta con un `localStorage` simulado (sin valor, `light`, `dark`, valor inválido y acceso que lanza); comprueba la URL de fuentes (familias, pesos, `display=swap`, `preconnect`, sin Inter), que no hay `data-theme` fijo ni `theme-color`.
- Modo presentación: `.workspace--presentation` define `--scale: 1.25`; el contenedor `.workspace` lo define a 1. Total 64 a 80 px, cifra de usuarios 48 a 60 px, tabla 14 a 17,5 px.
- Navegación activa: el enlace "Clientes" lleva el indicador sage en `/` y `/customers/*`, con `aria-current="page"` solo en `/`. En una ruta desconocida el indicador no se muestra (matiz sobre la fila "Ruta desconocida" de la spec, que se interpreta así).

## 6. Estrategia de tests (Vitest, TDD: primero en rojo)
Cada tarea empieza escribiendo o actualizando los tests y solo después el código. Se mantiene el entorno actual (jsdom, Testing Library, `mock-fetch`, `fake-timers`).
- Unitarios puros: `splitPercentages` (suma 100 siempre; 49/51 con base 204 y tramos 100 y 104; un tramo 100; empates; 0), `buildChartModel` (subtítulo con 1, 2 y 3 tramos y sin subtítulo con 0 usuarios; umbral del 12 %), `buildLadder` (usuarios 0, 1, 10, 11, 50, 51; anchuras 10/40/50; alturas 100/80/50; `reached`; `labelOutside`), `explainTiers` (0, 1, 10, 11, 23, 50, 51), `customersCountLabel`, `formatDateOnly`, helpers de contraste (negro sobre blanco 21:1, alfa).
- Sistema: los cuatro tests de reglas (tokens, contraste, espaciado, `index.html`).
- Componentes: `ui/design-components.test.tsx` (botón con 4 variantes y 3 tamaños, deshabilitado nativo y `aria-disabled`, chip sin cambiar el texto del DOM, casilla y radio, tarjeta con cabecera, tooltip: aparece a 150 ms, `aria-describedby`, Escape, foco y ratón); `ThemeToggle.test.tsx` (dos botones, nombres, `aria-pressed`, persistencia, `data-theme`, valor inválido, pulsar el activo); `Header.test.tsx` (marca, navegación y `aria-current`, selector de tema, sin buscador); `CurrencySelect.test.tsx` y `CurrencyNotice.test.tsx` (se retiran los tests de atribución y se reparten los de aviso y reintento); `CountryFlag.test.tsx` (respaldo solo con ISO).
- Pantallas: `CustomersPage.test.tsx` (cabecera, contador 0, 1 y N, búsqueda con `?q=`, vacío y sin resultados, fila enlazada, apilado por clases); `NewCustomerPage*.test.tsx` (grupos y errores por campo sin cambios); `CustomerDetailPage*.test.tsx` (contexto, orden del DOM, `<details>` abierto por defecto y abierto con error, presentación con barra mínima y lo oculto); `Simulator.*.test.tsx` (escalera, explicación, hoja con total en EUR y vista previa debajo si la divisa no es EUR, guardar desde la hoja, avisos); `presentation.test.tsx` (la tecla P, Escape, barra con divisa y salida, tema oculto); `QuoteChart.test.tsx` (tooltip en lugar de `title`, etiquetas exteriores).
- Tests existentes que hay que ajustar por el cambio de composición (no por regresiones): `ThemeToggle.test.tsx` (nombres), `CurrencySelect.test.tsx` (pie, atribución y aviso), `CustomerDetailPage.test.tsx` línea 166 y `presentation.test.tsx` línea 66 (el buscador ya no está en la cabecera global), `chart-model.test.ts` y `Simulator.preview.test.tsx` (nuevo subtítulo), y los que busquen `.card` o `.presentation-bar`.
- Verificación manual en navegador (CA6, CA7), a cargo del reviewer con el implementer: 360, 768, 1024 y 1440 px, zoom del 200 % a 640 px, ambos temas, teclado, `forced-colors`, movimiento reducido, fuentes y banderas bloqueadas.

## 7. Cobertura de RF
| RF | Parte del plan |
|---|---|
| RF1, RF2, RF3, RF4, RF5, RF6, RF7 | T1: tokens, `DESIGN.md`, fuentes, `index.html`, tests de reglas |
| RF8, RF9, RF10, RF11, RF12, RF13, RF14, RF15, RF16 | T2: `ui/` y `controls.css`; RF16 también en `base.css` (T1) |
| RF18, RF-selector, RF-tema1 a RF-tema4, RF-aviso | T3: cabecera, selector, tema y avisos |
| RF19, RF20, RF30 (alta), RF-bandera | T4: lista, buscador, alta, 404 y banderas |
| RF21, RF22, RF23, RF24, RF25, RF26, RF27, RF28, RF29, RF-barra, RF-slider, RF-importes | T5: simulador y hoja |
| RF30 (guardadas y presentación), RF-estados, RF17 | T6: detalle, guardadas y presentación |
| RF31, RF32, RF33, RF34, RF35 | tests en T1; foco y `forced-colors` en `base.css`; revisión en T6 |
| RF36, RF37, RF38 | `DESIGN.md` en T1 y T6, `MEMORY.md` y verificación final en T6 |

## 8. Riesgos y notas
- Los valores de contraste del Anexo A están calculados a mano: el test es la autoridad y puede obligar a retocar la luminosidad de un token.
- El escalón del tramo 1 mide el 10 % del recorrido: su texto va siempre fuera (umbral 25 %); hay que verlo en el navegador.
- Muchos tests esperan el texto `/Tipos actualizados/` como señal de "tipos cargados": se conserva literal en la hoja.
- Las líneas comentadas de atribución en `CurrencySelect.tsx` desaparecen al reescribirlo (CA8); no se reactiva la atribución.
- `Quote.tiers` trae `tier`, `from`, `to`, `billedUsers`, `unitPriceCents` y `subtotalCents`; con 0 usuarios los tres tramos llegan con `billedUsers` 0 (D13).

## 9. Ronda 2 (RF39 a RF42, y cambios en RF14, RF21, RF25 y RF-barra)
Parte del código ya implementado. Todo va en una sola tarea (T7). No se toca `shared/`, `backend/` ni `src/lib/`; sin dependencias nuevas.

### Decisiones
| # | Decisión | Alternativa descartada |
|---|---|---|
| R2-1 | Texto de cada segmento en tres niveles, con `labelFits` (ya existe) aplicado en orden: nombre completo ("Tramo N", "IVA 21 %"), abreviatura ("TN", "21 %") o nada. El modelo devuelve por segmento `display: 'full' \| 'short' \| 'none'`, `fullText`, `shortText` y `name` (nombre completo accesible). El tipo de IVA sale de `quote.vatRatePercent` (se añade al `Pick` de `ChartQuote`). Sin importes en la barra. Se mantiene la medida con `ResizeObserver` (480 px por defecto); `labelFits` conserva su firma y su fórmula (⌈caracteres × 7,2⌉ + 16 px). | Umbral fijo del 12 %: ya descartado en la vuelta 1. |
| R2-2 | Se eliminan la leyenda bajo la barra (`stack__outside`, `stack__swatch`, `data-testid="stack-outside"`) y `labelOutside`. Con `display` 'short' o 'none' el segmento es enfocable (`tabIndex={0}`) y va envuelto en el `Tooltip` existente con el nombre completo; con 'full' es un `div` sin foco. Contenido accesible: el texto visible abreviado con `aria-hidden` y el nombre completo en un `sr-only`. Esto sustituye a P11b ("sin tooltip") y recupera RF14 para la barra. | Mantener la leyenda: la spec la retira. Segmentos siempre enfocables: ruido para teclado. |
| R2-3 | `Tooltip` recibe `className` y `style` opcionales para su envoltorio (compatible con los usos actuales), de modo que la envoltura es el elemento flex con `flex-grow` de los céntimos. Los segmentos pasan a una envoltura común `stack__item` (`div` o `Tooltip`) y el segmento (`stack__seg`) la rellena; los radios de los extremos y el separador de 2 px se aplican sobre `stack__item:first-child` y `:last-child`. La pista sigue sin `overflow: hidden`, para no recortar la burbuja. | Portal para la burbuja: más código, innecesario. |
| R2-4 | Centrado de la tabla en el componente compartido `QuoteTable` (hoja y simulaciones guardadas): en `simulator.css` se quitan las reglas `text-align: right` de `th` y `td`; `th`, `td` y `thead th` pasan a `text-align: center`, incluida la fila de resumen con `colSpan=3`. `.quote-table-wrap` y `.quote-table` a `width: 100%`. Se mantiene Fira Code y `tabular-nums` en los importes y el desplazamiento horizontal solo dentro del contenedor. | Un modificador solo para la hoja: la spec pide las dos tablas. |
| R2-5 | Flecha de los `<select>`: regla `select.input` en `components.css` con `appearance: none`, `padding-right: calc(var(--space-md) + var(--space-lg))` y un chevron dibujado con dos `linear-gradient` en `currentColor`, colocados con `calc(100% - var(--space-md) - …)` para que el borde derecho de la flecha quede a 16 px o más del borde. Aplica a divisa, país y plan sin cambios de marcado. Cumple el test de literales (solo tokens y `currentColor`) y el de espaciado (solo `calc` con tokens). | Chevron como `background-image` con SVG en data URI: lleva colores literales. Envoltorio con `ChevronIcon` por cada select: cambia marcado y tests en tres sitios. Solo `padding-right`: en Chromium la flecha nativa no se mueve con el relleno. Si el chevron de gradientes no se ve bien en `forced-colors`, se usa el envoltorio como respaldo. |
| R2-6 | Cabecera del detalle (RF40): `customer-context` pasa a rejilla con áreas "nombre acción" y "datos datos" desde 640 px, y en una columna (nombre, datos, acción alineada a la izquierda) por debajo. La línea de datos sigue siendo `flex-wrap` sin desplazamiento horizontal; el DOM es nombre, datos, botón. | Mantener `flex` con `margin-left: auto`: el botón queda junto a los datos, no al nombre. |

### Archivos de la ronda
- `simulator/chart-model.ts` (M): `ChartSegment` sin `label` ni `labelOutside`, con `display`, `fullText`, `shortText` y `name`; `buildChartModel(quote, currency, barWidthPx)` deja de usar `currency` para la barra (se conserva el parámetro solo si algún test o llamada lo sigue necesitando; si no, se retira).
- `simulator/QuoteChart.tsx` (M): sin leyenda, con `Segment` en tres niveles y `Tooltip`.
- `ui/Tooltip.tsx` (M): `className` y `style` opcionales del envoltorio.
- `simulator/QuoteTable.tsx` (M, solo si hace falta alguna clase) y `styles/simulator.css` (M): centrado, ancho total, `stack__item`; se eliminan `stack__outside` y `stack__swatch` (y las referencias de `base.css` en `forced-colors`).
- `styles/components.css` (M): regla `select.input`. `styles/workspace.css` (M): cabecera del detalle. `customers/CustomerContext.tsx` (M): orden del DOM y clases.
- `DESIGN.md` y `MEMORY.md` (M): se anota la barra en tres niveles con tooltip, la tabla centrada y la flecha de los selects; en `MEMORY.md` se sustituye la mención a P11b.

### Tests de la ronda (primero en rojo)
- `chart-model.test.ts`: `labelFits` conserva sus casos; nuevos para los tres niveles con anchos de 480 y 300 px y usuarios 1, 10, 11, 50 y 51 (11: "T2" o nada; 51: tramo 3 sin texto); el IVA al 21 % ("IVA 21 %" y "21 %") y sin segmento de IVA con tipo 0 %; ningún texto lleva importes.
- `QuoteChart.test.tsx`: sin `stack-outside`; segmento completo sin `tabindex`; abreviado y sin texto con `tabindex="0"`, nombre accesible completo, tooltip con el nombre completo al enfocar (con `fake-timers`, 150 ms) y cierre con Escape.
- `ui/design-components.test.tsx`: `Tooltip` acepta `className` y `style`.
- `QuoteTable` y `SavedQuote` (en los tests de simulador y detalle existentes): las celdas y las cabeceras, incluida "Concepto", llevan la clase o el estilo de centrado (comprobación del CSS por texto en `design-spacing.test.ts` o similar: ninguna regla `.quote-table` con `text-align: right`).
- `design-spacing.test.ts`: la regla `select.input` tiene `appearance: none` y un `padding-right` con `calc` y tokens.
- `CustomerDetailPage.test.tsx`: el DOM mantiene el orden nombre, datos y botón; los datos están en una sola línea contenedora.
- Verificación manual en navegador (CA11): 360, 768, 1024 y 1440 px y presentación ×1,25 (barra, tabla, cabecera del detalle y flechas de los tres selects, en ambos temas).

### Cobertura de RF de la ronda
| RF | Parte |
|---|---|
| RF14 (barra), RF41, RF-barra | R2-1, R2-2, R2-3: modelo, `QuoteChart`, `Tooltip` |
| RF42 | R2-4: `QuoteTable` y `simulator.css` |
| RF39 | R2-5: `components.css` |
| RF40, RF21 | R2-6: `CustomerContext` y `workspace.css` |
| RF25 | Sin cambios de código: la escalera conserva su leyenda bajo las marcas |
| CA11 | Tests de la ronda y verificación manual |

## 10. Ronda 3 (RF43 y RF44; RF24 modificado, RF25 retirado, RF42 matizado)
Todo va en una sola tarea (T8). No se toca `shared/`, `backend/` ni `src/lib/`; sin dependencias nuevas.

### Decisiones
| # | Decisión | Alternativa descartada |
|---|---|---|
| R3-1 | La escalera pasa a tres cuadrados de lado fijo. CSS: `.ladder` en `display: flex` con `gap: var(--space-sm)` y `margin: 0`, sin altura propia; `.ladder__step` con `flex: none`, `aspect-ratio: 1`, `width: min(calc(var(--space-2xl) * 2 * var(--scale, 1)), calc((100% - 2 * var(--space-sm)) / 3))`, relleno `var(--space-sm)` y radio `var(--radius)`. Son 96 px en modo normal (304 px con las separaciones, caben en los 328 px útiles a 360 px) y 120 px en presentación, con tope de un tercio del ancho útil (unos 104 px a 360 px). Se mantienen colores, borde discontinuo del tramo no alcanzado y las reglas de `forced-colors` de `base.css`. Se eliminan `LadderLegend`, `ladder__legend*`, `ladder__swatch` y la altura de 120 px. | Cuadrados que se estiran al ancho de la columna: no son de tamaño fijo. |
| R3-2 | `ladder-model.ts` deja de calcular `widthPct`, `heightPct`, `labelOutside` y `OUTSIDE_WIDTH_PCT` (y de importar `halfUpPercent`). `LadderStep` pasa a `{ tier, unitPriceCents, rangeFull, rangeShort, reached }`. Funciones puras nuevas: `shortPrice(cents)` ("10 €"; con céntimos distintos de 0, "10,50 €", con enteros) y `ladderAccessibleText(step)` ("Tramo 1: 10,00 EUR por usuario al mes, de 1 a 10 usuarios"; el último, "desde 51 usuarios"). | Abreviar con regex sobre el texto formateado: frágil con el espacio duro y la divisa. |
| R3-3 | Criterio de ajuste compartido: nuevo `simulator/text-fit.ts` con `textWidthPx(chars, fontSizeTenthsPx)` = ⌈chars × fontSizeTenthsPx × 6 / 100⌉ (Fira Code 0,6 em; a 12 px da 7,2 px por carácter) y `fitsInWidth(chars, fontSizeTenthsPx, availablePx)`. `labelFits` de `chart-model.ts` conserva su firma, su exportación y su resultado y delega en `textWidthPx`. En la escalera, el ancho interior = lado medido − 2 × 8 px; precio a 140 décimas de px (14 px) y rango a 120 (12 px), multiplicados por 1,25 en presentación (175 y 150). Los precios se deciden en bloque: si el precio completo de CUALQUIER cuadrado no cabe (`!steps.every(...)`), los tres se muestran abreviados (`shortPrice`) para ser coherentes; el rango se decide por separado en cada cuadrado (`51+`); el texto visible lleva `aria-hidden` y el texto completo va en un `sr-only` en cada `<li>`, con " (no alcanzado)" cuando toque. Con los valores de la spec, solo se abrevia el precio en presentación a unos 392 px o menos de ancho de pantalla. | Un umbral fijo de ancho de pantalla: no cubre fuente de respaldo ni zoom. |
| R3-4 | El lado real se mide con `ResizeObserver` sobre el primer `<li>`, con 96 px por defecto sin medida (jsdom). La lógica de `useBarWidth` de `QuoteChart` se extrae a `simulator/use-element-width.ts` (`useElementWidth(defaultPx)`) y la usan las dos. `UsersControl` pasa `presentation` a `TierLadder` (`scale` 1 o 1,25). | Duplicar el efecto en `TierLadder`: dos copias que mantener. |
| R3-5 | Tabla: `SummaryRow` deja de usar `colSpan`; cada fila de resumen lleva `<th scope="row">` con la etiqueta en la primera columna, dos `<td>` vacíos (Unidades y Precio) y el `<td>` del importe en Subtotal. El CSS actual (todo centrado, `nowrap` en celdas) no cambia salvo lo que haga falta para las celdas vacías. Vale para la hoja y las simulaciones guardadas (mismo componente). | Mantener `colSpan` con la etiqueta alineada a la izquierda: contradice RF44. |

### Archivos de la ronda
- `simulator/text-fit.ts` (N) y `simulator/use-element-width.ts` (N).
- `simulator/ladder-model.ts` (M), `simulator/TierLadder.tsx` (M: lista de cuadrados con medida y abreviaturas; se elimina `LadderLegend`), `simulator/UsersControl.tsx` (M: sin `LadderLegend`, pasa `presentation`).
- `simulator/chart-model.ts` (M: `labelFits` delega en `textWidthPx`), `simulator/QuoteChart.tsx` (M: usa `useElementWidth`).
- `simulator/QuoteTable.tsx` (M: filas de resumen sin `colSpan`).
- `styles/workspace.css` (M), `styles/base.css` (M solo si hace falta ajustar `forced-colors`), `styles/simulator.css` (M solo si hace falta para las celdas vacías).
- `DESIGN.md` (M: la escalera de cuadrados y las filas de resumen) y `MEMORY.md` (M: se anota la ronda 3).

### Tests de la ronda (primero en rojo)
- `text-fit.test.ts`: `textWidthPx` (9 caracteres a 14 px = 76; a 17,5 px = 95; 8 caracteres a 12 px = 58) y `fitsInWidth` en el límite; los tests de `labelFits` de `chart-model.test.ts` siguen pasando sin cambios.
- `ladder-model.test.ts` (reescrito): con usuarios 0, 1, 10, 11, 50 y 51, `reached`, precios, `rangeFull` ("1–10", "11–50", "51 o más") y `rangeShort` ("51+"); sin `widthPct`, `heightPct` ni `labelOutside`; `shortPrice` (1000 → "10 €", 800 → "8 €", 500 → "5 €", 1050 → "10,50 €"); `ladderAccessibleText`.
- `TierLadder.test.tsx` (N): tres `<li>` sin estilos en línea de ancho ni alto; sin `ladder-legend`; con el lado por defecto (96 px) texto completo; con `ResizeObserver` simulado a 104 px y `presentation` el precio sale abreviado ("10 €") y el rango sigue completo, con el texto completo en `sr-only`; el tramo no alcanzado lleva " (no alcanzado)"; la lista conserva el nombre "Precio por usuario según tramo".
- `QuoteTable` (en los tests de simulador y detalle existentes): cada fila de resumen tiene cuatro celdas, la etiqueta en la primera, las celdas segunda y tercera vacías y el importe en la cuarta; ningún `colspan`; en la hoja y en `SavedQuote`.
- Prueba de CSS por texto (en `design-spacing.test.ts` o un archivo hermano): `workspace.css` no contiene `ladder__legend` ni `ladder__swatch`, y `.ladder__step` tiene `aspect-ratio: 1` sin `height` ni `%` de altura.
- Se ajustan `Simulator.sheet.test.tsx`, `Simulator.preview.test.tsx`, `Simulator.save.test.tsx` y `CustomerDetailPage.test.tsx` en lo que lean la leyenda, las alturas o las celdas de resumen por posición.
- Verificación manual en navegador (CA12): 360, 768, 1024 y 1440 px, presentación ×1,25 (a 360 px los cuadrados miden unos 104 px y el precio se abrevia) y ambos temas.

### Cobertura de RF de la ronda
| RF | Parte |
|---|---|
| RF43, RF24, RF25 (retirado) | R3-1 a R3-4: modelo, `TierLadder`, `UsersControl`, CSS, helpers |
| RF44, RF42 | R3-5: `QuoteTable` |
| CA12 | Tests de la ronda y verificación manual |

## 11. Ronda 4 (RF45 a RF60; RF20, RF28, RF29, RF30 y RF-selector modificados)
Dos tareas: T10 (estado de la hoja, limpieza y hallazgos importantes de la auditoría) y T11 (hallazgos menores). Sin dependencias nuevas, sin tocar `shared/` ni `backend/`. Única excepción autorizada a la regla de no tocar `src/lib/`: `pluralize.ts` y `keyboard.ts` (con sus tests); no se toca nada más de `lib/`. Todas las preguntas de la ronda están resueltas (atajo Alt+P, "Tipos actualizados" aceptado como retirado, nota del slider con más de 100 usuarios, estado en la URL fuera de alcance).

### Decisiones
| # | Decisión | Alternativa descartada |
|---|---|---|
| R4-1 | Limpieza (RF45, RF46): `BudgetSheet.tsx` pierde `ratesAt`, `formatClock`, `NBSP`, el `<p className="sheet__meta">` y los bloques comentados; `Simulator.tsx` deja de leer `oldestAt`; `QuoteChart.tsx` y `chart-model.ts` pierden `subtitle`, `buildSubtitle` y `splitPercentages` (y `halfUpPercent` si queda sin uso); se borran `.chart__subtitle`, `.sheet__split`, `.sheet__meta` y el `border-top` comentado de `.sheet__foot` en el CSS; `data-testid` `sheet-base` y `sheet-vat` desaparecen. `lib/format-date.ts` no se toca aunque `formatClock` quede sin uso. | Dejar el código comentado "por si vuelve": lo pide el usuario limpio. |
| R4-2 | Foco y anuncio en presentación (RF47): los dos botones llevan `data-presentation-toggle`; `Shell` (en `App.tsx`) ejecuta un efecto al cambiar `active` (se salta el primer render) que enfoca `[data-presentation-toggle]`; un `LiveRegion` estable con "Modo presentación activado" o "desactivado". Vale para botón, atajo y Escape. | Pasar refs por contexto: acopla `CustomerContext` con `App`. |
| R4-3 | Atajos (RF48): en `usePresentationHotkeys`, Escape solo sale si `!event.defaultPrevented && !isTypingTarget(event.target)`; el `Tooltip` llama a `preventDefault()` y `stopPropagation()` al cerrar con Escape (su listener está en `document`, antes que el de `window`). Atajo: la tecla `P` sola desaparece y pasa a Alt+P con `event.code === 'KeyP'`, `altKey` y sin Ctrl, Meta ni Mayús, y sin actuar en `isTypingTarget` (cambio en `lib/keyboard.ts` y su test, que cubre P sola, Alt+P, Option+P de Mac con otro `key`, modificadores extra y campos); el botón "Modo presentación (Alt+P)" lleva `aria-keyshortcuts="Alt+P"`. | Un ajuste de usuario para desactivar el atajo: más UI y estado. |
| R4-4 | Foco de campos (RF49): `.input:focus-visible` pasa de `outline: none` a `outline: 2px solid transparent; outline-offset: 2px` (visible en `forced-colors`), conservando borde y anillo. Un test de CSS por texto impide `outline: none` en reglas `:focus-visible`. | Sustituir el anillo por un contorno visible: cambia el aspecto en modo normal. |
| R4-5 | Barra estable (RF50): el envoltorio `Tooltip` está siempre presente con `enabled={display !== 'full'}` y `describe={false}` (sin `aria-describedby`; burbuja `aria-hidden`); dentro, `div` si es completo y `<button type="button">` si es abreviado o sin texto (los dos niveles enfocables comparten elemento, así que `short` y `none` no se remontan ni pierden el foco); el nombre completo va una vez en `sr-only` y el abreviado con `aria-hidden`. `Tooltip` recibe `enabled` y `describe` (por defecto `true`, compatible con los usos actuales). Los nombres usan NBSP ("Tramo 1", "IVA 21 %"). | `role="img"` con `tabindex`: rol incorrecto y el nombre se lee dos veces. |
| R4-6 | Medidas (RF51): `useElementWidth` usa `useLayoutEffect`, mide en el propio efecto antes del primer pintado y lee `clientWidth` (descuenta el borde); `TierLadder` usa un ancho por defecto de 96 o 120 px según `presentation`; todos los `.ladder__step` llevan `border: 1px solid transparent` (el atenuado cambia solo el color), de modo que el ancho interior es `clientWidth − 16` en todos; las constantes de tamaños de fuente (140 y 120 décimas, escala 1,25) viven en `simulator/ladder-metrics.ts` y `design-metrics.test.ts` las compara con `--fs-body-sm`, `--fs-caption` y la escala de presentación del CSS. | Leer `getComputedStyle` en cada render: lento y no determinista en jsdom. |
| R4-7 | Modelos (RF51): `LadderStep` añade `from` y `to`; `ladderAccessibleText` los usa sin `split`; `rangeFull` lleva NBSP ("51 o más"); `shortPrice` usa `Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 o 2 })` (sin decimales si son 00). | Mantener la composición a mano: no localiza. |
| R4-8 | Tabla (RF52): `QuoteTable` recibe `label`; un hook `use-overflow.ts` (`ResizeObserver` con `useLayoutEffect`) decide `tabIndex={0}` solo si `scrollWidth > clientWidth`; filas de resumen con `<th scope='row'>`, `<td colSpan={2} />` y el importe; `th` a peso 500 en el CSS; comillas simples. Los nombres: "Desglose por tramos" (hoja) y "Desglose de la simulación del {fecha}" (guardadas). | Dejar `tabIndex={0}` siempre: foco inútil cuando no hay desbordamiento. |
| R4-9 | Guardado (RF53): `SaveFooter` usa `aria-disabled` cuando el bloqueo es de validación (y `disabled` mientras guarda), con `onClick` que ignora la pulsación y `aria-describedby` hacia la explicación; la región de guardado anuncia un `role="status"` solo con "Presupuesto guardado" y la tabla queda fuera; el mensaje de cálculo imposible en `Simulator.tsx` lleva el siguiente paso y un `Link` "Volver a la lista". | Anunciar la tabla entera: ruido para lectores. |
| R4-10 | Slider (RF54): `aria-valuetext` en `UsersSlider` ("1 usuario", "N usuarios", y "N usuarios (el control llega a 100)" con más de 100); con más de 100 usuarios, nota `<p id>` bajo el slider "El control llega a 100; escribe más en el campo" enlazada con `aria-describedby`; sin nota con 100 o menos. D13 de `MEMORY.md` documenta el tope. | Solo `aria-valuetext`: quien ve la pantalla no vería el desfase. |
| R4-11 | Lista de clientes (RF55, RF56): roles explícitos en la tabla y sus filas; en menos de 768 px la cabecera se oculta con la técnica `sr-only` (no `display: none`); correo y NIF con `position: relative; z-index: 1` y `user-select: text` (el resto de la fila sigue cubierto por el enlace estirado); "Alta" como `<span>` real, oculto en escritorio; cifras tabulares; el contador usa `total` y la nota "Mostrando N de M" se conserva. | Paginación: la API no la tiene. |
| R4-12 | Simulaciones guardadas (RF57): `<table>` con `<thead>` (Usuarios, Total, Fecha, Divisa) y, por simulación, una fila con un `<button aria-expanded aria-controls>` y otra fila `hidden` con el detalle (`SavedQuote`); el estado de las filas abiertas vive en `useState`. Se sustituyen los `<details>`; el aspecto se mantiene con el CSS de `.sim-row`. | Mantener `<details>`: no se puede expresar como tabla. |
| R4-13 | Textos (RF58): `pluralize(count, one, other)` con `Intl.PluralRules('es')` en `lib/pluralize.ts` (excepción autorizada, con su test) y usado por `simulationsLabel`, "usuario(s)" y `customersCountLabel`; `Badge` admite `translate`; `CustomerFields` muestra las etiquetas "Starter", "Growth" y "Enterprise" con el mismo valor; placeholders "Ej.: 12345678Z" y "nombre@empresa.com", con `::placeholder` en `--color-text-muted`, `spellCheck={false}` e `inputMode="email"` en el correo. | Traducir los valores: cambiaría lo que se envía. |
| R4-14 | CSS global (RF59): `4px` a `var(--space-xs)`; `html { overscroll-behavior: none }` solo bajo `@media (pointer: fine)`; `overflow-wrap: anywhere` sale de `body` y pasa a títulos, `.customer-row__company`, correos y meta del contexto, con `overflow-wrap: normal` explícito en `.btn`, chips y `th`; comentario en `layout.css` sobre `.content:focus`. Un test de CSS por texto comprueba que `body` no lleva `anywhere`. | Dejarlo global: parte palabras en botones a 320 px. |
| R4-15 | Favicon (RF60): `frontend/public/favicon.svg` con los colores de `--color-action` y `--color-sage` (y variante oscura por `prefers-color-scheme` dentro del SVG, que es un documento aparte y no puede leer los tokens de la página) y `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` en `index.html`; `favicon.test.ts` comprueba que sus colores existen en el bloque de `DESIGN.md`. El test de literales no revisa `public/`. | Data URI en `index.html`: arrastra colores literales a un archivo que el test revisa. |

### Archivos de la ronda
- Nuevos: `simulator/ladder-metrics.ts`, `simulator/use-overflow.ts`, `frontend/public/favicon.svg`, `design-metrics.test.ts`, `favicon.test.ts`.
- Modificados (simulador): `BudgetSheet.tsx`, `Simulator.tsx`, `QuoteChart.tsx`, `chart-model.ts`, `TierLadder.tsx`, `ladder-model.ts`, `UsersControl.tsx`, `QuoteTable.tsx`, `SaveSection.tsx`, `use-element-width.ts`.
- Modificados (resto): `ui/Tooltip.tsx`, `ui/Badge.tsx`, `App.tsx`, `state/presentation-context.tsx`, `customers/CustomerContext.tsx`, `CustomersPage.tsx`, `CustomerRow.tsx`, `SimulationList.tsx`, `SavedQuote.tsx`, `CustomerFields.tsx`, `count-label.ts`, `lib/pluralize.ts` y `lib/keyboard.ts` (autorizados), `index.html`.
- CSS: `components.css`, `base.css`, `layout.css`, `lists.css`, `workspace.css`, `simulator.css`.
- `MEMORY.md` y `DESIGN.md`: se anotan RF45, la derogación de "Tipos actualizados", el atajo Alt+P, la nota del slider en D13 y el favicon.

### Tests de la ronda (primero en rojo)
- Los 8 tests que fallan por las ediciones manuales se adaptan: `CustomerDetailPage.layout.test.tsx` (orden del DOM sin los textos retirados), `presentation.test.tsx` (RF30 con la barra, foco y anuncio), `QuoteChart.test.tsx` (sin subtítulo, encabezado sin cambios de nivel) y `Simulator.preview.test.tsx` (sin subtítulo), y en `Simulator.sheet.test.tsx` se eliminan "IVA incluido" y "Tipos actualizados", y se reescriben el de la vista previa (bajo el total) y el del aviso de guardado (fuera de la hoja). Las esperas de "tipos cargados" pasan a una señal estable (la opción "USD" habilitada en el selector o un `findBy` del total).
- Nuevos o ampliados: foco y anuncio en presentación (botón, atajo y Escape); Escape con el foco en un select, un input y el slider no sale, y con tooltip abierto cierra solo el tooltip; `aria-keyshortcuts`; barra (mismo elemento tras pasar de "Tramo 2" a "T2" y a vacío, sin perder el foco; `button` solo en abreviado o vacío; nombre leído una vez; NBSP); `useElementWidth` mide en el primer render (con `clientWidth` simulado); escalera con ancho por defecto 120 px en presentación y borde descontado; `ladder-model` con `from`, `to`, `shortPrice` (`Intl`) y texto accesible sin `split`; `design-metrics.test.ts`; `QuoteTable` (región enfocable solo con desbordamiento simulado, nombres únicos, `colSpan` 2 en resumen, 3 celdas efectivas); `SaveSection` (`aria-disabled`, pulsación ignorada, foco conservado, región "Presupuesto guardado"); cálculo imposible con enlace; `aria-valuetext`; lista de clientes (roles explícitos, correo y NIF seleccionables por CSS, "Alta" como texto, contador con total y nota); `SimulationList` como tabla (botón con `aria-expanded`/`aria-controls`, fila oculta, teclado); plurales (1, 2, 0, 101); `translate="no"`; opciones de plan y placeholders; `favicon.test.ts`; pruebas de CSS por texto (sin `outline: none` en `:focus-visible`, `body` sin `anywhere`, `4px` fuera, `overscroll` bajo `pointer: fine`).
- Verificación manual (CA13): foco y anuncios con lector, `forced-colors`, 320, 360 y 768 px, presentación, ambos temas.

### Cobertura de RF de la ronda
| RF | Parte |
|---|---|
| RF45, RF46 | R4-1: T10 |
| RF47, RF48, RF49 | R4-2, R4-3, R4-4: T10 |
| RF50, RF51 | R4-5, R4-6, R4-7: T10 |
| RF52 | R4-8: T11 |
| RF53, RF54 | R4-9, R4-10: T11 |
| RF55, RF56, RF57 | R4-11, R4-12: T11 |
| RF58, RF59, RF60 | R4-13, R4-14, R4-15: T11 |
| CA13 | Tests de la ronda y verificación manual |

## 12. Re-auditoría (T12)
| # | Decisión | Alternativa descartada |
|---|---|---|
| R5-1 | Segmentos abreviados o sin texto de la barra: siguen siendo `<button type="button">` y ahora hacen algo: pulsar o tocar alterna el `Tooltip` (prop `toggle`, con `aria-expanded` en el disparador), de modo que funciona en táctil y en Safari iOS (que no enfoca botones al tocar). Foco estable y nombre leído una vez (el `aria-describedby` sigue ausente en la barra). | Un elemento no interactivo con `tabindex` y sin rol: peor semántica y sin acción al tocar. |
| R5-2 | Alt+P solo se excluye en campos donde se escribe texto (`textarea`, editables e `input` de texto); en el slider y en los `select` actúa. Escape sale desde el slider y los `select`, y no desde campos de texto. Salir al desmontar el detalle (navegación) es silencioso: sin foco ni anuncio (`reset`/`consumeSilent` en el contexto). | Excluir todo `input`/`select`: bloquea el atajo sin necesidad. |
| R5-3 | Paginación de "Mostrando N de M": fuera de alcance (requiere cambiar la API); anotado en `MEMORY.md` como pendiente para otra spec. | Paginar en el cliente: no hay más datos que mostrar. |

## 13. Ronda 5 (RF61 a RF67; refuerzo de RF42 y RF44)
Una sola tarea (T13). Solo `frontend/` y `MEMORY.md`; sin dependencias nuevas y sin tocar `shared/`, `backend/` ni `src/lib/`. Para no confundirlas con los R5-x de la sección 12, las decisiones de esta ronda se numeran R5.1 a R5.7.

### Causa del fallo del desglose guardado
`styles/lists.css` define reglas descendientes (`.sim-table thead, .sim-table tbody { display: block }`, `.sim-table tbody { border-bottom }`, `.sim-table tbody:hover`, `.sim-detail td { display: block; padding }`, `.sim-row th, .sim-row td`) que también alcanzan al `thead`, `tbody` y `td` de la `QuoteTable` anidada en la fila oculta (`SimulationList` → `SavedQuote` → `QuoteTable`): las celdas pasan a bloque y se apilan, y la tabla pierde el ancho.

### Decisiones
| # | Decisión | Alternativa descartada |
|---|---|---|
| R5.1 | Se acotan los selectores de `lists.css`: `.sim-table > thead, .sim-table > tbody` (y su `:hover`/`:active` y borde), `.sim-detail > td`, `.sim-row > th, .sim-row > td`, `.customer-list > thead/tbody` y `.customer-row > td`, siempre con hijo directo o clases propias; ningún selector de la lista usa un descendiente genérico de `thead`, `tbody`, `tr`, `th` o `td`. `QuoteTable` no se modifica: es el mismo componente que en la hoja. | Resetear los estilos dentro de la fila (`all: revert` en la tabla anidada): frágil y duplica reglas. |
| R5.2 | El desglose abierto va sin tarjeta: `.sim-detail > td` conserva `display: block` y relleno lateral y bajo de `var(--space-md)` (pendiente de P1), y `.saved-quote` y `.quote-table-wrap` llevan `min-width: 0` y `width: 100%` para que la tabla ocupe la fila y se desplace en su región a 375 px (el CSS de `QuoteTable` ya es `nowrap`). El bloque de conversión (`saved-quote__details`) no cambia. | Una tarjeta con borde: el usuario la rechaza. |
| R5.3 | Test de aislamiento (nuevo `customers/SimulationList.styles.test.tsx`): se renderiza `SimulationList` con una simulación abierta, se leen los selectores de `lists.css` (texto del archivo, partidos por comas y sin `@media`) que empiezan por `.sim-table`, `.sim-detail`, `.sim-row`, `.simulation-list`, `.customer-list` o `.customer-row`, y se comprueba con `Element.matches` que ninguno coincide con ningún elemento de la tabla del desglose anidada (`table`, `thead`, `tbody`, `tr`, `th`, `td`) ni con su región; además, una comprobación de texto rechaza selectores de esas familias con un descendiente `thead`, `tbody`, `th` o `td` separado por espacio. | Solo verificación visual: no detecta regresiones. |
| R5.4 | Columna "Acciones": `CustomersPage` añade `Acciones` a `COLUMNS` (cabecera visible, pendiente de P2) y `CustomerRow` un `<td className="customer-row__actions">` con un nuevo componente `customers/RowActions.tsx` (dos botones). Anchura de la columna `calc(var(--space-2xl) * 3)` (144 px: dos botones de 44 px, el hueco de 8 px y el relleno). En menos de 768 px el `td` pasa a bloque con `display: flex; gap: var(--space-sm)` al final de la fila. | Menú de acciones (tres puntos): añade interacción y la spec pide dos botones. |
| R5.5 | Botones deshabilitados con `aria-disabled="true"` (no `disabled`): conservan el foco, lo que permite el `Tooltip` "Próximamente" por teclado y al tocar, y el nombre y la descripción se anuncian; `onClick` hace `preventDefault()` y `stopPropagation()` y no hace nada más. Se documenta en un comentario del componente y en `MEMORY.md`. Cada botón va dentro del `Tooltip` existente (`text="Próximamente"`, `describe` activado, que enlaza `aria-describedby`). Nombre accesible `Editar {empresa}` y `Borrar {empresa}` con `aria-label`; el icono lleva `aria-hidden`. | `disabled` nativo: sin foco, sin tooltip por teclado y sin anuncio del motivo. |
| R5.6 | Iconos `PencilIcon` y `TrashIcon` en `ui/icons.tsx` (SVG en línea, `currentColor`, `aria-hidden`, misma firma `IconProps`). Estilo: `Button` con `variant="ghost"` y una clase `btn--icon` (44 × 44 px, relleno 0, centrado) en `components.css`; la papelera añade `row-action--danger` (color `--color-error-text`); el aspecto deshabilitado reutiliza `.btn[aria-disabled="true"]` (40 % de opacidad, cursor de no permitido, RF9). Los botones llevan `position: relative; z-index: 2` para quedar por encima del enlace estirado (`::after` de la fila) y de los textos seleccionables (`z-index: 1`). | Colorear con `--color-error-strong`: el relleno rojo es demasiado fuerte para una acción deshabilitada. |
| R5.7 | `MEMORY.md`: nueva nota de pendiente (no D-número): la spec futura que haga la paginación de "Mostrando N de M" incluirá editar y borrar clientes (backend y frontend), con confirmación del borrado y teniendo en cuenta que la FK `ON DELETE RESTRICT` (D14) impide borrar un cliente con simulaciones (409). También se anota que los botones de la lista están deshabilitados con `aria-disabled` por decisión del usuario. | Anotarlo solo en la spec: se perdería entre rondas. |

### Archivos de la ronda
- Nuevos: `customers/RowActions.tsx`, `customers/RowActions.test.tsx`, `customers/SimulationList.styles.test.tsx`.
- Modificados: `styles/lists.css` (selectores acotados, columna de acciones, móvil), `styles/components.css` (`btn--icon`, `row-action--danger`), `ui/icons.tsx` (`PencilIcon`, `TrashIcon`) y su test si existe, `customers/CustomerRow.tsx`, `customers/CustomersPage.tsx`, `customers/CustomersPage.test.tsx` y los tests que cuenten columnas o celdas de la lista, `MEMORY.md`.
- Sin cambios: `QuoteTable.tsx`, `SavedQuote.tsx` y `SimulationList.tsx` (salvo una clase auxiliar si hiciera falta).

### Tests de la ronda (primero en rojo)
- `SimulationList.styles.test.tsx`: lo descrito en R5.3; además comprueba que, con la fila abierta, la tabla anidada tiene `thead` y `tbody` y 4 columnas por fila de tramo, y que su región es la de `QuoteTable` (mismas clases que en la hoja).
- `RowActions.test.tsx`: dos botones con nombres "Editar {empresa}" y "Borrar {empresa}"; `aria-disabled="true"` y sin `disabled`; reciben foco con Tab; el aviso "Próximamente" aparece al enfocar y al pasar el ratón (con `fake-timers`, 150 ms) y se enlaza con `aria-describedby`; pulsar no llama a nada ni navega (`MemoryRouter` sin cambio de ruta); los iconos tienen `aria-hidden`.
- `CustomersPage.test.tsx` y `CustomerRow`: columna "Acciones" en la cabecera; dos botones por fila con su empresa; el enlace del nombre sigue siendo el único enlace de la fila.
- Prueba de CSS por texto: las reglas de los botones llevan `z-index` mayor que el del enlace estirado y `btn--icon` define 44 px; el test de tokens, contraste y espaciado sigue pasando (iconos con `currentColor`).
- Verificación manual (CA14): desglose abierto a 1280, 768 y 375 px, lista a 1280 y 360 px con los botones, foco y tooltip con teclado, `forced-colors`.

### Cobertura de RF de la ronda
| RF | Parte |
|---|---|
| RF61, RF62, RF63 | R5.1, R5.2, R5.3: `lists.css` y test de aislamiento |
| RF64, RF65, RF66 | R5.4, R5.5, R5.6: `RowActions`, `CustomerRow`, `CustomersPage`, iconos y CSS |
| RF67 | R5.7: `MEMORY.md` |
| CA14 | Tests de la ronda y verificación manual |

