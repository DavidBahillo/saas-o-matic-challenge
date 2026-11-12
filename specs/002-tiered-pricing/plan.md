# 002 · Plan técnico — Coste base por tramos de usuarios e IVA por país
Spec: [spec.md](spec.md) (aprobada) · Decisiones: MEMORY.md D2, D3, D4, D5, D9 y D13 (U1–U9) · Tareas: [tasks.md](tasks.md)

## 1. Resumen
- Toda la regla vive en `shared/src/pricing/` como **lógica pura** (sin E/S, fecha, azar, red ni `Intl`), para que la importen el backend (003) y el slider de la 005 (D3; constitución, principio 3).
- Dos puntos de entrada públicos: `calculateBaseCost(input)` (RF11, sin país) y `calculateQuote(input)` (RF12, con IVA). Ambos reciben `unknown`, validan y **nunca lanzan**: devuelven `{ ok: true, value }` o `{ ok: false, errors }`, el mismo patrón que `CustomerInputResult` de la 001.
- Todos los importes son **enteros en céntimos** (D2, U9). Los tramos y la tabla de IVA son constantes congeladas (`Object.freeze` + `readonly`).
- El IVA se calcula una sola vez sobre el coste base total con half-up entero (§6), y +0 se garantiza normalizando `-0` en la validación (§7).
- La 002 reutiliza la lista ISO, la sugerencia de `UK`, los mensajes y el formato de error de la 001 mediante un **refactor mínimo** de `validate-country.ts` (§3, DEP1).
- Sin endpoints, sin BD y sin frontend: esas capas son de la 003 y la 005.

## 2. Dependencias
Ninguna nueva. Los tests de propiedades (CA3) son bucles deterministas de N = 0 a 100 000 con Vitest, ya instalado. *Descartado:* `fast-check`: el dominio es finito y pequeño (100 001 valores), así que la enumeración exhaustiva es más fuerte que el muestreo aleatorio y no añade una dependencia.

## 3. Reutilización de la 001 (DEP1) y refactor mínimo
Estado actual verificado:
- `countries/iso3166-alpha2.ts` exporta `ISO_3166_ALPHA2` (congelada) e `isIsoAlpha2(code)`, que compara de forma **exacta** (sin normalizar).
- `countries/validate-country.ts` hace `readText(…, normalizeCountry)` y, sobre el texto normalizado, aplica en línea la regla `UK → suggestion GB` y la pertenencia ISO.
- `customers/field-result.ts` tiene `FieldResult<T>`, `ok`, `fail` y `readText(field, raw, messages, normalize)`, que ya da `REQUIRED` (ausente, `null` o vacío tras normalizar) e `INVALID_TYPE` (no texto).

**Refactor R1 (en `validate-country.ts`, sin cambiar su comportamiento):** se extrae la parte que no normaliza a una función exportada
```ts
/** Comprueba un código ya normalizado: UK → INVALID_COUNTRY con suggestion GB; fuera de la lista ISO → INVALID_COUNTRY. */
export function checkCountryCode(code: string): FieldResult<string>
```
y `validateCountry` pasa a ser `readText(…, normalizeCountry)` → `checkCountryCode(text.value)`. Sus tests actuales (`validate-country.test.ts`) no se tocan y deben seguir en verde; se añaden tests propios de `checkCountryCode` (`ES` ok, `UK` con sugerencia, `uk`, `" ES "`, `"   "` y `XX` → `INVALID_COUNTRY` sin sugerencia).

**Capa propia de la 002 (`pricing/validate-vat-country.ts`):** `readText` con normalización identidad `(s) => s` y después `checkCountryCode`. Con ello, sin duplicar nada:
- `undefined`, `null` y `""` → `REQUIRED`; no texto (incluido `["ES"]`) → `INVALID_TYPE`;
- `"   "` no queda vacío (no se recorta), así que llega a `checkCountryCode` → `INVALID_COUNTRY` (U3, U7);
- `es`, `Es`, ` ES ` → `INVALID_COUNTRY`; `UK` → `INVALID_COUNTRY` con `suggestion: "GB"` y `COUNTRY_MESSAGES.UK_SUGGESTION`.
- Los mensajes son los mismos `COUNTRY_MESSAGES` de la 001.

