# 002 · Tareas
Spec: [spec.md](spec.md) · Plan: [plan.md](plan.md)

Reglas para todas las tareas:
- TDD: primero los tests en rojo, después el código.
- Al terminar cada tarea, `npm test` y `npm run lint` deben quedar en verde (incluidos los 546 tests previos de la 001).
- Ningún archivo de más de 200 líneas ni función de más de 40, nada de `any` y ninguna dependencia nueva.
- Los casos de los tests salen **fila a fila** de las tablas de la spec, comparando en céntimos, con los valores esperados como literales (no leídos de `PRICING_TIERS` ni de `VAT_RATES_PERCENT`).
- Cada tarea añade sus exportaciones públicas a `shared/src/index.ts` (plan §9).

- [x] T1 · Refactor mínimo de la 001: `checkCountryCode` y tipos de error — RF: RF6, RF7, RF9 (base) — Archivos: `shared/src/countries/validate-country.ts` (R1: extraer y exportar `checkCountryCode(code: string): FieldResult<string>`; `validateCountry` pasa a `readText(…, normalizeCountry)` → `checkCountryCode`), `shared/src/countries/validate-country.test.ts` (nuevo `describe` de `checkCountryCode`), `shared/src/customers/types.ts` (R2: `INVALID_USERS` en `FieldErrorCode`, `UsersReason`, `FieldErrorReason`, `FieldError.reason?: FieldErrorReason`), `shared/src/index.ts`. — Hecho cuando:
  - los tests existentes de `validateCountry` pasan **sin modificarlos**;
  - `checkCountryCode` da `ok` con `ES`; `INVALID_COUNTRY` con `suggestion: "GB"` y "¿Querías decir GB?" con `UK`; e `INVALID_COUNTRY` sin sugerencia con `uk`, `" ES "`, `"   "` y `XX`;
  - `tsc -p shared` y `tsc -p backend` compilan con el `reason` ampliado.

- [x] T2 · Definición congelada de tramos y desglose — RF: RF1, RF2, RF3, RF4 — Archivos: `shared/src/pricing/tiers.ts`, `tiers.test.ts`, `types.ts`, `tier-breakdown.ts`, `tier-breakdown.test.ts`, `shared/src/index.ts` (`PRICING_TIERS`, `MAX_USERS` y los tipos). — Hecho cuando:
  - `tiers.test.ts` comprueba los tres tramos literales (`1–10` a 1000, `11–50` a 800, `51–null` a 500), `Object.isFrozen` del array y de cada tramo, y que asignar `unitPriceCents` y `to`, y hacer `push`, lanza `TypeError`; cada asignación lleva `@ts-expect-error` (sin `any`) y después `computeTierBreakdown(15)` sigue dando 14000;
  - `tier-breakdown.test.ts` reproduce con `it.each` las filas enteras de "Coste base" (0, 1, 9, 10, 11, 15, 49, 50, 51, 52, 100, 1 000 y 100 000) con `billedUsers` de los tres tramos, `subtotalCents` y `sumSubtotals` = base; 11 → 10800 y 51 → 42500 (no 8800 ni 25500);
  - el desglose siempre tiene 3 líneas, en orden, con `from`/`to` de la definición y `to: null` en el tramo 3.

