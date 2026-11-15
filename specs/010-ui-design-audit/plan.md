# 010 · Plan técnico — Auditoría de diseño UI
Parte de `spec.md` (aprobada). Sin dependencias nuevas (ni runtime ni dev): iconos SVG propios, CSS (`mask-image`, `grid-template-rows`, `:has()`, `inert`), componentes React ya presentes. Sin cambios en `shared/`, `backend/`, rutas, controladores, servicios, repositorios, API ni base de datos.

## 1. Resumen
- Tokens: tema claro nuevo (fondo `#E9E9E9`, jerarquía de superficies, bordes, sage, info y chart) y tokens nuevos de plan y de la línea del botón de tema, a la vez en `DESIGN.md` y `tokens.css`; el test de contraste crece y gana excepciones declaradas.
- Componentes compartidos: un solo chevron (SVG en línea y máscara CSS para `<select>`), iconos propios nuevos, chip de plan con color, botón "Guardar" con icono.
- Lista de clientes: País y NIF separados, columna "Simulaciones" solo con número, botones de fila y de paginación con fondo, hueco de 16 px, chips de plan.
- Detalle: plan junto al nombre, datos con icono, "Presentar" con tooltip, título "Simulaciones guardadas (N)", "Guardar" con icono.
- Formularios: tarjeta centrada, sin títulos de grupo ni `fieldset`, chevron único, "Guardar".
- Animaciones (despliegue de simulación guardada y barra de tramos) solo con `prefers-reduced-motion: no-preference`.
- Docs: `DESIGN.md` (texto), `MEMORY.md` (D6, D16), notas de enmienda en 008 y 009.

## 2. Archivos por capa
Solo existe la capa `frontend/` (más `DESIGN.md`, `MEMORY.md` y las specs). `shared/`, rutas, controladores, servicios y repositorios: sin cambios.

### 2.1 Tokens y tests (T1)
- `DESIGN.md` (bloque css) y `frontend/src/styles/tokens.css`, idénticos. Claro: `--color-bg #E9E9E9`, `--color-surface-2 #EEF1F5`, `--color-hover #EEF1F5`, `--color-ghost-hover #0F172A14`, `--color-secondary-hover #0F172A1A`, `--color-active #0F172A14`, `--color-border #94A3B8`, `--color-sage` y `--color-chart-2 #34D399`, `--color-info` y `--color-chart-3 #38BDF8`, `--color-info-text #075985`, `--color-info-bg #38BDF826`, `--color-selection #34D39959`. Tokens nuevos en ambos temas: `--color-plan-starter-bg`, `--color-plan-growth-bg`, `--color-plan-growth-text`, `--color-plan-enterprise-bg`, `--color-toggle-line` (valores de la tabla de la spec). El texto de starter usa `--color-info-text` y el de enterprise `--color-text`.
- `frontend/public/favicon.svg`: el sage claro (`#059669`) pasa a `#34D399`; `favicon.test.ts` ya compara contra `DESIGN.md`.
- `frontend/src/styles/controls.css`: `.theme-toggle__btn--active` usa `inset 0 -3px 0 var(--color-toggle-line)`.
- `frontend/src/styles/layout.css` y `lists.css`: el subrayado de la navegación activa y la barra de hover de fila (líneas con `var(--color-sage)`) pasan a `var(--color-sage-text)`.
- `frontend/src/styles/workspace.css`: borde discontinuo de los tramos no alcanzados en claro con `--color-border-control` (regla bajo `[data-theme="light"]`; oscuro igual).
- `frontend/src/test/contrast-pairs.ts`: `Pair` gana `over?: 'surface' | 'bg'` (superficie sobre la que se mezcla el fondo con alfa; por defecto `surface`) y `themes?: ('dark' | 'light')[]` (por defecto ambos). Cambios:
  - Los pares no textuales `sage`, `chart-2` y `chart-3` sobre `surface` pasan a `themes: ['dark']` (limitación declarada en la spec: en claro dan 1,6:1 a 1,9:1).
  - Pares nuevos (4,5:1): `text-muted` sobre `hover`, `active`, `ghost-hover` y `secondary-hover`, con `over` `surface` y `bg`; `info-text` sobre `info-bg` con `over` `surface` y `bg`; `plan-growth-text` sobre `plan-growth-bg`, `info-text` sobre `plan-starter-bg` y `text` sobre `plan-enterprise-bg`, los tres con `over` `surface` y `bg`; `text` y `text-muted` sobre `selection` con `over` `surface` y `bg`; `sage-text` sobre `bg`.
  - Pares nuevos no textuales (3:1): `toggle-line` sobre `action`, `surface` y `bg`; `sage-text` sobre `bg` y `surface`. Y uno de 2:1 solo claro: `border` sobre `bg`.