**Refactor R2 (tipos de error, en `customers/types.ts`):** el contrato `FieldError` es común a las dos specs y la 003 lo devolverá en `details.fields`. Cambio aditivo:
```ts
export type UsersReason = 'NOT_FINITE' | 'NOT_INTEGER' | 'NEGATIVE' | 'TOO_LARGE';
export type FieldErrorReason = TaxIdReason | UsersReason;
// FieldErrorCode añade 'INVALID_USERS'
// FieldError.reason?: FieldErrorReason   (antes: TaxIdReason)
```
`TaxIdReason` y `FormatReason` no cambian, así que los validadores de tax ID siguen igual de tipados. *Descartado:* un tipo de error propio de la 002 (`PricingError`), porque la 003 tendría que mezclar dos formas de error en la misma respuesta 400.

## 4. Estructura de archivos
Solo `shared/`. Capas `routes`, `controllers`, `services`, `repositories` y `frontend/`: **sin cambios en esta spec** (003 y 005).
```
shared/src/customers/types.ts                 R2: INVALID_USERS, UsersReason, FieldErrorReason
shared/src/countries/validate-country.ts      R1: extrae y exporta checkCountryCode
shared/src/countries/validate-country.test.ts + describe de checkCountryCode
shared/src/pricing/
  tiers.ts                    TierNumber, PricingTier, PRICING_TIERS (congelado), MAX_USERS
  tiers.test.ts               definición e inmutabilidad (RF4)
  types.ts                    TierLine, BaseCost, Quote, PricingResult<T>, BaseCostResult, QuoteResult
  tier-breakdown.ts           computeTierBreakdown, sumSubtotals
  tier-breakdown.test.ts      tabla "Coste base por número de usuarios" (enteros válidos)
  validate-users.ts           USERS_MESSAGES, validateUsers
  validate-users.test.ts      tabla "Número de usuarios no válido"
  pricing-input.ts            INPUT_MESSAGES, readPricingInput (RF16 y lectura de users/country)
  calculate-base-cost.ts      calculateBaseCost
  calculate-base-cost.test.ts RF11, RF5, RF16, `1e1`, `-0`
  vat-rates.ts                VatTableCountry, VAT_RATES_PERCENT (congelada), vatRatePercentFor
  vat-rates.test.ts           tabla D5, MX → 0, inmutabilidad
  vat-cents.ts                vatCentsHalfUp (interno: no se exporta desde index.ts, U6)
  vat-cents.test.ts           half-up con enteros
  validate-vat-country.ts     validateVatCountry
  validate-vat-country.test.ts tabla "País no válido" (solo country)
  calculate-quote.ts          calculateQuote
  calculate-quote.test.ts     tabla "IVA por país", combinaciones de errores, RF16, RF5
  pricing.properties.test.ts  CA3 y CA4 (N = 0 … 100 000)
shared/src/index.ts           exportaciones públicas (§9)
eslint.config.js              regla de pureza para shared/src/pricing (§10, D-P6)
```
Cada archivo de código queda muy por debajo de 200 líneas y cada función por debajo de 40. Si un test supera 200 líneas, se divide por tabla (p. ej. `calculate-quote.errors.test.ts`).

