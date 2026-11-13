# 005 · Plan técnico — Dashboard de clientes y simulador
Spec: [spec.md](spec.md) (aprobada, 40 RF, U1 a U7 y V1 a V8) · Decisiones: MEMORY.md D1, D2, D3, D4, D6, D11, D12, D14 y D15 (y D16, que se registra en T6) · Tareas: [tasks.md](tasks.md)

## 1. Resumen
- Se crea `frontend/` (React + Vite + TanStack Query) como un paquete más del monorepo. El único cambio de backend y `shared/` es `simulationCount` en `Customer` (RF1 a RF3); no hay cambios de esquema ni migración.
- **Una sola fuente de verdad (principio 3):** la vista previa usa `calculateQuote`, `convertQuote` y `parseRateText` de `shared/`. La interfaz no duplica tablas de precios, IVA ni validadores de tax ID (RF35): los errores de tax ID los pone el backend y la interfaz solo los coloca junto a su campo.
- **Estado del servidor** en TanStack Query (cache, invalidación, carga y error). **Estado de la interfaz** (divisa activa, tema, modo presentación, valores del simulador) en `useState` y tres contextos pequeños. No hay librería de estado global.
- **Comunicación (RF37):** el frontend llama a `/api/...`; el servidor de Vite reenvía al backend quitando `/api`. No hay CORS.
- **Importes:** la interfaz maneja céntimos enteros y solo formatea al mostrar, con enteros (parte entera y resto), sin pasar por coma flotante (sección 7, D-P9).
- Los textos están en español, sin i18n, escritos en los componentes.

## 2. Dependencias nuevas (justificación)
Hoy el repositorio tiene `shared` y `backend`. Todas las versiones se **fijan exactas** (como en `backend/package.json`) en la versión estable vigente al instalar; las mayores indicadas son orientativas. Tras instalar se ejecuta `npm audit` y se aplica el criterio de D12 (solo se aceptan avisos moderados en desarrollo y se anotan en D16).

| Paquete | Dónde | Por qué es necesario | Alternativa descartada |
|---|---|---|---|
| `react`, `react-dom` (19) | frontend | Biblioteca de UI del stack (D1, CLAUDE.md). | Preact, Vue: fuera del stack. |
| `@tanstack/react-query` (5) | frontend | Stack de CLAUDE.md. Da caché por clave, estados de carga y error (principio 8), invalidación tras guardar (RF15, RF26) y descarta respuestas de búsquedas antiguas (V2) al ir cada texto en su clave. | `useEffect` + `fetch` a mano: más código y carreras. |
| `react-router` (7) | frontend | Rutas por URL y `?q=` en la URL (U4, V1, RF6, RF7) con `useSearchParams`. En v7 el paquete único incluye la versión para DOM. | History API a mano (más código y fallos); `wouter` (menos estándar). |
| `zod` (misma versión que el backend, 4.6.7) | frontend | Valida el cuerpo de cada respuesta, incluido el de error, en el borde (RF34). Sin versión nueva en el árbol de dependencias. | Guardas de tipo a mano: más código y menos garantías. |
| `vite` y `@vitejs/plugin-react` | frontend (dev) | Servidor de desarrollo y empaquetado del stack (D1), con el proxy de RF37. | Webpack, CRA: más pesados y sin mantenimiento. |
| `@types/react`, `@types/react-dom` | frontend (dev) | Tipos de React (TypeScript estricto). | Ninguna. |
| `jsdom` | frontend (dev) | Entorno DOM para Vitest (CA1). | `happy-dom`: menos fiel en eventos y formularios. |
| `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` | frontend (dev) | Pruebas de componentes por rol y nombre accesible (RF33), eventos de usuario reales (doble clic, teclado) y aserciones legibles. | Enzyme (obsoleto); aserciones sobre el DOM a mano. |
| `eslint-plugin-react-hooks` | raíz (dev) | Reglas de los Hooks y `exhaustive-deps`: evitan fallos de estado y de caché difíciles de ver. | Sin plugin (más errores en revisión). |
| `concurrently` | raíz (dev) | `npm run dev` debe levantar backend y frontend a la vez (CA8), también en Windows y cerrando ambos con Ctrl+C. | `scripts/dev.mjs` propio: gestión de señales y salida en Windows a mano. |