- `frontend/src/design-contrast.test.ts`: `base` pasa a mezclarse sobre `surface` o `bg` según `over`, y se saltan los pares fuera de `themes`.
- Nuevo `frontend/src/design-hierarchy.test.ts` (RF1, RF11b): en claro, luminancia de `bg` < `surface-2` < `surface`; `hover` y `surface-2` más oscuros que `surface`; los tres `plan-*-bg` y los tres textos de plan son distintos entre sí en ambos temas; `bg` claro es exactamente `#E9E9E9`.
- `design-tokens.test.ts` (existente) no cambia: sigue comparando el bloque con `tokens.css`.

### 2.2 Componentes compartidos (T2)
- `frontend/src/ui/icons.tsx` (88 líneas, +~45): se exporta `CHEVRON_PATH = 'm6 9 6 6 6-6'` (única geometría; `ChevronIcon` ya la usa) e iconos nuevos `SaveIcon`, `GlobeIcon` (país), `IdCardIcon` (NIF), `MailIcon` y `CalendarIcon`, con el mismo `Icon` base (`currentColor`, `aria-hidden`).
- Nuevo `frontend/src/ui/SelectShell.tsx` y estilos en `components.css`: contenedor `<div className="select-shell">` que envuelve un `<select class="input">`. El chevron es `::after` del contenedor: `position: absolute; right: var(--space-md); pointer-events: none`, `-webkit-mask-image` y `mask-image` con una data-URI SVG de la geometría `CHEVRON_PATH` (trazo `currentColor`, sin color literal), `background-color: var(--color-text-muted)`; `--color-text` con `:has(select:hover)` y `--color-focus` con `:has(select:focus-visible)`; opacidad 0,4 con `:has(select:disabled)`; en `@media (forced-colors: active)`, `forced-color-adjust: none` y `background-color: ButtonText`. Se elimina el chevron de dos degradados de `select.input` (lo demás de RF39 —relleno derecho `calc(var(--space-md) + var(--space-lg)) `— se conserva).
- Nuevo `frontend/src/ui/chevron-css.test.ts`: lee `components.css`, extrae la data-URI y comprueba que contiene `CHEVRON_PATH` (fuente única) y ningún color literal.
- `frontend/src/ui/Badge.tsx`: sin cambios. Nuevo `frontend/src/ui/PlanBadge.tsx`: `PlanBadge({ plan }: { plan: Plan })` → `<span className="badge badge--plan-{plan}" translate="no">{plan}</span>`; estilos `badge--plan-starter|growth|enterprise` en `components.css` (fondo `--color-plan-*-bg`, texto de la tabla de plan, sin borde de color de estado).
- `frontend/src/ui/Button.tsx`: sin cambios. Nuevo `frontend/src/ui/SaveButton.tsx`: `SaveButton(props: Omit<ButtonProps,'children'> & { pending: boolean; ariaLabel?: string })` → botón primario con `<SaveIcon/>` y "Guardar", o "Guardando…" sin icono si `pending`; `aria-label` solo si se pasa (la hoja pasa "Guardar simulación"; los formularios no pasan nada: el nombre es "Guardar").
- `frontend/src/simulator/SaveSection.tsx`: `SaveFooter` usa `SaveButton` (`ariaLabel="Guardar simulación"`, `aria-disabled` y `aria-describedby` intactos).
- `frontend/src/layout/CurrencySelect.tsx`: el `<select>` va dentro de `SelectShell` (RF12). `CustomerFields.tsx` hace lo mismo en T5.