## 5. Tipos públicos y firmas
```ts
// pricing/tiers.ts
export type TierNumber = 1 | 2 | 3;
export interface PricingTier {
  readonly tier: TierNumber;
  readonly from: number;        // primera posición (1, 11, 51)
  readonly to: number | null;   // última posición; null = sin límite (tramo 3)
  readonly unitPriceCents: number;
}
export const MAX_USERS = 100_000;
export const PRICING_TIERS: readonly [PricingTier, PricingTier, PricingTier] = Object.freeze([
  Object.freeze({ tier: 1, from: 1,  to: 10,   unitPriceCents: 1000 }),
  Object.freeze({ tier: 2, from: 11, to: 50,   unitPriceCents: 800 }),
  Object.freeze({ tier: 3, from: 51, to: null, unitPriceCents: 500 }),
] as const);

// pricing/types.ts
export interface TierLine {
  readonly tier: TierNumber; readonly from: number; readonly to: number | null;
  readonly unitPriceCents: number; readonly billedUsers: number; readonly subtotalCents: number;
}
export interface BaseCost { readonly users: number; readonly tiers: readonly TierLine[]; readonly baseCents: number }
export interface Quote extends BaseCost {
  readonly country: string; readonly vatRatePercent: number; readonly vatCents: number; readonly totalCents: number;
}
export type PricingResult<T> = { ok: true; value: T } | { ok: false; errors: FieldError[] };
export type BaseCostResult = PricingResult<BaseCost>;
export type QuoteResult = PricingResult<Quote>;

// pricing/tier-breakdown.ts   (precondición: users ya validado, entero +0 … MAX_USERS)
export function computeTierBreakdown(users: number): TierLine[]
export function sumSubtotals(lines: readonly TierLine[]): number

// pricing/validate-users.ts
export const USERS_MESSAGES: Readonly<Record<'REQUIRED' | 'INVALID_TYPE' | UsersReason, string>>
export function validateUsers(raw: unknown): FieldResult<number>

// pricing/pricing-input.ts
export const INPUT_MESSAGES = { INVALID_TYPE: 'La entrada del cálculo debe ser un objeto.' } as const;
export interface PricingInputFields { readonly users: unknown; readonly country: unknown }
export function readPricingInput(input: unknown): PricingResult<PricingInputFields>

// pricing/vat-rates.ts
export type VatTableCountry = 'ES' | 'PT' | 'FR' | 'DE' | 'IT' | 'GB' | 'US';
export const VAT_RATES_PERCENT: Readonly<Record<VatTableCountry, number>> = Object.freeze({
  ES: 21, PT: 23, FR: 20, DE: 19, IT: 22, GB: 20, US: 0,
});
/** Precondición: país ISO válido. Fuera de la tabla → 0 (RF8, D5). */
export function vatRatePercentFor(country: string): number

// pricing/vat-cents.ts  (interno)
/** Precondición: baseCents y ratePercent enteros ≥ 0 y baseCents × ratePercent seguro. */
export function vatCentsHalfUp(baseCents: number, ratePercent: number): number

// pricing/validate-vat-country.ts
export function validateVatCountry(raw: unknown): FieldResult<string>

// pricing/calculate-base-cost.ts y calculate-quote.ts
export function calculateBaseCost(input?: unknown): BaseCostResult
export function calculateQuote(input?: unknown): QuoteResult
```
- El parámetro es opcional (`input?`) para que `calculateBaseCost()` sin argumento compile y dé el error de RF16.
- `vatRatePercentFor` consulta con `Object.hasOwn(VAT_RATES_PERCENT, country)`, nunca con `in` ni acceso directo sin comprobar, para que ninguna clave del prototipo pueda colarse.
- Las salidas son objetos y arrays **nuevos** en cada llamada (no alias de `PRICING_TIERS`), construidos con las claves en el orden del JSON de la spec: `users`, `tiers`, `baseCents`, `country`, `vatRatePercent`, `vatCents`, `totalCents`.

### Mensajes (`USERS_MESSAGES`, en español)
| Clave | Mensaje |
|---|---|
| `REQUIRED` | El número de usuarios es obligatorio. |
| `INVALID_TYPE` | El número de usuarios debe ser un número. |
| `NOT_FINITE` | El número de usuarios debe ser un número finito. |
| `NOT_INTEGER` | El número de usuarios debe ser un número entero. |
| `NEGATIVE` | El número de usuarios no puede ser negativo. |
| `TOO_LARGE` | El número de usuarios no puede ser mayor que 100 000. |

Los errores de `users` son `{ field: 'users', code: 'INVALID_USERS', reason, message }`, creados con `fail()` de la 001. Los de `country` reutilizan `COUNTRY_MESSAGES`.

## 6. Algoritmos
**Desglose (RF1–RF3).** Para cada tramo de `PRICING_TIERS`, con `upper = to ?? users`:
`billedUsers = Math.max(0, Math.min(users, upper) - (from - 1))` y `subtotalCents = billedUsers * unitPriceCents`.
Equivale a las fórmulas del Glosario (min(N, 10); min(max(N − 10, 0), 40); max(N − 50, 0)) y se recorre la definición, no números escritos a mano, para que exista una sola fuente (RF4). `baseCents = sumSubtotals(lines)`, así que RF3 (suma = base) se cumple por construcción.