**Sin librería nueva para:** estado global (Redux, Zustand), peticiones (Axios: basta `fetch`), estilos (Tailwind, CSS-in-JS: se usan los tokens CSS de `DESIGN.md` tal cual), gráficos (la barra apilada son 4 elementos con `flex`, no hace falta una librería), formularios (`react-hook-form`: son 5 campos controlados), mocks de red (`msw`: se sustituye `fetch` con `vi.stubGlobal`), accesibilidad estática (`eslint-plugin-jsx-a11y`: la accesibilidad se prueba con consultas por rol y con la comprobación manual de CA7) ni la Fullscreen API (el modo presentación es solo de diseño).

**Fuente Inter:** se carga con `<link>` a Google Fonts como pide `DESIGN.md`, con `system-ui` de respaldo. Sin dependencia (`@fontsource/inter` descartado).

## 3. Archivos por capa
Ningún archivo supera 200 líneas ni ninguna función 40 (los CSS se parten por área). Los `.test.ts(x)` están junto a su archivo.

```
shared/src/customers/types.ts          Customer + simulationCount: number                                   RF1, RF35
shared/src/customers/types.test.ts     + simulationCount en las fixtures y la forma del tipo

backend/src/repositories/customer-row.ts        CustomerRow + simulation_count; CUSTOMER_COLUMNS (RETURNING) y
                                                CUSTOMER_SELECT (+ subconsulta COUNT sobre simulations); rowToCustomer lo mapea   RF1, RF3
backend/src/repositories/customers.repository.ts  SELECT por id, por clave, todos y búsqueda usan CUSTOMER_SELECT;
                                                insert devuelve simulationCount 0 sin subconsulta                          RF1, RF3
backend/src/repositories/customers.repository.test.ts   ajustado: cuenta 0, 1 y 3 simulaciones
backend/test/customers-*.int.test.ts, persistence.int.test.ts, helpers/seed-customers.ts   ajustados solo en simulationCount
backend/test/customers-simulation-count.int.test.ts   nuevo: RF1 a RF3 y paridad con calculateQuote (CA2)

package.json                           workspaces + frontend; scripts dev, dev:backend, dev:frontend, lint; devDeps    RF37
vitest.config.ts                       projects: "node" (shared y backend) y "frontend" (jsdom)                          RF37
eslint.config.js                       + bloque frontend/**/*.{ts,tsx} con react-hooks
.gitignore                             + frontend/dist

frontend/
  package.json  index.html (lang="es", Inter, <div id="root">)  tsconfig.json  vite.config.ts
  proxy-config.ts                      createProxyConfig(env): /api → BACKEND_URL (por defecto http://localhost:3000)   RF37
  proxy-config.test.ts
  src/
    main.tsx                           arranque: applyTheme → QueryClientProvider (retry: false) → BrowserRouter → providers
    App.tsx                            rutas V1 y layout (Header + contenido)                                           RF9, RF17
    test/setup.ts                      jest-dom, cleanup, localStorage limpio; test/global-setup.ts: TZ = UTC
    test/render.tsx                    renderApp({ route, fetch }): QueryClient sin reintentos + MemoryRouter + providers
    test/fixtures.ts                   clientes, simulaciones, tipos, errores de la API (literales de la spec)
    test/mock-fetch.ts                 mockFetch(rutas): sustituye fetch con vi.stubGlobal y registra las llamadas
    design-tokens.test.ts              CA6: sin colores a mano; tokens.css = bloque CSS de DESIGN.md; sin CHF ni JPY
    styles/tokens.css                  los tokens de DESIGN.md (:root y [data-theme="light"])                            RF31
    styles/base.css                    reset, tipografía, tabular-nums, foco 2 px, reduced-motion                        RF31
    styles/layout.css                  header, rejilla 1/2/3, ancho 1200, sin scroll horizontal                          RF32
    styles/components.css              tarjetas, chips, badges, botones (44 px), estados                                 RF31
    styles/simulator.css               slider con marcas, barra apilada, tabla, presentación                             RF20, RF21, RF30
    api/
      client.ts                        apiRequest(path, schema, init?) con fetch, prefijo /api, JSON y errores            RF34, RF37
      errors.ts                        ApiError, toApiError, generalMessage, GENERAL_ERROR_MESSAGE                        RF14, RF34
      schemas.ts                       Zod de customer, lista, simulación (con tiers), tipos y error de la API            RF34
      query-keys.ts                    claves de caché                                                                    RF15, RF26
      customers.queries.ts             useCustomers(q), useCustomer(id), useCustomerSimulations(id)                       RF4, RF16
      customers.mutations.ts           useCreateCustomer()                                                                RF11, RF15
      simulations.mutations.ts         useCreateSimulation(customerId)                                                    RF25, RF26
      rates.queries.ts                 useExchangeRates() (retry false, sin refetch automático)                           RF23, RF24
    lib/
      format-money.ts                  formatMoney (Intl es-ES + código de divisa, NBSP)                                  RF39
      format-date.ts                   formatDateTime, formatClock, oldestRateAt                                          RF28, RF39, V5, V8
      parse-count-field.ts             parseCountField(texto, max)                                                        RF20, RF22
      theme.ts                         readTheme, writeTheme, applyTheme                                                  RF29
      keyboard.ts                      isTypingTarget, isPresentationHotkey                                               RF30
      pluralize.ts                     simulationsLabel(n)                                                                RF4
    state/
      currency-context.tsx             CurrencyProvider: divisa activa, tipos, disponibilidad, reintentar                 RF23, RF24, RF28
      presentation-context.tsx         PresentationProvider + hook de teclado (P, Esc)                                    RF30
    ui/
      States.tsx                       Skeleton, ErrorState (Reintentar), EmptyState                                      RF5, RF17
      LiveRegion.tsx                   aria-live="polite" con espera de 500 ms                                            RF33
      Badge.tsx, Button.tsx, Field.tsx etiqueta + control + error con aria-describedby                                    RF31, RF33
    layout/
      Header.tsx                       logo, SearchBox, CurrencySelect, ThemeToggle                                       RF28
      SearchBox.tsx                    texto local → espera 300 ms → ?q= en la URL; maxLength 100                         RF6, RF7
      CurrencySelect.tsx               EUR/USD/GBP, pie con la hora más antigua, badge y Reintentar                       RF24, RF28
      ThemeToggle.tsx                                                                                                      RF29
    customers/
      CustomersPage.tsx                lista, búsqueda, estados, "Mostrando N de TOTAL"                                   RF4–RF8
      CustomerCard.tsx                                                                                                     RF4, RF9
      NewCustomerPage.tsx, CustomerForm.tsx   formulario y envío                                                          RF10, RF11, RF13–RF15
      customer-form-errors.ts          campo → control, mapa de reason, aviso general                                     RF12
      CustomerDetailPage.tsx           datos, simulador, lista, estados                                                   RF16, RF17, RF30
      SimulationList.tsx, SavedQuote.tsx   presupuestos guardados (sin reconvertir)                                       RF16, RF18
    simulator/
      Simulator.tsx                    borrador, vista previa, guardar, resultado                                         RF19, RF25, RF26
      UsersControl.tsx                 slider 0–100 con marcas + campo 0–100 000                                          RF20
      ResourceFields.tsx               storage y apiCalls                                                                 RF22
      QuoteChart.tsx, QuoteTable.tsx   barra apilada y tabla unidades × precio = subtotal                                RF21, RF40
      chart-model.ts                   buildChartModel, halfUpPercent                                                     RF21, RF40
      ConvertedPreview.tsx             vista previa convertida y tipo                                                     RF23
      simulator-errors.ts              errores del POST → control o aviso general                                         RF27
      request.ts                       buildSimulationRequest                                                             RF25
```

