# 004 · Plan técnico — Divisa de las simulaciones con tipo de cambio congelado
Spec: [spec.md](spec.md) (aprobada, con V1 a V5) · Decisiones: MEMORY.md D2, D4, D9, D13 y D14 (y D15, que se añade en T1) · Tareas: [tasks.md](tasks.md)

## 1. Resumen
- La conversión es **lógica pura en `shared/src/currency/`**, con tipos en micro-unidades enteras: `parseRateText`, `formatRate`, `convertCents`, `convertQuote` y `validateCurrency`. La misma función la usará la interfaz (005) para la vista previa.
- El backend añade una capa de tipos de cambio: un **proveedor** (adaptador de `fetch` nativo, sin dependencias) y un **servicio con caché en memoria** que decide qué tipo es vigente. Ambos se inyectan en `createApp`, igual que el reloj, para probar sin red.
- El alta pasa a ser asíncrona, porque la llamada a la API lo es. El orden queda fijo por RF14: validar → cliente → precio en euros → tipo → convertir → guardar. El INSERT sigue en una transacción síncrona de better-sqlite3 y el `await` va **antes** de ella.
- La simulación congela `currency`, el tipo (como entero en micro-unidades) y `exchangeRateAt`, más los tres importes convertidos. Las simulaciones de la 003 se migran como EUR con una migración idempotente.
- Capas del backend: `routes → controllers → services → repositories`; la integración con la API vive en `rates/` (infraestructura), no en los repositorios.

## 2. Dependencias y proveedor
**Ninguna dependencia nueva.** Se usa `fetch` y `AbortSignal.timeout` nativos de Node ≥ 22 (D12), y `zod@4`, que ya está.

### Proveedor propuesto: Frankfurter (tipos de referencia del BCE)
- URL base por defecto: `https://api.frankfurter.dev/v1/latest`. Petición por divisa: `GET {base}?base=EUR&symbols=USD`.
- Respuesta esperada (solo se exige lo que usamos): `{ "base": "EUR", "rates": { "USD": 1.1 } }`. Los demás campos se ignoran.
- **No necesita clave ni registro.** El tipo es una referencia diaria del BCE, que encaja con S2 de la spec (valor de referencia, no cotización) y con la caché de 24 h.
- La URL se puede cambiar con la variable de entorno `EXCHANGE_RATES_URL`, validada con Zod en `config.ts` (URL `https`, por defecto la de arriba). Así los tests de arranque y un cambio de proveedor futuro no tocan el código.
- **Si se eligiera un proveedor con clave:** la clave iría en la variable `EXCHANGE_RATES_API_KEY`, validada en `config.ts` con Zod, solo en el servidor, fuera del repositorio (`.env` ignorado por git, con un `.env.example` sin valor), y nunca en el log, en la respuesta ni en los mensajes de error (CA7). Con Frankfurter no hace falta.
- **Aviso:** la URL y la forma de la respuesta salen del conocimiento del planner, no de una comprobación en vivo (no tengo acceso a red). T4 empieza comprobando a mano una petición real y, si difieren, se ajusta **solo el adaptador** (`frankfurter.provider.ts`); el resto del diseño no cambia. Hay una pregunta abierta para el usuario (sección 11).

### Texto decimal sin float (RF11)
La API devuelve el tipo como número JSON (`1.1`). Para no pasar por coma flotante, el adaptador lee la respuesta como texto y usa el reviver de `JSON.parse`, que desde Node 22 (V8 12) recibe como tercer argumento `{ source }` con el texto original del número. Se captura ese texto para la divisa pedida y se pasa a `parseRateText`. Las definiciones de tipos de la librería TypeScript pueden no incluir ese tercer argumento: se declara una interfaz mínima local (`ReviverContext { source?: string }`), sin `any`. Si en T4 el reviver no resultara fiable, la alternativa es una expresión regular estricta sobre el texto crudo, **después** de validar la forma con Zod.