- [x] T3 · Validación de usuarios, entrada y `calculateBaseCost` — RF: RF2, RF5, RF6, RF7, RF11, RF13, RF14, RF15, RF16 — Archivos: `shared/src/pricing/validate-users.ts`, `validate-users.test.ts`, `pricing-input.ts`, `calculate-base-cost.ts` (incluye `buildBaseCost` interno), `calculate-base-cost.test.ts`, `shared/src/index.ts`. — Hecho cuando:
  - pasan todas las filas de "Número de usuarios no válido" con `field`, `code`, `reason` y `message` exactos (`-1.5` → `NOT_INTEGER`, `100000.5` → `NOT_INTEGER`, `1e9` → `TOO_LARGE`, `""` → `INVALID_TYPE`);
  - `calculateBaseCost` da el JSON de la spec para 15 usuarios, sin claves de IVA (RF11); `1e1` → 10000; `-0` → `users` y todas las salidas +0 (`Object.is(x, -0)` falso);
  - el resultado con `storage`, `apiCalls` y `plan` es `toEqual` al resultado sin ellos (RF5), y un `users` heredado del prototipo se trata como ausente;
  - `null`, sin argumento, `[]`, `[15, "ES"]`, `15`, `"15"` y `true` dan un único error `input`/`INVALID_TYPE` sin lanzar; `{}` da `REQUIRED` en `users`;
  - dos llamadas iguales dan resultados `toEqual` y objetos distintos (RF14).

- [x] T4 · Tabla de IVA, half-up, país estricto y `calculateQuote` — RF: RF4, RF5, RF8, RF9, RF10, RF12, RF13, RF15, RF16 — Archivos: `shared/src/pricing/vat-rates.ts`, `vat-rates.test.ts`, `vat-cents.ts`, `vat-cents.test.ts`, `validate-vat-country.ts`, `validate-vat-country.test.ts`, `calculate-quote.ts`, `calculate-quote.test.ts` (dividido en `calculate-quote.errors.test.ts` si pasa de 200 líneas), `shared/src/index.ts` (sin exportar `vatCentsHalfUp`). — Hecho cuando:
  - `vat-rates.test.ts` comprueba los 7 tipos de D5, `MX` → 0, que la tabla está congelada y que asignar `ES` lanza `TypeError` (con `@ts-expect-error`);
  - `vat-cents.test.ts` cubre `(5,10)→1`, `(4,10)→0`, `(15,10)→2`, `(14,10)→1`, `(0,21)→+0` y `(50017000,23)→11503910`;
  - pasan las filas de "País no válido" (`""` y `null` → `REQUIRED`; `["ES"]` → `INVALID_TYPE`; `es`, ` ES ` y `"   "` → `INVALID_COUNTRY`; `UK` con `suggestion: "GB"`; `XX`, `EU`, `EL`, `XK`, `ESP` y `E`) y las tres combinaciones `users`/`country` en el orden `users` → `country`;
  - pasan las 13 filas de "IVA por país" en céntimos (p. ej. 15 `ES` → 14000 / 21 / 2940 / 16940; 100 000 `PT` → 50017000 / 23 / 11503910 / 61520910; `-0` `US` todo +0) y el JSON de ejemplo de la spec coincide con `toEqual`;
  - RF16 y RF5 se comprueban también en `calculateQuote`, y `{}` da `REQUIRED` en `users` y en `country`.

- [x] T5 · Propiedades exhaustivas y pureza — RF: RF3, RF14, RF15 (CA2, CA3, CA4, CA7) — Archivos: `shared/src/pricing/pricing.properties.test.ts`, `eslint.config.js` (bloque para `shared/src/pricing/**/*.ts` sin `*.test.ts`: `no-restricted-globals` con `Date`, `process`, `window`, `document`, `fetch`, `localStorage` e `Intl`; `no-restricted-properties` con `Math.random`; `no-restricted-imports` con `node:*`). — Hecho cuando:
  - para todo N de 0 a 100 000 (bucle que acumula fallos y termina con `expect(fallos).toEqual([])`): Σ `billedUsers` = N, Σ subtotales = base, incremento 1000/800/500 según la posición N, y para `ES`, `PT`, `FR`, `DE`, `IT`, `GB`, `US` y `MX` `vatCents × 100 === baseCents × tipo` y total = base + IVA;
  - todas las salidas numéricas son `Number.isSafeInteger`, ≥ 0 y nunca −0;
  - añadir temporalmente `Date.now()` o `Math.random()` en `shared/src/pricing/tier-breakdown.ts` hace fallar `npm run lint`, y sin ellos pasa;
  - `npm test` y `npm run lint` terminan en verde con el conjunto completo.