## 4. Funciones puras (firmas)
```ts
// shared/ (sin cambios de lógica): calculateQuote(input?: unknown): QuoteResult · convertQuote(quote, micros): ConvertedAmounts
//   parseRateText(text: string): ParseRateResult · CURRENCIES, PLANS, ISO_3166_ALPHA2, MAX_USERS, RESOURCE_MAX

// frontend/src/lib
export type CountParse = { ok: true; value: number } | { ok: false; message: string };
export function parseCountField(text: string, max: number): CountParse;
//   recorta espacios de los extremos; exige /^[0-9]+$/ (vacío, signo, decimales, exponente, separadores y
//   dígitos no ASCII son error); rechaza más de 15 dígitos antes de convertir; 0 ≤ valor ≤ max (RF20, RF22)

export function formatMoney(cents: number, currency: Currency): string;
//   "1.234,56 EUR" (NBSP antes del código). Parte entera con Intl.NumberFormat('es-ES', { useGrouping: 'always' })
//   y los dos decimales con el resto entero. 0 → "0,00 EUR", nunca "-0,00" (RF39)
export function formatDateTime(iso: string): string;     // hora local, es-ES (V8)
export function formatClock(iso: string): string;        // "09:00", 24 h, hora local (V5)
export function oldestRateAt(items: readonly { exchangeRateAt: string }[]): string | undefined;
export function simulationsLabel(count: number): string; // "0 simulaciones", "1 simulación", "2 simulaciones"

export type Theme = 'light' | 'dark';
export function readTheme(storage: Pick<Storage, 'getItem'> | undefined): Theme; // light solo si vale exactamente "light"; error de acceso → dark
export function writeTheme(storage: Pick<Storage, 'setItem'> | undefined, theme: Theme): void;
export function applyTheme(root: HTMLElement, theme: Theme): void;               // data-theme en <html>

export function isTypingTarget(target: EventTarget | null): boolean;  // input (incluido range), select, textarea, contentEditable
export function isPresentationHotkey(e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey' | 'target'>): boolean;

// frontend/src/simulator
export interface ChartSegment { key: 'tier1' | 'tier2' | 'tier3' | 'vat'; label: string; cents: number; labelOutside: boolean; }
export interface ChartModel { segments: ChartSegment[]; title: string; subtitle: string | undefined; }
export function buildChartModel(quote: Pick<Quote, 'tiers' | 'baseCents' | 'vatCents' | 'totalCents'>, currency: Currency): ChartModel;
//   segmentos con 0 no se dibujan; labelOutside si cents × 100 < 12 × totalCents (enteros); el ancho en CSS es flex-grow = cents
export function halfUpPercent(part: number, whole: number): number;  // ⌊(2·part + whole) / (2·whole)·100⌋ con enteros; whole 0 → 0
export function buildSimulationRequest(customerId: number, draft: { users: number; storage: number; apiCalls: number }, currency: Currency): SimulationInput;

// frontend/src/api
export type ApiErrorKind = 'api' | 'network' | 'invalid-response';
export class ApiError extends Error { kind: ApiErrorKind; status?: number; code?: ApiErrorCode; fields: FieldError[]; existingId?: number; }
export function toApiError(status: number, body: unknown): ApiError;  // forma { error: { code, message, details? } } validada con Zod; si falla → kind 'invalid-response'
export function generalMessage(error: unknown): string;               // message del backend o GENERAL_ERROR_MESSAGE; nunca traza ni JSON (RF34)
export function apiRequest<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T>;

// frontend/src/customers/customer-form-errors.ts
export type FormControl = 'companyName' | 'country' | 'taxId' | 'email' | 'plan';
export function splitFieldErrors(fields: readonly FieldError[]): { byControl: Partial<Record<FormControl, string[]>>; general: string[] };
export function fieldErrorText(error: FieldError): string;  // reason traducido (COUNTRY_PREFIX, ALL_ZEROS, FIRST_DIGIT, IT_OFFICE_CODE) o message; + suggestion

// frontend/proxy-config.ts
export function createProxyConfig(env: { BACKEND_URL?: string }): Record<string, { target: string; changeOrigin: true; rewrite: (path: string) => string }>;
```