## 3. Archivos por capa
```
shared/src/currency/
  types.ts                  Currency, CURRENCIES, RATE_MIN_MICROS, RATE_MAX_MICROS, EUR_MICROS, RateMicros   RF8, RF11, RF12
  parse-rate.ts             parseRateText (texto decimal → micro-unidades, half-up, rango)                 RF11, RF12
  format-rate.ts            formatRate (micro-unidades → "1.100000")                                       RF11
  convert-cents.ts          convertCents (half-up con enteros)                                              RF5, RF9, RF10
  convert-quote.ts          convertQuote (base e IVA por separado, total = suma)                            RF5–RF7, RF9
  validate-currency.ts      validateCurrency (INVALID_TYPE, INVALID_CURRENCY, CURRENCY_NOT_AVAILABLE)       RF13
  (cada uno con su .test.ts; + currency.properties.test.ts para CA9)
shared/src/simulations/types.ts            SimulationInput + currency; Simulation + campos de RF8 (T3)
shared/src/simulations/validate-simulation-input.ts   + currency en el orden de RF13 y en SIMULATION_FIELDS
shared/src/customers/types.ts              + INVALID_CURRENCY y CURRENCY_NOT_AVAILABLE (FieldErrorCode), EXCHANGE_RATE_UNAVAILABLE (ApiErrorCode)
shared/src/index.ts                        + exportaciones de currency/

backend/src/
  repositories/schema.ts                   DDL de simulations con las columnas nuevas (BD nueva)
  repositories/simulations-migration.ts    migración idempotente para bases de la 003                       RF20
  repositories/simulation-row.ts           + columnas nuevas; exchange_rate_micros ↔ exchangeRate (formatRate)
  repositories/simulations.repository.ts   insert y lecturas con los campos nuevos                          RF8, RF19
  rates/constants.ts                       RATE_CACHE_TTL_MS = 86_400_000, RATE_FETCH_TIMEOUT_MS = 5_000       RF15, RF16
  rates/rate-provider.ts                   interfaz RateProvider
  rates/frankfurter.provider.ts            adaptador: fetch + timeout + Zod + texto del número              RF11, RF16
  services/exchange-rates.service.ts       caché por divisa, vigencia, reloj, par (tipo, instante)           RF12, RF15–RF18
  services/simulations.service.ts          create asíncrono: cliente → precio → tipo → convertir → insertar  RF1–RF4, RF14
  controllers/simulations.controller.ts    create asíncrono
  controllers/exchange-rates.controller.ts                                                                  RF18
  routes/exchange-rates.routes.ts          GET /exchange-rates; el resto → notFound                         RF18
  schemas/simulation-body.schema.ts        sin cambios de lógica (usa validateSimulationInput)              RF13
  http/errors.ts                           + exchangeRateUnavailable()                                       RF16
  config.ts                                + EXCHANGE_RATES_URL (Zod)
  app.ts                                   + AppDeps.rateProvider? y router; server.ts crea el proveedor real
  tests: ver sección 9

frontend/                                  sin cambios (spec 005)
```
Cada archivo debe quedar por debajo de 200 líneas. `app.ts` ya es largo: si pasa de 150, se extrae la composición de servicios a `backend/src/compose.ts`.

## 4. Funciones puras (shared/)
```ts
export const CURRENCIES = ['EUR', 'USD', 'GBP'] as const;
export type Currency = (typeof CURRENCIES)[number];
export type RateMicros = number;                 // entero: 1,10 → 1_100_000
export const EUR_MICROS = 1_000_000;
export const RATE_MIN_MICROS = 10_000;           // 0,01
export const RATE_MAX_MICROS = 100_000_000;      // 100

/** Texto decimal `^[0-9]+(\.[0-9]+)?$` → micro-unidades, half-up a 6 decimales, rango RF12. Sin Number() sobre el texto. */
export function parseRateText(text: string): { ok: true; micros: RateMicros } | { ok: false };

/** 1_100_000 → "1.100000"; 1_000_000 → "1.000000". */
export function formatRate(micros: RateMicros): string;

/** round_half_up(cents × micros / 1e6) con enteros: p = cents*micros + 500_000; (p - p % 1_000_000) / 1_000_000. */
export function convertCents(cents: number, micros: RateMicros): number;

export interface ConvertedAmounts { convertedBaseCents: number; convertedVatCents: number; convertedTotalCents: number }
/** Base e IVA por separado; total = suma. Entrada: baseCents y vatCents del Quote de la 002. */
export function convertQuote(quote: Pick<Quote, 'baseCents' | 'vatCents'>, micros: RateMicros): ConvertedAmounts;

/** undefined → ok('EUR'); null o no texto → INVALID_TYPE; no `^[A-Z]{3}$` (con `\n` final incluido) → INVALID_CURRENCY; fuera de la lista → CURRENCY_NOT_AVAILABLE con suggestion "EUR, USD, GBP". */
export function validateCurrency(raw: unknown): FieldResult<Currency>;
```
Detalles que el implementer debe respetar:
- `parseRateText` mira solo el 7.º decimal para el redondeo half-up (valores positivos), descarta los demás, y rechaza antes de convertir cualquier parte entera de más de 3 dígitos (fuera de rango). No hay `Number(text)` ni `parseFloat`.
- `convertCents` usa el operador `%` y no una división en coma flotante para el redondeo. La división final es exacta porque el numerador ya es múltiplo de 1 000 000. El `+ 500_000` solo es correcto con importes no negativos (la 002 garantiza esto).
- `convertCents(0, x)` devuelve +0: para evitar −0 no se multiplica por un número negativo y se comprueba con `Object.is` en los tests.
- La regex de `validateCurrency` es `/^[A-Z]{3}$/`, sin banderas. En JavaScript, `$` sin la bandera `m` solo coincide al final de la cadena, así que `"USD\n"` da `INVALID_CURRENCY`; el test de esa fila lo fija.
- `validateSimulationInput` devuelve `currency` ya resuelta (`'EUR'` si falta) y mantiene el orden `customerId, users, storage, apiCalls, currency` y, al final, los desconocidos.

