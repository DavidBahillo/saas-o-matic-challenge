# 007 · Plan técnico: divisas en vivo, divisa por país y banderas
Spec aprobada (U1 a U7, PT1 a PT6). Tests primero (principio 5): cada tarea escribe sus tests en rojo antes del código.

## 1. Resumen y dependencias
- **Dependencias nuevas: ninguna.** Se usan `fetch` nativo, Zod, `Intl.DisplayNames` y `Intl.NumberFormat` (integrados en Node y en los navegadores).
- **`JSON.parse` con `context.source`** (reviver con el texto crudo del número, PT2): lo exige solo el backend, que es el único que parsea la respuesta del proveedor. Requiere Node ≥ 22 (V8 ≥ 11.4), que ya declara `engines` (`>=22`) y D12 (Node 24.13). El adaptador de Frankfurter ya lo usa, así que no añade riesgo. El navegador nunca parsea JSON del proveedor: recibe el tipo como texto desde `GET /exchange-rates`. Las definiciones de TypeScript (lib ES2023) no incluyen el tercer argumento; se mantiene la interfaz local `ReviverContext` del adaptador actual.
- **Hallazgo que la spec no mencionaba:** la BD tiene `CHECK (currency IN ('EUR','USD','GBP'))` en `simulations` (`schema.ts` y `simulations-migration.ts`). Sin cambiarlo, guardar una simulación en CHF falla. Se resuelve con una migración (sección 5).

## 2. Archivos por capa

### `shared/` (bloque A)
- `shared/src/currency/types.ts`: `CURRENCIES` pasa a la lista fija de 23 (EUR primero, orden de RF1). `Currency` y `ForeignCurrency` se derivan de ella. Constantes de rango sin cambios.
- `shared/src/countries/country-currency.ts` (nuevo): tabla fija agrupada por divisa y función pura. Cubre al menos: países del euro (AT, BE, BG, CY, DE, EE, ES, FI, FR, GR, HR, IE, IT, LT, LU, LV, MT, NL, PT, SI, SK, AD, MC, SM, VA, ME), USD (US, PR, GU, VI, AS, MP, UM, EC, SV, PA, TL, FM, MH, PW), GB, CH y LI, y un país por cada divisa restante de la lista.
- `shared/src/index.ts`: exporta `currencyForCountry` y los tipos nuevos.
- `shared/src/currency/validate-currency.ts`: sin cambios de código; la `suggestion` se calcula de `CURRENCIES` y pasa sola a la lista nueva.
- Sin cambios: `parse-rate.ts` (`parseRateText` ya cumple RF3: patrón decimal, half-up a 6 decimales, rango), `convert-*`.

### `backend/` (bloque B)
- `routes/` y `controllers/`: sin cambios. `GET /exchange-rates` sigue llamando a `service.getAll()`; la tolerancia vive en el servicio.
- `rates/constants.ts`: `DEFAULT_EXCHANGE_RATES_URL = 'https://open.er-api.com/v6/latest/EUR'` y `RATE_FAILURE_COOLDOWN_MS = 60_000` (PT5).
- `rates/rate-provider.ts`: `RateProvider.fetchRates(): Promise<RawRates>`; `RawRates` es el texto crudo de cada divisa extranjera de la lista que traiga la respuesta.
- `rates/open-er-api.provider.ts` (nuevo, sustituye a `frankfurter.provider.ts` y su test): `fetch` con timeout de 5 s, `result`, `base_code` y `rates` validados con Zod (`rates` como `record` de `unknown`, para que un valor malo invalide solo esa divisa), reviver con `source`. Mensajes de error fijos, sin URL ni cuerpo (CA7 de la 004).
- `rates/build-pairs.ts` (nuevo, puro): `RawRates` → `Map<ForeignCurrency, RateMicros>` con `parseRateText`; descarta las inválidas o fuera de rango (RF3, RF5).
- `rates/snapshot-store.ts` (nuevo): caché única, petición en vuelo compartida, vigencia de 24 h, enfriamiento de 60 s y lanzamiento del 500 (RF4, RF6, RF7).
- `services/exchange-rates.service.ts`: se adelgaza. Mantiene la interfaz `getRate` y `getAll`; ahora usa el almacén. `getRate` lanza `exchangeRateUnavailable()` si falta la divisa en el snapshot (RF5).
- `config.ts`: ya valida https (`z.url` con protocolo `https`); solo cambia el valor por defecto (constante) y su comentario. La spec exige que una URL no https impida arrancar: ya ocurre y se cubre con un test.
- `app.ts` y `server.ts`: usan `createOpenErApiProvider({ url })`. `app.ts` usa la constante por defecto cuando los tests no inyectan proveedor.
- `repositories/schema.ts`: el `CHECK` de `currency` pasa a `length(currency) = 3` para BD nuevas.
- `repositories/simulations-migration.ts`: mismo cambio en `CURRENCY_COLUMNS`.
- `repositories/simulations-currency-check.ts` (nuevo): migración idempotente que reconstruye `simulations` si su SQL contiene la lista antigua (sección 5). Se llama desde `schema.ts` tras `migrateSimulationCurrency`.
- `seed/seed-rates.ts`: `SEED_RATE_TEXTS` pasa de `Record<ForeignCurrency, …>` a `Record<'USD' | 'GBP', …>`, porque `ForeignCurrency` ahora tiene 22 valores. `getRate` de una divisa sin tipo semilla seguirá lanzando; el seed solo usa USD y GBP (U5 de la 006).