## 5. Contrato de la API que usa la interfaz
Base: `/api`, que Vite reenvía a `http://localhost:3000` sin el prefijo. Salvo `simulationCount`, las formas son las de las specs 001 a 004.

`GET /api/customers?q=acme` → 200 (el cliente gana `simulationCount`):
```json
{ "items": [ { "id": 7, "companyName": "Acme Ibérica SL", "taxId": "B12345674", "taxIdType": "CIF", "email": "compras@acme.es", "country": "ES", "plan": "growth", "createdAt": "2026-11-12T10:00:00.000Z", "simulationCount": 2 } ], "total": 1 }
```
`GET /api/customers/7` → 200 con el cliente (misma forma). `POST /api/customers` → 201 con el cliente y `"simulationCount": 0`; 400 `VALIDATION_ERROR` con `details.fields[]` (por ejemplo `UNKNOWN_FIELD` en `simulationCount` si viniera en el cuerpo); 409 `CUSTOMER_ALREADY_EXISTS` con `details.existingId`.

`GET /api/customers/7/simulations` → 200 (la 003 devuelve `{ items: [...] }`; el esquema Zod sigue la forma real del controlador, ver riesgo R2):
```json
{ "items": [ { "id": 2, "customerId": 7, "users": 15, "storage": 0, "apiCalls": 0,
  "tiers": [ { "tier": 1, "from": 1, "to": 10, "unitPriceCents": 1000, "billedUsers": 10, "subtotalCents": 10000 },
             { "tier": 2, "from": 11, "to": 50, "unitPriceCents": 800, "billedUsers": 5, "subtotalCents": 4000 },
             { "tier": 3, "from": 51, "to": null, "unitPriceCents": 500, "billedUsers": 0, "subtotalCents": 0 } ],
  "baseCents": 14000, "country": "ES", "vatRatePercent": 21, "vatCents": 2940, "totalCents": 16940,
  "currency": "USD", "exchangeRate": "1.100000", "exchangeRateAt": "2026-11-13T09:00:00.000Z",
  "convertedBaseCents": 15400, "convertedVatCents": 3234, "convertedTotalCents": 18634,
  "createdAt": "2026-11-13T09:30:00.000Z" } ] }
```
`POST /api/simulations` con `{ "customerId": 7, "users": 15, "storage": 0, "apiCalls": 0, "currency": "USD" }` (solo esos cinco campos, RF25) → 201 con la simulación anterior; 400 con errores de campo; 404 `CUSTOMER_NOT_FOUND`; 500 `EXCHANGE_RATE_UNAVAILABLE`.