### 2.3 Lista de clientes (T3)
- `frontend/src/customers/CustomerListView.tsx`: `COLUMNS = ['Empresa', 'País', 'NIF', 'Plan', 'Simulaciones', 'Alta', 'Acciones']`.
- `frontend/src/customers/CustomerRow.tsx` (40 líneas): celdas `customer-row__country` (solo `CountryFlag`), `customer-row__taxid` (NIF `tabular`, copiable, `z-index` sobre el enlace estirado), `PlanBadge`, `customer-row__sims` con solo `{customer.simulationCount}` (sin texto extra: el nombre lo da la cabecera, `simulationsLabel` deja de importarse aquí) y `Alta` igual. Sin `aria-label` en la celda salvo que el test de accesibilidad demuestre que la cabecera no se expone en apilado (RF9).
- `frontend/src/styles/lists.css` (89 líneas): reparto del ancho con siete columnas (`th:first-child` 24 %, país 10 %, NIF 14 %, resto automático); la cabecera de columnas nth-child se reajusta; la barra de hover de fila usa `--color-sage-text` (T1); `.customer-row__taxid` con `user-select: text` y `white-space: nowrap`; en apilado, País y NIF son celdas propias con su etiqueta visible (`::before` no: texto real oculto en escritorio, como "Alta") y la de Simulaciones sin etiqueta (excepción RF10). Si el archivo pasara de 200 líneas, el bloque de simulaciones guardadas se mueve a `styles/simulations.css` (importado en `main`/`index.css` como el resto).
- `frontend/src/customers/RowActions.tsx` (sin cambio de lógica) y estilos en `lists.css`: `.row-actions .btn` con `background: var(--color-bg)`, `border: 1px solid var(--color-border-control)` y hover `--color-secondary-hover` (RF6).
- `frontend/src/styles/pagination.css`: `.pagination__link` con `background: var(--color-surface)` y `border: 1px solid var(--color-border-control)`, hover `--color-hover` con `border-color: var(--color-text)`; `[aria-current="page"]` mantiene `--color-action`; `.pagination__list` con `gap: var(--space-md)` (RF8); el deshabilitado al 40 % sin hover.

### 2.4 Detalle (T4)
- `frontend/src/customers/CustomerContext.tsx` (40 líneas): fila `customer-context__name` con `<h1>` y `PlanBadge`; bajo ella `customer-context__meta` con cuatro elementos con icono (`GlobeIcon` + `CountryFlag`, `IdCardIcon` + NIF, `MailIcon` + correo, `CalendarIcon` + "Cliente desde {fecha}"); botón "Presentar" con `Tooltip` ("Alt+P", `describe` activo para `aria-describedby`, ratón y foco), `aria-keyshortcuts="Alt+P"` y `data-presentation-toggle`.
- `frontend/src/styles/workspace.css` (`.customer-context`): la rejilla `name data action` pasa a `"name action" "data data"` con `name` flex que envuelve el h1 y el chip; estrecho: nombre, chip, datos y acción en orden.
- `frontend/src/customers/CustomerDetailPage.tsx` (línea 62): el `<h2>` pasa a `Simulaciones guardadas ({customer.simulationCount})` (número en `<span class="tabular">`) y se elimina el `<p class="muted">`; `simulationsLabel` deja de importarse si no hay otro uso.
- El botón de guardado de la hoja ya usa `SaveButton` (T2). El texto "Modo presentación (Alt+P)" desaparece; "Salir de la presentación" sin cambios.
- Tests existentes que buscan "Modo presentación" o "Guardar simulación" por nombre se adaptan: el botón se encuentra por "Presentar" y por "Guardar simulación" (nombre accesible conservado); el anuncio "Modo presentación activado" no cambia.