### `frontend/` (bloque C)
- `api/schemas.ts`: la divisa de una simulación y de un tipo pasa de `z.enum([...])` a `z.string().regex(/^[A-Z]{3}$/)` (PT6, RF17).
- `lib/currency-names.ts` (nuevo): `currencyName(code)` con `Intl.DisplayNames('es', { type: 'currency' })`; devuelve el código si no lo conoce.
- `lib/country-names.ts` (nuevo): `countryName(code)` con `type: 'region'`; devuelve el código si falla o no lo conoce (RF19).
- `lib/flag-url.ts` (nuevo, puro): `FLAG_CDN_BASE`, `isFlagCode(code)` (`^[A-Z]{2}$`) y `flagSources(code)` → `{ src, srcSet }` (RF18, RF21).
- `ui/CountryFlag.tsx` (nuevo): imagen más código visible, respaldo con `onError` (RF18 a RF21).
- `ui/RatesAttribution.tsx` (nuevo): enlace "Tipos de cambio por ExchangeRate-API" (RF12).
- `state/currency-context.tsx`: añade `beginVisit`, `applyCountryCurrency` y la marca de elección manual; RF11 (vuelta a EUR si la activa deja de estar disponible).
- `state/use-currency-preselection.ts` (nuevo): hook de RF14 y RF15.
- `layout/CurrencySelect.tsx`: lista completa con nombre, deshabilitadas sin tipo, atribución, badge solo si fallan todos.
- `customers/CustomerCard.tsx` y `CustomerDetailPage.tsx`: bandera en lugar del badge de país; el detalle espera la preselección antes de pintar el simulador y se reinicia por visita.
- `styles/components.css`: estilos de `.country` con tokens de `DESIGN.md` (nada de colores escritos a mano).

### Documentación (bloque C)
- `DESIGN.md`, `README.md`, `MEMORY.md` y notas de enmienda en `specs/004-currency/spec.md` y `specs/005-dashboard-ui/spec.md` (RF22).

## 3. Funciones puras con sus firmas
```ts
// shared/src/countries/country-currency.ts
export type CountryCurrencyResult = { ok: true; currency: Currency } | { ok: false };
export const COUNTRY_CURRENCY: ReadonlyMap<string, Currency>;   // tabla explícita, sin EUR por defecto
export function currencyForCountry(code: string): CountryCurrencyResult; // ISO sin entrada → EUR; no ISO → { ok:false }

// backend/src/rates/rate-provider.ts
export type RawRates = Readonly<Partial<Record<ForeignCurrency, string>>>;
export interface RateProvider { fetchRates(): Promise<RawRates>; }

// backend/src/rates/build-pairs.ts
export function buildPairs(raw: RawRates): ReadonlyMap<ForeignCurrency, RateMicros>;

// backend/src/rates/snapshot-store.ts
export interface RateSnapshot { at: Date; pairs: ReadonlyMap<ForeignCurrency, RateMicros>; }
export interface SnapshotStore { get(): Promise<RateSnapshot>; }
export function createSnapshotStore(deps: { provider: RateProvider; now: Clock }): SnapshotStore;

// frontend/src/lib/flag-url.ts
export const FLAG_CDN_BASE = 'https://flagcdn.com';
export function isFlagCode(code: string): boolean;
export function flagSources(code: string): { src: string; srcSet: string };  // w20 y w40 2x

// frontend/src/lib/currency-names.ts, country-names.ts
export function currencyName(code: string): string;
export function countryName(code: string): string;
```

## 4. Contrato de la API
`GET /exchange-rates` mantiene la forma de la 004. Cambia solo qué contiene.