`GET /api/exchange-rates` → 200 `{ "items": [ { "currency": "USD", "exchangeRate": "1.100000", "exchangeRateAt": "2026-11-13T09:00:00.000Z" }, { "currency": "GBP", "exchangeRate": "0.850000", "exchangeRateAt": "2026-11-13T09:00:00.000Z" } ] }`; 500 `EXCHANGE_RATE_UNAVAILABLE`.

Errores: `{ "error": { "code": "...", "message": "...", "details": { "fields": [ ... ], "existingId": 1 } } }`. Cualquier respuesta que no cumpla el esquema Zod (de éxito o de error) se trata como `ApiError` de tipo `invalid-response`, con el mensaje general de RF14 (RF34).

## 6. Base de datos
**Sin cambios de esquema ni migración.** `simulationCount` se calcula en cada lectura con una subconsulta correlacionada:
```sql
SELECT id, company_name, ..., created_at,
       (SELECT COUNT(*) FROM simulations WHERE customer_id = customers.id) AS simulation_count
FROM customers ...
```
La usa el índice `simulations_customer_created_idx (customer_id, ...)` que ya existe. No se guarda ninguna columna (RF3). El `INSERT ... RETURNING` de clientes no lleva subconsulta (un cliente nuevo tiene 0). El orden (colación española, desempate por id), la búsqueda y el límite de 50 no cambian (los hace el service). El SQL sigue solo en `repositories/` (principio 6).