**IVA half-up con enteros (RF10, U6).**
```
product = baseCents * ratePercent          // ≤ 50 017 000 × 23 = 1 150 391 000 < 2^53
rem     = product % 100                    // entero 0…99 (product ≥ 0)
vat     = (product - rem) / 100 + (rem >= 50 ? 1 : 0)
```
`(product - rem)` es múltiplo exacto de 100, así que la división es exacta; no se multiplica nunca por fracciones (0,21) ni se usa `Math.round` sobre decimales. Se llama **una sola vez** en `calculateQuote` con el `baseCents` total; las líneas de tramo no se redondean (no lo necesitan: precio entero × usuarios entero). `totalCents = baseCents + vatCents`.

## 7. Garantía de +0 (RF15)
- `validateUsers` devuelve `value === 0 ? 0 : value`: la comparación `-0 === 0` es verdadera, y el literal `0` es +0. Desde ahí `users` es siempre +0 cuando vale cero.
- Con `users` = +0: `Math.min(+0, upper) - (from - 1)` da +0 o un negativo; `Math.max(0, …)` devuelve +0 (por especificación, `Math.max(+0, -0)` es +0). Productos y sumas de +0 enteros no negativos dan +0; `0 % 100` y `(0 - 0) / 100` dan +0.
- El tipo sale de un literal de la tabla o del literal `0`.
- Los tests comprueban `Object.is(x, -0) === false` en todas las salidas numéricas, con la entrada `-0` (tablas) y en la propiedad CA4.

## 8. Validación de entrada (orden de los RF)
`calculateBaseCost` y `calculateQuote` siguen este orden:
1. **RF16** · `readPricingInput(input)`: si `typeof input !== 'object' || input === null || Array.isArray(input)` → `{ ok: false, errors: [{ field: 'input', code: 'INVALID_TYPE', message: INPUT_MESSAGES.INVALID_TYPE }] }` y se detiene. Si no, lee **solo** `users` y `country` como propiedades propias (`Object.hasOwn(obj, k) ? obj[k] : undefined`), de modo que `storage`, `apiCalls`, `plan` y el resto se ignoran por construcción (RF5, U8) y no se leen propiedades heredadas del prototipo.
2. **RF6** · `users`: `undefined`/`null` → `REQUIRED`; `typeof !== 'number'` → `INVALID_TYPE` (incluye `""`, `"15"`, booleanos, objetos y arrays).
3. **RF7** · dominio, primer fallo en orden: `!Number.isFinite` → `NOT_FINITE`; `!Number.isInteger` → `NOT_INTEGER`; `< 0` → `NEGATIVE`; `> MAX_USERS` → `TOO_LARGE`. (`-1.5` da `NOT_INTEGER` y `100000.5` también.) `1e1` es el número 10, sin tratamiento especial.
4. **RF9** · solo en `calculateQuote`: `validateVatCountry(country)`; se evalúa **siempre**, aunque `users` haya fallado, para devolver los dos errores.
5. **RF13** · `errors = [usersError?, countryError?]` en ese orden; si hay alguno, se devuelve solo `{ ok: false, errors }`, sin importes.
6. Cálculo: desglose → base → (presupuesto) tipo → IVA → total.

`calculateQuote` reutiliza internamente el cálculo del desglose y la base (no llama a `calculateBaseCost` para no validar dos veces); una función interna `buildBaseCost(users: number): BaseCost` en `calculate-base-cost.ts` la comparten ambas.

## 9. Exportaciones de `shared/src/index.ts`
Se añaden (sin quitar nada):
- `calculateBaseCost`, `calculateQuote`;
- `PRICING_TIERS`, `MAX_USERS`, `VAT_RATES_PERCENT`, `vatRatePercentFor`;
- `validateUsers`, `USERS_MESSAGES`, `validateVatCountry`, `INPUT_MESSAGES`, `checkCountryCode`;
- tipos `TierNumber`, `PricingTier`, `TierLine`, `BaseCost`, `Quote`, `PricingResult`, `BaseCostResult`, `QuoteResult`, `VatTableCountry`, `UsersReason`, `FieldErrorReason`.