### 2.5 Formularios (T5)
- Nuevo `frontend/src/customers/FormCard.tsx`: `FormCard({ title, children })` → `<section className="page form-page"><Card className="form-card"><h1>{title}</h1>{children}</Card></section>`; `form-page` centra horizontalmente (`display: flex; justify-content: center`) y `form-card` con `width: 100%; max-width: 560px`. Lo usan `NewCustomerPage` y `EditCustomerPage` (esta, también para sus estados de carga, error y "Cliente no encontrado": dentro de la tarjeta).
- `frontend/src/customers/CustomerFields.tsx` (100 líneas): se eliminan `<fieldset>`/`<legend>`; los cinco `Field` van como hijos directos; los `<select>` de país y plan van dentro de `SelectShell`.
- `frontend/src/customers/CustomerForm.tsx`: el botón de envío es `SaveButton` (`pending` → "Guardando…"); se eliminan `submitLabel`/`pendingLabel` y el valor por defecto "Crear cliente"; `CancelLink` se queda dentro de `.form__actions` (tarjeta). `EditCustomerPage` deja de pasar `submitLabel` y `pendingLabel`.
- `frontend/src/styles/lists.css`: se borran `.form__group` y `.form__group legend`; `.form-page` y `.form-card` nuevos.

### 2.6 Animaciones (T6)
- Nuevo `frontend/src/ui/use-reduced-motion.ts`: `useReducedMotion(): boolean` (`matchMedia('(prefers-reduced-motion: reduce)')`, con suscripción a `change`, `false` si no hay `matchMedia`). No toca `frontend/src/lib/`.
- `frontend/src/customers/SimulationList.tsx` (81 líneas): el detalle deja de usar `hidden`: la fila `sim-detail` siempre existe, con `data-open={open}` y su `<td>` contiene `<div class="sim-detail__panel" inert={!open}>` (React 19: `inert` booleano) con `SavedQuote`. `aria-expanded` y `aria-controls` no cambian.
- `frontend/src/styles/lists.css` (o `simulations.css`): `.sim-detail > td { display: grid; grid-template-rows: 0fr; }`, `.sim-detail[data-open="true"] > td { grid-template-rows: 1fr; }`, el panel con `overflow: hidden; min-height: 0`; el cierre añade `visibility: hidden` con retardo igual a la duración, de modo que desaparece de lectores al terminar la transición (y `inert` desde el principio). Las `transition` (`grid-template-rows`, `opacity`, `transform` del chevron: 250 ms, `ease`) viven solo dentro de `@media (prefers-reduced-motion: no-preference)`; con `reduce`, abrir y cerrar son instantáneos (RF18, RF28). Alternar a mitad: lo invierte el navegador desde el valor actual.
- Nuevo `frontend/src/simulator/chart-transition.ts` y `chart-transition.test.ts`: lógica pura de entrada y salida de segmentos.
  ```ts
  export interface TransitionSegment extends ChartSegment { leaving: boolean; grow: number }
  /** Mantiene como `leaving` (grow 0) los segmentos de `prev` que ya no están en `next`. */
  export function mergeSegments(prev: readonly ChartSegment[], next: readonly ChartSegment[]): TransitionSegment[];
  /** grow objetivo: cents del segmento, o 0 si sale o aún no ha entrado (primer fotograma). */
  export function growOf(segment: TransitionSegment, entered: boolean): number;
  ```
- Nuevo `frontend/src/simulator/use-segment-transition.ts`: hook que, con `useReducedMotion`, devuelve los segmentos ya fusionados; los nuevos nacen con `grow 0` y pasan a su valor en el siguiente fotograma (`requestAnimationFrame`); los que salen se retiran en `transitionend` (o a los 350 ms de respaldo); con movimiento reducido no hay fusión ni retardo. La decisión de nombre completo, abreviatura o nada sigue siendo `buildChartModel(quote, width)` (ancho final calculado de los datos y de la barra, que no se anima), así que no cambia (RF19).
- `frontend/src/simulator/QuoteChart.tsx` (51 líneas): consume el hook; los segmentos `leaving` se pintan inertes (`aria-hidden`, sin `button`, sin texto) para no perder el foco ni duplicar lectura.
- `frontend/src/styles/simulator.css` (58 líneas): `.stack__item { transition: flex-grow 250ms ease }` solo bajo `prefers-reduced-motion: no-preference`.
- `frontend/src/styles/base.css`: el bloque global `@media (prefers-reduced-motion: reduce)` (línea 57) se mantiene como red de seguridad.