## 7. Decisiones tomadas (con alternativa descartada)
- **D-P1 · Proxy de Vite** `/api` → backend con `rewrite` (U6). *Descartado:* CORS en el backend (cambiaría `app.ts` y no hay otro cliente).
- **D-P2 · TanStack Query para el servidor, `useState` y contextos para la interfaz.** Claves: `['customers','list',q]`, `['customers','detail',id]`, `['customers','detail',id,'simulations']`, `['exchange-rates']`. Invalidar `['customers']` tras guardar una simulación cubre cliente, simulaciones y lista (RF26); tras un alta se invalida `['customers','list']` (RF15). `QueryClient` con `retry: false` y sin refetch al enfocar la ventana: el estado de error sale de inmediato y no hay reintentos automáticos (U7). *Descartado:* reintentos por defecto (tardan en mostrar el error y contradicen U7).
- **D-P3 · Búsqueda en la URL.** El texto vive en un estado local del `SearchBox`, y 300 ms después de la última pulsación se escribe `?q=` con `replace`. La clave de caché lleva el `q` recortado, así que una respuesta tardía de otro texto nunca sustituye a la actual (V2). Si el `q` de la URL cambia desde fuera ("borrar búsqueda", enlace, recarga), el campo se sincroniza. Fuera de `/`, escribir navega a `/?q=...` (RF7). *Descartado:* estado local sin URL (no cumple RF6).
- **D-P4 · CSS plano con tokens** de `DESIGN.md` copiados tal cual a `tokens.css`; un test compara ambos. *Descartado:* Tailwind y CSS-in-JS.
- **D-P5 · Barra apilada con `flex` y `flex-grow = céntimos`.** El ancho sale de los importes enteros sin cálculos con decimales; `labelOutside` se decide con una comparación entera. *Descartado:* librería de gráficos (3 colores y 4 segmentos no la justifican).
- **D-P6 · Zod en el frontend** para las respuestas, y `satisfies z.ZodType<Customer>` para atar el esquema al tipo de `shared/`. *Descartado:* confiar en `as` (rompería con un cuerpo inesperado, RF34).
- **D-P7 · Tests con `fetch` sustituido** (`mockFetch`, `vi.stubGlobal`) y reloj falso. *Descartado:* `msw` (dependencia más) y un `ApiClient` inyectado por contexto (más código en producción solo para tests).
- **D-P8 · Reinicio del simulador con `key={customerId}`** (RF38): al cambiar de cliente React destruye el estado local. La divisa activa vive en el header y no se reinicia. *Descartado:* efectos que resetean campo a campo.
- **D-P9 · `formatMoney` con enteros.** Parte entera con `Intl` (con `useGrouping: 'always'`, porque `es-ES` no agrupa los números de cuatro cifras por defecto) y los decimales con `cents % 100`. Evita `cents / 100` y `-0`. *Descartado:* `Intl.NumberFormat` con `style: 'currency'` sobre `cents / 100` (coma flotante y símbolo en lugar del código, contra RF39).
- **D-P10 · `simulationCount` con subconsulta** (sección 6). *Descartado:* columna denormalizada (RF3) y `LEFT JOIN ... GROUP BY` (más SQL para el mismo resultado).
- **D-P11 · Vitest con `projects`** (node y frontend/jsdom) desde la raíz, de modo que `npm test` sigue ejecutando todo. *Descartado:* docblocks `@vitest-environment` en cada archivo y un segundo comando de test. Se confirma la sintaxis de `projects` con la documentación de Vitest 4 al implementar T2.
- **D-P12 · Divisa activa en un contexto** (`CurrencyProvider`) que pide los tipos una vez al arrancar (V6). Si falla, pasa la divisa activa a EUR y deshabilita USD y GBP; "Reintentar" vuelve a pedir y, si responde, solo habilita las opciones (RF24). Se calcula en un `useEffect` sobre el estado de la consulta.
- **D-P13 · Modo presentación** como contexto con un único `keydown` en `window`; solo está disponible mientras el detalle de cliente está montado (al desmontarse sale). *Descartado:* Fullscreen API (pide gesto y permisos y no es lo que describe `DESIGN.md`).
- **D-P14 · Slider nativo `<input type="range">`** (0–100, paso 1) con marcas dibujadas en CSS en el 10 % y el 50 % y su etiqueta de texto, enlazado con el campo numérico. El teclado (flechas, Inicio, Fin, Re Pág, Av Pág) lo da el navegador. *Descartado:* slider propio con ARIA (más código y más riesgo de accesibilidad).
- **D-P15 · Hora con `TZ=UTC`** en los tests (`global-setup.ts`), para que `formatClock` y `formatDateTime` sean deterministas.
- **D-P16 · Tema:** `main.tsx` aplica el tema antes de renderizar. Un `localStorage` que falla (modo privado) cae a oscuro. *Descartado:* script en línea en `index.html` (duplica la lógica; el posible parpadeo del tema claro se acepta).
- **D-P17 · Rutas:** `BrowserRouter`; cualquier ruta no listada en V1 muestra "No encontrado". Un `id` de URL que no es un entero positivo se pide igualmente al backend, que responde `INVALID_ID` (RF17).