**No** se exportan `vatCentsHalfUp`, `computeTierBreakdown`, `sumSubtotals`, `readPricingInput` ni `buildBaseCost`: son detalles internos, y U6 prohíbe una función pública de IVA sobre bases arbitrarias.

## 10. Calidad: lint, tipos y pureza (CA2, CA7)
- Sin `any`: el test de inmutabilidad usa `// @ts-expect-error` en cada asignación prohibida (p. ej. `PRICING_TIERS[0].unitPriceCents = 1`, `PRICING_TIERS[1].to = 999`, `VAT_RATES_PERCENT.ES = 0`), dentro de `expect(() => { … }).toThrow(TypeError)` (los módulos ES son estrictos). Si `@ts-expect-error` no se dispara, `tsc -p shared` falla, lo que demuestra que la definición es `readonly`.
- **Pureza (D-P6):** en `eslint.config.js` se añade un bloque para `shared/src/pricing/**/*.ts` (excluidos `*.test.ts`) con `no-restricted-globals` (`Date`, `process`, `window`, `document`, `fetch`, `localStorage`, `Intl`), `no-restricted-properties` (`Math.random`) y `no-restricted-imports` (`node:*`). Así CA2 y RF14 quedan comprobados por `npm run lint`, sin dependencias nuevas. `shared/tsconfig.json` ya tiene `"types": []`, así que tampoco hay tipos de Node.

## 11. Estrategia de tests (Vitest)
- **TDD:** cada tarea empieza con sus tests en rojo.
- **Tablas de la spec → `it.each` fila a fila (CA1),** comparando en céntimos:
  - `tier-breakdown.test.ts` y `calculate-base-cost.test.ts`: las 16 filas de "Coste base" (incluidas `1e1`, `-0` y la de campos ajenos), comprobando `billedUsers` de los tres tramos, `subtotalCents` y `baseCents`. Las filas de 11 y 51 llevan un comentario que recuerda que el cálculo no acumulativo daría 8800 y 25500.
  - `validate-users.test.ts`: todas las filas de "Número de usuarios no válido", con `code`, `reason` y `message` exactos.
  - `calculate-quote.test.ts`: las 13 filas de "IVA por país" (con `vatRatePercent`, `vatCents`, `totalCents` y +0 en `-0`/`US`) y las de "País no válido", incluidas las tres combinaciones `users`/`country` y su orden.
  - RF16: las filas de "Entrada que no es un objeto" en **las dos** funciones, más `{}` (base → `REQUIRED` en `users`; presupuesto → `REQUIRED` en `users` y en `country`).
  - RF5: `toEqual` estricto entre el resultado con y sin `storage: 999, apiCalls: 1000000, plan: 'enterprise'`, en las dos funciones.
  - RF11: el resultado de `calculateBaseCost` no tiene las claves `country`, `vatRatePercent`, `vatCents` ni `totalCents`.
  - RF14: dos llamadas con la misma entrada dan resultados `toEqual` y objetos distintos (`not.toBe`).
- **Oráculo independiente:** los valores esperados de las tablas y de las propiedades se escriben como literales (1000, 800, 500; límites 10 y 50), nunca leídos de `PRICING_TIERS`, para que un cambio accidental en la definición haga fallar los tests.
- **`vat-cents.test.ts`:** aunque el redondeo nunca se dispara con los precios actuales (RF10), el helper interno se prueba directamente: `(5, 10) → 1` (0,5 sube), `(4, 10) → 0`, `(15, 10) → 2`, `(14, 10) → 1`, `(0, 21) → +0`, `(50017000, 23) → 11503910`. Documenta el half-up sin abrir una API pública (U6).
- **Propiedades (CA3, CA4) en `pricing.properties.test.ts`:** un único `it` por propiedad recorre N = 0 … 100 000 y acumula los N que fallan en un array (máximo 10) con comprobaciones planas; al final `expect(fallos).toEqual([])`. Así se evitan 100 001 `expect` y el test tarda del orden de segundos. Propiedades:
  1. Σ `billedUsers` = N; Σ `subtotalCents` = `baseCents`;
  2. `baseCents(N) − baseCents(N − 1)` = 1000 si N ≤ 10, 800 si 11 ≤ N ≤ 50 y 500 si N ≥ 51 (crecimiento estricto);
  3. para `ES`, `PT`, `FR`, `DE`, `IT`, `GB`, `US` y `MX`: `vatCents × 100 === baseCents × tipo` (IVA exacto) y `totalCents === baseCents + vatCents`, con el tipo literal esperado de la tabla D5;
  4. todas las salidas numéricas cumplen `Number.isSafeInteger(x) && x >= 0 && !Object.is(x, -0)`.