### 2.7 Documentación (T6)
- `DESIGN.md` (texto fuera del bloque css): fondo y jerarquía de claro, bordes, plan (chips de colores), iconos y chevron único (máscara), tarjeta del formulario, botones "Presentar" y "Guardar", limitación de contraste con su inventario, línea del botón de tema; la sección "Deviations" cambia "plan chips neutros".
- `MEMORY.md` (< 60 líneas): D6 actualizada (claro `#E9E9E9`, planes de color, chevron único), D16 con el atajo `Alt+P` (hoy dice `P`), limitación de contraste e inventario, resultado del punto 21 (la API no da símbolos), estado de la spec 010 y fuera "Auditoría de diseño UI" de "Pendiente para otra spec". `ai-workspace/ui-audit-pending.md` se marca como hecho.
- Notas de enmienda en `specs/008-verdana-redesign/spec.md` (RF12, RF19, RF21/RF40, RF30, RF39, RF48) y `specs/009-customers-crud-pagination/spec.md` (RF7), cada una remitiendo a la 010.

## 3. Contrato de la API
Sin cambios. Ningún endpoint, cuerpo ni respuesta se toca. Los textos "Crear cliente" y "Guardar cambios" desaparecen solo de la interfaz.

## 4. Cambios en la base de datos
Ninguno.

## 5. Decisiones (con la alternativa descartada)
- Chevron de `<select>` en un contenedor con `::after` y máscara, con la geometría de `ui/icons` comprobada por test contra el CSS. *Descartado:* conservar los dos degradados (no comparten forma con el chevron del resto), un `background-image` con color literal en la data-URI (rompe el test de tokens) y un `mask` sobre el propio `<select>` (enmascara todo el control).
- Estados del chevron con `:has(select:...)`. *Descartado:* componente React con estado de hover y foco (duplica lo que el navegador ya sabe).
- Chips de plan con tokens propios y `PlanBadge`. *Descartado:* reutilizar éxito, aviso y error (confunde estado con plan) y ampliar `Badge` con 3 tonos (mezcla estado y plan en un solo tipo).
- Excepciones por tema en la lista de pares de contraste (`themes`) y mezcla sobre `bg` (`over`). *Descartado:* quitar los pares de sage y chart (se pierde la comprobación en oscuro) y subir el contraste del relleno en claro (incompatible con el sage claro pedido).
- Animación del despliegue con `grid-template-rows` y `inert`. *Descartado:* animar `height` con JS y medidas (parpadeo y código) y `max-height` (velocidad desigual).
- Barra de tramos: fusión de segmentos salientes en un hook y transición CSS de `flex-grow`. *Descartado:* una librería de animación (dependencia nueva) y animar la medida de la etiqueta (la decisión se toma con el ancho final, RF19).
- `useReducedMotion` en `ui/`. *Descartado:* ponerlo en `lib/` (la 008 limita ese directorio).
- `FormCard` común a alta y edición. *Descartado:* duplicar la tarjeta en cada página.
- Sin `aria-label` en la celda de simulaciones: el contexto lo da la cabecera, que se conserva expuesta. *Descartado:* texto solo para lectores en cada celda (duplica la lectura).