## 8. Estrategia de tests (Vitest)
TDD: primero el test en rojo. Los tests de la interfaz sustituyen `fetch` y no llaman a ninguna API real (CA1). Con `jsdom`: `fireEvent.change` para el slider (jsdom no simula las flechas de un `range`; el teclado es nativo y se comprueba a mano, CA7) y `user-event` para el resto. Temporizadores falsos con `advanceTimers` de `user-event` para los 300 ms y los 500 ms.

| Tipo | Qué se prueba | Cubre |
|---|---|---|
| Backend (T1) | `simulationCount` 0, 1 y 3 en `GET /customers`, `GET /customers?q=`, `GET /customers/:id` y 201 del alta; sube tras una simulación y no tras una rechazada; orden, `total` y límite de 50 iguales; `simulationCount` en el cuerpo del alta → 400 `UNKNOWN_FIELD`; paridad: `POST /simulations` en EUR para 0, 1, 10, 11, 50 y 51 usuarios × `ES`, `PT`, `US` es igual a `calculateQuote` | RF1 a RF3, CA2, CA4 |
| Raíz (T2) | `createProxyConfig`: `/api/customers?q=a` → `/customers?q=a`, objetivo por defecto y `BACKEND_URL`; prueba de humo de jsdom | RF37 |
| Puras (T3, T5) | `parseCountField` (tabla de la spec), `formatMoney` (0, 1 210, 100 000 en `PT`, NBSP, sin "-0"), `formatClock` y `oldestRateAt`, `readTheme` (`light`, `dark`, `foo`, sin valor, error de acceso), `isPresentationHotkey`, `toApiError`, `splitFieldErrors`, `halfUpPercent`, `buildChartModel` | RF20, RF22, RF29, RF30, RF34, RF39, RF40 |
| Componentes por pantalla (T3 a T5) | Cada fila de las tablas de casos límite de la spec que se pueda comprobar sin navegador, y para cada pantalla sus estados de carga, error y vacío (CA5) | CA1, CA5 |
| Coherencia (T5) | Para 0, 1, 10, 11, 50 y 51 usuarios y `ES`, `PT`, `US`, el total que muestra el simulador es `formatMoney(calculateQuote(...).totalCents)`; para USD y GBP, la vista previa es `convertQuote` con el tipo del test (51 usuarios en USD: IVA 98,18 y total 565,68) | CA2, RF19, RF23 |
| Solicitud (T5) | `POST /simulations` lleva solo cinco claves y la `currency` activa al pulsar "Guardar"; doble clic → una petición | RF25, CA3 |
| Diseño (T3) | `design-tokens.test.ts`: ningún `#hex`, `rgb(` ni `hsl(` en `frontend/src` fuera de `tokens.css`; `tokens.css` coincide con el bloque CSS de `DESIGN.md`; `DESIGN.md` no contiene CHF ni JPY | CA6, RF31, RF36 |