### Exactitud con enteros (RF10)
El producto máximo es 61 520 910 × 100 000 000 = 6,152·10^15 < `MAX_SAFE_INTEGER` (9,007·10^15), más 500 000. Se comprueba en `currency.properties.test.ts` con los extremos del tipo (10 000, 1 000 000 y 100 000 000) y los importes máximos de la 002. Si cambian los límites de usuarios o el rango del tipo, hay que repetir esa comprobación.

## 5. Contrato de la API
### POST /simulations → 201
Request:
```json
{ "customerId": 7, "users": 15, "currency": "USD" }
```
Response 201 (forma de la 003 más los campos de RF8):
```json
{
  "id": 2, "customerId": 7, "users": 15, "storage": 0, "apiCalls": 0,
  "tiers": [
    { "tier": 1, "from": 1,  "to": 10,   "unitPriceCents": 1000, "billedUsers": 10, "subtotalCents": 10000 },
    { "tier": 2, "from": 11, "to": 50,   "unitPriceCents": 800,  "billedUsers": 5,  "subtotalCents": 4000 },
    { "tier": 3, "from": 51, "to": null, "unitPriceCents": 500,  "billedUsers": 0,  "subtotalCents": 0 }
  ],
  "baseCents": 14000, "country": "ES", "vatRatePercent": 21, "vatCents": 2940, "totalCents": 16940,
  "currency": "USD", "exchangeRate": "1.100000", "exchangeRateAt": "2026-11-13T09:00:00.000Z",
  "convertedBaseCents": 15400, "convertedVatCents": 3234, "convertedTotalCents": 18634,
  "createdAt": "2026-11-13T09:30:00.000Z"
}
```
Sin `currency` (o con `"EUR"`): `currency: "EUR"`, `exchangeRate: "1.000000"`, `exchangeRateAt` igual a `createdAt` y los convertidos iguales a los de euros.

Response 400 (divisa no disponible):
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "La petición contiene campos no válidos.",
  "details": { "fields": [ { "field": "currency", "code": "CURRENCY_NOT_AVAILABLE",
    "message": "Divisa no disponible.", "suggestion": "EUR, USD, GBP" } ] } } }
```
Response 500 (sin tipo vigente y la API falla):
```json
{ "error": { "code": "EXCHANGE_RATE_UNAVAILABLE",
  "message": "No se pudo obtener el tipo de cambio. Inténtalo de nuevo más tarde." } }