## 6. Estrategia de tests (Vitest, jsdom, tests primero)
- Tokens y contraste (T1): `design-tokens.test.ts` (bloque = `tokens.css`), `design-contrast.test.ts` con los pares nuevos y las excepciones, `design-hierarchy.test.ts`, `favicon.test.ts` y los tests de reglas de token (sin colores literales, espaciado) en verde.
- Componentes (T2): `SelectShell` (renderiza el `select` hijo, sin `aria` extra), `chevron-css.test.ts`, `PlanBadge` (texto del plan, clase por plan), `SaveButton` (nombre "Guardar", "Guardando…" sin icono, `aria-label` opcional, `aria-disabled` conservado), `icons` (todos `aria-hidden` y `currentColor`).
- Lista (T3): cabeceras País y NIF; celda de simulaciones con solo el número para 0, 1 y 12; plurales sin texto extra; `CustomerRow` con NIF ES (DNI, NIE, CIF) y un país sin NIF obligatorio; reglas CSS de botones de fila y paginación (fondo, borde y `gap: var(--space-md)`); `Pagination` conserva `aria-current` y el estado deshabilitado.
- Detalle (T4): plan junto al `h1`; cuatro datos con icono `aria-hidden`; "Presentar" con tooltip "Alt+P" al hover y al foco, `aria-describedby`, `aria-keyshortcuts` y Escape que lo cierra sin salir; título "Simulaciones guardadas (N)" para 0, 1 y 14 sin subtítulo; atajo Alt+P y anuncios intactos.
- Formularios (T5): sin `fieldset` ni `legend`, etiquetas conservadas, tarjeta con título, botones y errores dentro, `SaveButton` "Guardar" en alta y edición, doble envío bloqueado, `SelectShell` en país y plan.
- Animaciones (T6): `chart-transition.test.ts` (`mergeSegments` y `growOf` para usuarios 0, 1, 10, 11, 50 y 51: entra el tramo 2 en 11 y el 3 en 51, sale al bajar), `QuoteChart.test.tsx` (la decisión de texto no cambia, los salientes son inertes), `SimulationList` (`data-open`, `inert` al cerrar y `aria-expanded` coherente al alternar), `use-reduced-motion` y un test de CSS que exige que toda `transition` nueva esté dentro de `prefers-reduced-motion: no-preference`.
- Sin regresión: `npm test` y `npm run lint` completos; los 2514 tests actuales se adaptan solo donde cambian los textos o la estructura (no se retira cobertura de 0, 1, 10, 11, 50 y 51). La cobertura de IVA, DNI, NIE y CIF vive en `shared/` y `backend/`, que no se tocan.
- Manual en navegador (no automatizable): 360, 768, 1024 y 1440 px, ambos temas y presentación; `forced-colors` del chevron y de la línea del botón de tema.

## 7. Qué RF cubre cada parte
| Parte | RF |
|---|---|
| 2.1 Tokens, favicon, contraste, jerarquía | RF1, RF2, RF3, RF4, RF5, RF13, RF26, RF27 |
| 2.2 Chevron, iconos, `PlanBadge`, `SaveButton` | RF11, RF12, RF20, RF24, RF25 |
| 2.3 Lista y paginación | RF6, RF7, RF8, RF9, RF10, RF11 |
| 2.4 Detalle | RF14, RF15, RF16, RF17, RF20, RF21 (descartado) |
| 2.5 Formularios | RF22, RF23, RF24, RF25 |
| 2.6 Animaciones | RF18, RF19, RF28 |
| 2.7 Documentación | RF29 |

## 8. Riesgos
- El sage claro (`#34D399`) y el fondo nuevo dejan `sage-text` en 4,5:1 sobre el fondo, justo en el umbral; el respaldo está en la spec (`#046C4E`).
- `:has()` y `mask-image` están en los navegadores actuales; jsdom no evalúa CSS, así que el comportamiento visual del chevron solo se comprueba con tests de texto de CSS y en el navegador.
- Entrada y salida de segmentos de la barra: el primer fotograma y el `transitionend` son frágiles en jsdom; la lógica va en funciones puras y el hook se prueba con temporizadores falsos (`test/fake-timers.ts`).
- Cambiar `hidden` por `inert` y `visibility` en el detalle de simulaciones rompe tests que buscan contenido oculto; se actualizan a `inert` y `data-open`.
- `lists.css` (89 líneas) puede acercarse a 200 con siete columnas y las nuevas reglas; si pasa de 190, se divide en `lists.css` y `simulations.css`.