**Comprobación manual en navegador (CA7)**, que no se prueba en jsdom y la hace el reviewer, con su resultado anotado en la revisión: contraste AA en ambos temas, áreas táctiles de 44 px, sin scroll horizontal a 360 px (con el total de 100 000 usuarios `PT`), rejilla de 1, 2 y 3 columnas, etiqueta fuera del segmento estrecho (11 usuarios), teclado del slider (flechas, Inicio, Fin, Re Pág, Av Pág), `Ctrl+P` (imprimir) sin activar la presentación, y `prefers-reduced-motion`.

## 9. Qué RF cubre cada parte
| Parte | RF |
|---|---|
| `shared` + repositorio y tests del backend (T1) | RF1, RF2, RF3 (y CA2, CA4) |
| Raíz: workspace, scripts, Vitest, ESLint, proxy (T2) | RF37 (y CA8) |
| Base del frontend: API, formato, tema, tokens, header, divisa, estados (T3) | RF7, RF23 (petición de tipos), RF24, RF28, RF29, RF31, RF32, RF33, RF34, RF35, RF39 |
| Lista, búsqueda y alta (T4) | RF4, RF5, RF6, RF8, RF9, RF10, RF11, RF12, RF13, RF14, RF15 |
| Detalle, simulador y presentación (T5) | RF16, RF17, RF18, RF19, RF20, RF21, RF22, RF23 (vista previa), RF25, RF26, RF27, RF30, RF38, RF40 |
| `DESIGN.md`, `MEMORY.md` y cierre (T6) | RF36 (y CA5 a CA9) |

## 10. Riesgos y notas
- **R1 · Versiones y avisos.** No hay acceso a las versiones en vivo en este plan. Al instalar (T2) se comprueba la compatibilidad Vite ↔ Vitest 4 ↔ Node 24 y se ejecuta `npm audit`; cualquier aviso no moderado o en producción detiene la tarea y se consulta.
- **R2 · Forma de la lista de simulaciones.** La spec 003 define el listado y su orden pero el plan no lo reproduce aquí; T3 abre `simulations.controller.ts` y la 003 para fijar el esquema Zod de `GET /customers/:id/simulations` (se supone `{ items }`). Si difiere, se ajusta solo `schemas.ts`.
- **R3 · Fuente externa.** Inter se carga desde Google Fonts (`DESIGN.md`); sin red, el texto cae a `system-ui` sin cambiar el diseño.
- **R4 · Coste del contador.** La subconsulta se calcula para todos los clientes coincidentes antes de limitar a 50. Para una herramienta interna es aceptable (S1 de la 004); si creciera, el contador pasaría a calcularse solo para la página.
- **R5 · `DESIGN.md` y `MEMORY.md`.** La spec indica que el coordinador los actualiza al aprobar (RF36, CA9). T6 solo lo comprueba y lo aplica si falta.
- **R6 · Tamaño de T5.** Es la tarea más grande; está partida en archivos de un solo propósito (sección 3) y el implementer puede entregarla en dos commits si lo ve necesario, sin cambiar el orden.