200, con SEK ausente en la respuesta del proveedor (tolerancia, RF5 y RF8):
```json
{ "items": [
  { "currency": "USD", "exchangeRate": "1.100000", "exchangeRateAt": "2026-11-13T09:00:00.000Z" },
  { "currency": "GBP", "exchangeRate": "0.850000", "exchangeRateAt": "2026-11-13T09:00:00.000Z" },
  { "currency": "CHF", "exchangeRate": "0.950000", "exchangeRateAt": "2026-11-13T09:00:00.000Z" }
] }
```
`exchangeRateAt` es el mismo instante de recepción para todos. Orden: el de `CURRENCIES` sin EUR. Sin ninguna divisa válida, o sin snapshot, 500:
```json
{ "error": { "code": "EXCHANGE_RATE_UNAVAILABLE", "message": "No se pudo obtener el tipo de cambio. Inténtalo de nuevo más tarde." } }
```
`POST /simulations` con una divisa de la lista ausente en el snapshot: el mismo 500, sin guardar nada. `CURRENCY_NOT_AVAILABLE` lleva ahora la lista completa en `suggestion` (`"EUR, USD, GBP, CHF, ..."`).

Respuesta del proveedor (open.er-api.com), solo los campos que se usan:
```json
{ "result": "success", "base_code": "EUR", "time_last_update_unix": 1763000000,
  "rates": { "EUR": 1, "USD": 1.1, "CHF": 0.95, "SEK": 11.5 } }
```

## 5. Cambios en la base de datos
Sin columnas nuevas. Sí cambia el `CHECK` de `simulations.currency`:
- BD nueva: `CHECK (length(currency) = 3)` en `schema.ts` (la validación real sigue en `shared/`; el CHECK es red de integridad).
- BD existente con el CHECK antiguo: `simulations-currency-check.ts` detecta la lista antigua en `sqlite_master.sql` y, en una transacción, crea `simulations_new` con el DDL actual, copia todas las filas con su `id`, borra `simulations`, renombra y recrea el índice `simulations_customer_created_idx`. Es idempotente: con el CHECK nuevo no hace nada. Las filas, su orden, la FK `ON DELETE RESTRICT` y `PRAGMA foreign_keys = ON` se conservan. Nada referencia a `simulations`, así que borrarla es seguro.
- Orden de migraciones: `DDL`, `migrateSimulationCurrency` (003 → 004, ya con el CHECK nuevo) y `migrateSimulationCurrencyCheck`.

## 6. Decisiones (con la alternativa descartada)
- Una sola respuesta del proveedor alimenta una caché única (PT1). *Descartado:* una llamada y una caché por divisa.
- El almacén de snapshot es un módulo propio y el servicio queda fino, para respetar las 200 líneas. *Descartado:* meter todo en el servicio.
- La tolerancia por divisa se decide al construir los pares (`buildPairs`), no al servir. Así una divisa mala nunca llega a la caché. *Descartado:* validar en cada lectura.
- Fallo total: 500 sin usar el snapshot caducado; tras un fallo, 60 s sin llamar al proveedor (PT5). El reloj hacia atrás no activa el enfriamiento (como V4 de la 004). *Descartado:* sin enfriamiento.
- El provider devuelve texto crudo y `buildPairs` reutiliza `parseRateText` de `shared/`; una sola regla de parseo. *Descartado:* parsear con `Number` en el adaptador.
- CHECK de la BD relajado a `length = 3` y reconstrucción de tabla. *Descartado:* ampliar la lista del CHECK (obliga a otra migración cada vez que cambie la lista) y quitar el CHECK.
- Preselección en un hook propio y detalle reiniciado por visita (`key={id}`): cada entrada, recarga o cambio de cliente monta un detalle nuevo con su propio estado. *Descartado:* un efecto global que escuche la URL.
- Banderas: `<img>` con `width`/`height` fijos (20×15) y `loading="lazy"`; el respaldo es solo `onError` (RF20). *Descartado:* temporizador, emoji y SVG locales.

## 7. Preselección (RF11, RF14, RF15)
- `CustomerDetailPage` monta `CustomerVisit` con `key={id}`. Al montar llama a `beginVisit()` (marca "sin elección manual").
- `setCurrency` del selector marca elección manual. `applyCountryCurrency` cambia la divisa sin marcar.
- Mientras no estén resueltos cliente y tipos (`status !== 'loading'`), se muestra el esqueleto de carga y no el simulador, así no hay importes en divisa provisional.
- Con `status === 'ready'` y sin elección manual: se aplica la divisa del país si está disponible en el snapshot; si no, EUR. Se marca como aplicada una sola vez.
- Con `status === 'unavailable'`: EUR, y la aplicación queda pendiente. Si "Reintentar" tiene éxito y no hay elección manual, se aplica la pendiente.
- País inválido (`currencyForCountry` devuelve `ok: false`): EUR, sin error. Cliente 404 o con error: no se toca la divisa.
- RF11 en el contexto: si `status` es `ready` o `unavailable` y la divisa activa no está disponible, vuelve a EUR.