- **Revisión de código (CA4, RF10):** sin multiplicaciones por fracciones y un solo `vatCentsHalfUp` sobre el total.

## 12. Decisiones tomadas
| ID | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| D-P1 | Carpeta `shared/src/pricing/` | `shared/src/billing/` o dentro de `customers/` | El dominio de la spec es el precio; la 003 y la 005 la importarán por ese nombre |
| D-P2 | Refactor R1: extraer `checkCountryCode` de `validateCountry` | Copiar la regla UK + ISO en la 002; parametrizar `validateCountry` con un flag `normalize` | Cero duplicación y la API de la 001 no cambia; un flag booleano mezcla dos contratos en una función |
| D-P3 | Refactor R2: ampliar `FieldError` (código `INVALID_USERS`, `reason` como `TaxIdReason \| UsersReason`) | Tipo `PricingError` propio | Un solo formato de error para la respuesta 400 de la 003 |
| D-P4 | Resultado `{ ok, value } \| { ok, errors }` | Devolver el objeto plano o `{ errors }` sin discriminante | Mismo patrón que `CustomerInputResult`; TypeScript estrecha el tipo y `value` es exactamente el JSON de la spec |
| D-P5 | Half-up con `%` y resta (división exacta) | `Math.round(base * rate / 100)`; BigInt | Aritmética de enteros verificable en revisión; BigInt descartado en U6 |
| D-P6 | Regla de pureza en ESLint para `shared/src/pricing/` | Solo revisión de código; test que lea el código fuente con `node:fs` | CA2 y RF14 comprobados por `npm run lint`; `shared` no tiene tipos de Node |
| D-P7 | Tests de propiedades exhaustivos con bucle | `fast-check` | Dominio finito; sin dependencia nueva (§2) |
| D-P8 | Lectura solo de propiedades propias (`Object.hasOwn`) | Leer `input.users` directamente | Un `users` heredado del prototipo no debe valer como entrada |
| D-P9 | `vatCentsHalfUp` interno y probado de forma directa | Probar el redondeo solo a través de `calculateQuote` | Con los precios actuales el redondeo no se dispara (RF10); así queda probado sin API pública (U6) |

## 13. Trazabilidad RF → tarea → test
| RF / CA | Tarea | Test |
|---|---|---|
| RF1 | T2, T3 | tier-breakdown, calculate-base-cost |
| RF2 | T2, T3 | tier-breakdown (0), calculate-base-cost |
| RF3 | T2 | tier-breakdown, pricing.properties |
| RF4 | T2, T4 | tiers (inmutabilidad), vat-rates (inmutabilidad) |
| RF5 | T3, T4 | calculate-base-cost, calculate-quote |
| RF6 | T1 (tipos), T3 | validate-users |
| RF7 | T1 (tipos), T3 | validate-users |
| RF8 | T4 | vat-rates, calculate-quote |
| RF9 | T1 (R1), T4 | validate-country (checkCountryCode), validate-vat-country, calculate-quote |
| RF10 | T4 | vat-cents, calculate-quote, revisión de código |
| RF11 | T3 | calculate-base-cost |
| RF12 | T4 | calculate-quote |
| RF13 | T3, T4 | calculate-quote (orden users → country) |
| RF14 | T3, T4, T5 | calculate-*, regla ESLint de pureza |
| RF15 | T3, T4, T5 | calculate-*, pricing.properties |
| RF16 | T3, T4 | calculate-base-cost, calculate-quote |
| CA1 | T2–T4 | todas las tablas |
| CA2 | T5 | regla ESLint de pureza |
| CA3, CA4 | T5 | pricing.properties, revisión de código |
| CA5 | T3, T4 | calculate-* (sin importes ni excepciones) |
| CA6 | T2, T3, T4 | tiers, vat-rates, calculate-* (RF5) |
| CA7 | T1–T5 | `npm test` y `npm run lint` en cada tarea |