```
El 500 de `EXCHANGE_RATE_UNAVAILABLE` no lleva `details`. La causa va a `console.error` (como el 500 de la 001 y RF12 de la 003), nunca a la respuesta.

### GET /exchange-rates → 200
```json
{ "items": [
  { "currency": "USD", "exchangeRate": "1.100000", "exchangeRateAt": "2026-11-13T09:00:00.000Z" },
  { "currency": "GBP", "exchangeRate": "0.850000", "exchangeRateAt": "2026-11-13T09:00:00.000Z" }
] }
```
Si falla cualquiera de las dos divisas → 500 `EXCHANGE_RATE_UNAVAILABLE` sin tipos parciales (V2). Se piden en orden USD y GBP, y el primero que falla corta. La query se ignora. Cualquier otro método → 404 `NOT_FOUND` sin leer el cuerpo (el router no monta el transporte JSON, como en la 003).

## 6. Cambios en la base de datos
Columnas nuevas de `simulations`, todas `NOT NULL`:
```sql
currency               TEXT    NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR','USD','GBP')),
exchange_rate_micros   INTEGER NOT NULL DEFAULT 1000000 CHECK (exchange_rate_micros BETWEEN 10000 AND 100000000),
exchange_rate_at       TEXT    NOT NULL DEFAULT '',
converted_base_cents   INTEGER NOT NULL DEFAULT 0 CHECK (converted_base_cents >= 0),
converted_vat_cents    INTEGER NOT NULL DEFAULT 0 CHECK (converted_vat_cents >= 0),
converted_total_cents  INTEGER NOT NULL DEFAULT 0 CHECK (converted_total_cents >= 0)
```
- **Base nueva:** el `CREATE TABLE IF NOT EXISTS simulations` de `schema.ts` ya incluye estas columnas, así que no hace falta migrar.
- **Base de la 003:** `migrateSimulationCurrency(db)` (en `simulations-migration.ts`) lee `PRAGMA table_info(simulations)`. Si `currency` ya existe, no hace nada (idempotente). Si no existe, dentro de una transacción ejecuta seis `ALTER TABLE ... ADD COLUMN` con las definiciones de arriba y un `UPDATE` de relleno: `exchange_rate_at = created_at` y `converted_* = base_cents, vat_cents, total_cents`. Los `DEFAULT` son solo el valor transitorio que exige SQLite para añadir columnas `NOT NULL`; el repositorio siempre escribe todos los campos en las filas nuevas.
- `migrate(db)` llama primero al `DDL` y después a `migrateSimulationCurrency`. No se tocan la tabla `customers`, la clave foránea `ON DELETE RESTRICT`, el índice ni `PRAGMA foreign_keys = ON`.
- El tipo se guarda como entero en micro-unidades; `exchangeRate` en la respuesta se obtiene con `formatRate` en `simulation-row.ts`. `exchange_rate_at` de una fila nueva en EUR es su `created_at`.
- Una tabla `exchange_rates` no hace falta: la caché es solo en memoria (V5), y el único tipo que persiste es el congelado en cada simulación.

## 7. Flujo del alta y de la caché
### `simulationsService.create(input): Promise<Simulation>` (RF14)
1. El controller valida el cuerpo con `parseCreateSimulationBody`. Si falla → 400, sin consultar la BD (RF12 de la spec).
2. `customers.findById(customerId)`; si no existe → `customerNotFound` (404).
3. `calculateQuote({ users, country: customer.country })`; si devuelve errores → `throw new Error(...)` (500 `INTERNAL_ERROR`, RF12 de la 003). Esto ocurre **antes** de pedir el tipo.
4. Si `currency` es `EUR`: tipo `EUR_MICROS` y `at = createdAt`, sin tocar la API ni la caché. Si no: `await rates.getRate(currency)` → `{ micros, at }`.
5. `convertQuote(quote, micros)` y `runInTransaction(() => repository.insert(...))` → 201.
Un fallo en cualquier paso anterior al 5 no escribe nada (CA4). El `await` queda fuera de la transacción, que sigue siendo síncrona.

### `exchangeRatesService.getRate(currency)` (RF15–RF17)
- Estado: `Map<'USD' | 'GBP', { micros, at: Date }>`, en memoria.
- Con entrada en caché y `0 ≤ ahora − at < RATE_CACHE_TTL_MS` → se devuelve sin llamar a la API. Si la antigüedad es de 24 h o más, o negativa (reloj hacia atrás, V4) → se renueva.
- Al renovar: `text = await provider.fetchRate(currency)`; `parseRateText(text)`; si falla el proveedor o el parseo (incluido el rango) → `console.error` con la causa y `throw exchangeRateUnavailable()`. **Nunca** se usa la entrada caducada ni se guarda un dato inválido.
- Éxito: `at = now()` en el instante de recibir la respuesta, se guarda `{ micros, at }` en la caché y se **devuelve el mismo objeto** (no se vuelve a leer de la caché), así que el par (tipo, instante) es coherente aunque otra petición concurrente lo renueve.
- Concurrencia: no se unifican las llamadas (queda fuera de alcance). Varias peticiones simultáneas con caché vacía pueden llamar varias veces a la API; todas responden bien y el último en escribir gana en la caché.
- `getAll()` pide USD y luego GBP y devuelve `items` en ese orden.
- El timeout de 5 s lo aplica el adaptador (`AbortSignal.timeout(RATE_FETCH_TIMEOUT_MS)`). El servicio no usa temporizadores propios, para que los tests no los necesiten.

### Inyección para probar sin red
- `AppDeps` gana `rateProvider?: RateProvider`; por defecto, el adaptador de Frankfurter con la URL de la configuración. El reloj ya existe (`now`) y se reutiliza para la antigüedad de la caché y `exchangeRateAt`.
- `RateProvider` es `{ fetchRate(currency: 'USD' | 'GBP'): Promise<string> }`: devuelve el texto decimal del tipo o lanza. Los tests HTTP usan un proveedor falso que cuenta llamadas, devuelve textos fijos, falla o tarda; no hay ninguna petición real.
- El adaptador recibe `fetchFn` (por defecto `globalThis.fetch`) para probarse con una `Response` falsa, incluidos el timeout y los datos inválidos.
- Los tests de la caché usan un reloj controlable (`() => Date`) que se puede mover hacia delante y hacia atrás.

## 8. Decisiones
| Decisión | Alternativa descartada | Motivo |
|---|---|---|
| Frankfurter (BCE), sin clave, URL configurable | Un proveedor con clave (`EXCHANGE_RATE_API_KEY`) | No hay secreto que gestionar ni registro; la clave se documenta por si se cambia |
| `fetch` nativo y `AbortSignal.timeout` | `axios` u otra librería HTTP | Node ≥ 22 ya trae lo necesario; sin dependencias nuevas |
| Tipo como entero en micro-unidades y texto de 6 decimales en el JSON | `number` decimal o `DECIMAL` en SQLite | Evita la coma flotante (D2, RF11) y el producto cabe en enteros seguros |
| `parseRateText` sobre el texto original del número (reviver con `source`) | `JSON.parse` y `Number` | El número JSON ya pasó por coma flotante binaria y se pierde el texto de la API |
| Proveedor por divisa (`fetchRate(currency)`) | Una llamada con USD y GBP a la vez | Casa con la caché por divisa y con el caso "se llama solo por GBP" |
| `await` del tipo antes de la transacción síncrona | Transacción asíncrona o cliente de BD asíncrono | better-sqlite3 es síncrono; un `await` dentro de la transacción la dejaría abierta |
| La caché devuelve el par (tipo, instante) creado en la renovación | Releer la caché tras `await` | Con peticiones concurrentes el tipo y su fecha podrían venir de rondas distintas (RF17) |
| Migración con `PRAGMA table_info` + `ALTER TABLE ADD COLUMN` en transacción | Recrear la tabla (`CREATE TABLE _new` + copiar) | `ALTER` no toca la FK ni el índice y conserva los ids y el `AUTOINCREMENT` |
| `EXCHANGE_RATE_UNAVAILABLE` como 500 sin `details` | 502 o 503 | La constitución solo admite 400, 404, 409 y 500 (spec U6) |
| `GET /exchange-rates` con el router propio y sin transporte JSON | Colgarlo del router de simulaciones | El patrón de rutas no definidas es el mismo que en la 003 (404 antes de leer el cuerpo) |
| Constantes `RATE_CACHE_TTL_MS` y `RATE_FETCH_TIMEOUT_MS` en un archivo del backend | Variables de entorno | U7 y V1 las fijan; configurarlas solo añadiría casos que probar |

## 9. Estrategia de tests (Vitest, TDD)
- **shared:**
  - `parse-rate.test.ts`: filas de "Tipo de cambio: formato, rango y API" (`1.1`, `1.1234567`, `0.0099996`, `0.0099994`, `0.01`, `100`, `100.0000004`, `100.0000005`, `0`, `-1`, `1e0`, `"abc"`, `""`, parte entera enorme).
  - `format-rate.test.ts`, `convert-cents.test.ts` (filas de "Redondeo de la conversión", incluido el 0,40 artificial y `Object.is(x, -0)` falso) y `convert-quote.test.ts` (las dos filas de total sumado y de IVA convertido, y las filas de USD de "Tramos e IVA en otra divisa" en céntimos).
  - `validate-currency.test.ts` con `it.each` (`undefined`, `"EUR"`, `"USD"`, `"GBP"`, `"JPY"`, `"usd"`, `" USD "`, `""`, `"USD\n"`, `"US"`, `null`, `34`, `["USD"]`).
  - `validate-simulation-input.test.ts`: orden `customerId, users, storage, apiCalls, currency, desconocidos` y `exchangeRate` como `UNKNOWN_FIELD`.
  - `currency.properties.test.ts` (CA9): extremos del tipo × importes máximos, entero seguro y comparación con un cálculo de referencia con `BigInt` **solo dentro del test** (no es código de producción).
- **repositories:** `simulations.repository.test.ts` ampliado, `simulations-migration.test.ts` (base con filas de la 003 → EUR; dos ejecuciones sin cambios; base nueva con columnas no nulas; `customers` intacta; FK activa) y `connection.test.ts` sin cambios.
- **rates:** `frankfurter.provider.test.ts` con `fetchFn` falso (éxito con texto `1.1`; respuesta sin la divisa; forma inesperada; estado ≠ 200; red caída; timeout de 5 s con `AbortSignal` simulado; el mensaje de error no filtra la URL ni el cuerpo).
- **services:** `exchange-rates.service.test.ts` con reloj controlable (23 h 59 min 59,999 s vigente; exactamente 24 h renueva; reloj hacia atrás renueva; caché por divisa; API que falla → `EXCHANGE_RATE_UNAVAILABLE` sin usar caducado; dos peticiones concurrentes con caché vacía; `getAll` en orden y sin parciales) y `simulations.service.test.ts` (EUR sin llamar al proveedor; el precio y el 500 por país antes de pedir el tipo; cliente inexistente sin llamar; conversión `toEqual` a `convertQuote`).
- **HTTP (supertest contra `createApp` con `:memory:`, proveedor y reloj falsos):** `simulations.http.currency.test.ts` (validación de `currency` y orden de errores, USD y GBP, tramos e IVA, congelación, migración y lectura, listado con tres divisas), `exchange-rates.http.test.ts` (GET, 500 parcial, query ignorada, otros métodos con JSON roto → 404) y los archivos de la 003 ajustados solo a los campos nuevos (CA5). Toda fila 400/404/500 cuenta `COUNT(*)` antes y después (CA4), y la comprobación de CA7 busca que ni la URL ni el texto de la API aparezcan en la respuesta.

## 10. Cobertura de RF
| Parte | RF |
|---|---|
| `convert-cents`, `convert-quote` | RF5, RF6, RF7, RF9, RF10 |
| `parse-rate`, `format-rate` | RF11, RF12 |
| `validate-currency`, `validate-simulation-input` | RF3, RF13 |
| `simulations.service` (orden y EUR) | RF1, RF2, RF4, RF14 |
| `exchange-rates.service` | RF15, RF16, RF17 |
| `frankfurter.provider` | RF11 (texto), RF16 (timeout y Zod) |
| `GET /exchange-rates` | RF18 |
| repositorio, esquema y migración | RF8, RF19, RF20 |
| `shared/customers/types.ts`, `errors.ts` | RF13, RF16 |
| enmiendas de constitución, 003 y MEMORY | CA8 |

## 11. Pregunta abierta para el usuario
- **Proveedor de tipos de cambio.** El plan asume Frankfurter, pero la decisión es del usuario por las condiciones de uso de un servicio externo:
  - A) Frankfurter (BCE), sin clave, tipos diarios de referencia. **Recomendada**: no hay secretos que gestionar y encaja con S2.
  - B) Un proveedor con clave gratuita (por ejemplo ExchangeRate-API): más estable o con SLA, pero requiere registrarse y gestionar `EXCHANGE_RATES_API_KEY`.
  - C) El fichero diario del BCE directamente (XML): sin intermediario, pero hay que leer XML y hace falta una dependencia o un parseo a mano.
  Cambiar de A a B o C solo toca `frankfurter.provider.ts` y `config.ts`.