## 8. Estrategia de tests (Vitest)
- **shared:** `country-currency.test.ts` (todo código ISO de `ISO_3166_ALPHA2` da una divisa de la lista; cada entrada de la tabla es ISO y sin duplicados; JP, AR y AQ dan EUR; `UK` y `XX` dan error; BG da EUR). Ajustes en `validate-currency.test.ts` (lista y `suggestion`), `convert-*` y `currency.properties.test.ts` (CA3: las 23 divisas con 0, 1, 10, 11, 50 y 51, el tope de 100 y -0).
- **backend:** `open-er-api.provider.test.ts` (fetch simulado: formas válidas e inválidas, texto crudo, `1e1`, texto y `null`), `build-pairs.test.ts` (rangos y redondeo del spec), `snapshot-store.test.ts` (reloj controlado: 24 h, reloj atrás, petición en vuelo compartida, enfriamiento de 60 s, cero divisas válidas), `exchange-rates.service.test.ts` y `exchange-rates.http.test.ts` (tolerancia y 500), `simulations.http.currency*.test.ts` (CHF, divisa ausente, divisa fuera de la lista), `simulations-currency-check.test.ts` (migración sobre una BD con el CHECK antiguo, doble ejecución, BD nueva, inserción directa de `JPY` y lectura), `config.test.ts` (URL no https). Ningún test llama a una API real.
- **frontend:** `flag-url.test.ts`, `CountryFlag.test.tsx` (URL, `srcset`, `alt`, `width`/`height`, `loading`, `error`, código inválido, `XK`), `currency-names.test.ts`, `CurrencySelect.test.tsx` (orden, nombres, deshabilitadas, atribución, badge solo si fallan todos), `currency-context.test.tsx` (RF11), `use-currency-preselection` vía `CustomerDetailPage.test.tsx` (todas las filas de la tabla de preselección: orden de carga, Reintentar, elección manual, A→B→A, recarga, 404, país inválido), `schemas.test.ts` (divisa fuera de la lista se acepta), prueba de guardar mientras cambia la divisa (RF16) y de simulación en `JPY` (RF17).
- **Manual (CA7):** banderas y contraste a 360 px y escritorio, respaldo sin red real, selector largo con teclado y lector, y ausencia de parpadeo.

## 9. Cobertura de RF
| RF | Dónde |
|---|---|
| RF1 | `shared/currency/types.ts`, `validate-currency`, tests de shared |
| RF2 | `open-er-api.provider.ts`, `config.ts`, `app.ts`, `server.ts` |
| RF3 | `open-er-api.provider.ts`, `build-pairs.ts`, `parse-rate.ts` |
| RF4, RF6, RF7 | `snapshot-store.ts` |
| RF5, RF8 | `build-pairs.ts`, `exchange-rates.service.ts`, controlador sin cambios |
| RF9, RF12 | `CurrencySelect.tsx`, `currency-names.ts`, `RatesAttribution.tsx` |
| RF10 | `Simulator.tsx` y `ConvertedPreview` (ya existentes) con tipos del contexto |
| RF11, RF14, RF15 | `currency-context.tsx`, `use-currency-preselection.ts`, `CustomerDetailPage.tsx` |
| RF13 | `country-currency.ts` |
| RF16 | `use-simulator-save.ts` (ya envía la divisa activa al pulsar; solo se añade el test) |
| RF17 | `schemas.ts`, migración del CHECK, tests |
| RF18 a RF21 | `flag-url.ts`, `country-names.ts`, `CountryFlag.tsx`, `CustomerCard.tsx`, `CustomerDetailPage.tsx` |
| RF22 | documentación y notas de enmienda |

## 10. Riesgos
- Rangos de la lista: los tipos reales pueden salirse de 0,01 a 100 para alguna divisa (p. ej. TRY). Mitigación: tolerancia por divisa (RF5) y verificación de la lista antes de cerrar T1.
- El proveedor puede cambiar su forma o sus términos de uso (límite de peticiones y atribución). Mitigación: Zod estricto, una llamada por snapshot y enfriamiento; verificar los términos vigentes al implementar T3 y T5.
- La reconstrucción de `simulations` toca datos reales: se prueba con copia de una BD de la 004 y se ejecuta en una transacción.
- Una divisa ausente en un snapshot queda no disponible hasta 24 h (PT4). Es una consecuencia aceptada.
- Seed y tests de la 006 dependen del tipo `ForeignCurrency`: se ajustan en T3.
- `Intl.DisplayNames` puede dar nombres distintos según el navegador; los tests solo comprueban que no queda vacío ni lanza.
