# 006 · Plan técnico — README y datos semilla
Spec: [spec.md](spec.md) (aprobada, RF1 a RF5, U1 a U7) · Decisiones: MEMORY.md D2, D5, D9, D10, D12, D14, D15 y D16 · Tareas: [tasks.md](tasks.md)

## 1. Resumen
- El seed **no es una vía alternativa** (RF2): reutiliza `validateCustomerInput` y `validateSimulationInput` de `shared/`, `createCustomersService` y `createSimulationsService` del backend (que usan `calculateQuote` y `convertQuote` y congelan la fila). El seed no escribe SQL ni calcula importes.
- Se ejecuta con `tsx`, que ya usa el script `dev` del backend: **sin dependencias nuevas** (CA8). Raíz: `"seed": "npm run seed -w @saas-o-matic/backend"`. Backend: `"seed": "tsx src/seed/seed.ts"`.
- Arranque como `server.ts`: `loadConfig(process.env)` → `openDatabase(dbPath)` → `migrate(db)` → `runSeed`. Así `DB_PATH` ausente, inexistente o inválido se comporta igual que en el backend (casos de la spec).
- Sin red (RF4, U5): el servicio de simulaciones recibe un `ExchangeRatesService` propio del seed (tipos fijos y `at` fijo), no el de Frankfurter. No se usa `createExchangeRatesService` porque su caché descarta tipos de más de 24 h y pondría la fecha actual en `exchangeRateAt`.
- Todo o nada (RF2): se valida todo antes de tocar la base y la escritura va en una transacción.
- El README es solo texto (U6) y un test sencillo comprueba que scripts, variables, endpoints y enlaces citados existen (CA6).

## 2. Dependencias
Ninguna nueva. `tsx` (ya en `backend/`) ejecuta el script; `better-sqlite3`, `zod` y `@saas-o-matic/shared` ya están.

## 3. Archivos por capa
Ninguno supera 200 líneas ni función 40. Los tests están junto a su archivo.

```
shared/                       sin cambios (se reutiliza, RF2)

backend/src/seed/
  seed-types.ts               SeedCustomer { key, companyName, taxId, email, country, plan }, SeedSimulation { customerKey,
                              users, storage, apiCalls, currency }, SeedData { customers, simulations }, SeedSummary
  seed-rates.ts               SEED_RATE_AT = '2026-01-01T00:00:00.000Z'; SEED_RATE_TEXTS { USD: '1.100000', GBP: '0.850000' };
                              createSeedRates(): ExchangeRatesService (getRate sin red; getAll para cumplir la interfaz)     RF4
  seed-rates.test.ts
  seed-customers.ts           SEED_CUSTOMERS: los clientes semilla (ver §6)                                                   RF3
  seed-simulations.ts         SEED_SIMULATIONS: las simulaciones semilla (ver §6)                                              RF3
  seed-data.ts                SEED_DATA = { customers, simulations }
  validate-seed.ts            validateSeedData(data): SeedIssue[] (pura)                                                      RF2
  validate-seed.test.ts
  run-seed.ts                 runSeed(db, options?): Promise<SeedSummary>                                                     RF1, RF2, RF4
  run-seed.test.ts            CA1, CA3, CA4 con BD en memoria
  format-summary.ts           formatSummary(summary): string (puro)                                                           RF1, RF4
  format-summary.test.ts
  seed.ts                     entrada CLI (como server.ts): config, BD, migrate, runSeed, resumen y código de salida          RF1

backend/src/repositories/
  transaction.ts              runInTransaction asíncrona con BEGIN/COMMIT/ROLLBACK (ver §5 y decisión D-P2)                  RF2
  transaction.test.ts

backend/test/
  seed.int.test.ts            CA5: GET /customers y GET /customers/:id/simulations con los datos semilla (supertest)
  readme.test.ts              CA6: scripts, variables, endpoints y enlaces del README

package.json (raíz)           + script "seed"
backend/package.json          + script "seed"
README.md                     nuevo, en español, solo texto                                                                  RF5
MEMORY.md                     D17 y estado de la 006 (lo aplica el coordinador o el implementer en T4)
```

## 4. Funciones puras y firmas
```ts
// seed-rates.ts
export const SEED_RATE_AT: string;                     // '2026-01-01T00:00:00.000Z'
export function createSeedRates(): ExchangeRatesService;
// getRate(c) → { micros: parseRateText(SEED_RATE_TEXTS[c]).micros, at: new Date(SEED_RATE_AT) } (sin red). Si el texto
// no parsea, lanza al crearlo (dato semilla inválido, RF2). USD → 1_100_000, GBP → 850_000 micros.

// validate-seed.ts
export interface SeedIssue { subject: string; field: string; message: string }   // subject: "cliente <key>" o "simulación #n"
export function validateSeedData(data: SeedData): SeedIssue[];
// Clientes: validateCustomerInput. Simulaciones: customerKey existente en data.customers y
// validateSimulationInput({ customerId: 1, ... }) (el id real no existe aún; 1 es un marcador válido).
// Claves duplicadas (key o país + tax ID normalizado) también son un SeedIssue.

// format-summary.ts
export interface SeedSummary { customersCreated: number; customersExisting: number; simulationsCreated: number }
export function formatSummary(s: SeedSummary): string;
// "Clientes: 9 creados, 0 ya existentes\nSimulaciones: 14 creadas" (segunda ejecución: "0 creados, 9 ya existentes", "0 creadas")

// run-seed.ts
export class SeedDataError extends Error { readonly issues: SeedIssue[] }
export interface RunSeedOptions { data?: SeedData; now?: Clock; rates?: ExchangeRatesService }
export function runSeed(db: Database.Database, options?: RunSeedOptions): Promise<SeedSummary>;
```

## 5. Flujo de `runSeed` y transacción
1. `validateSeedData(data)`; si hay incidencias → `SeedDataError` con el cliente o simulación y el motivo. No se abre transacción ni se toca la base.
2. Se crean `createCustomersRepository(db)`, `createCustomersService`, `createSimulationsRepository(db)` y `createSimulationsService({ customers, simulations, rates, now, runInTransaction })` igual que `app.ts`.
3. Dentro de `runInAsyncTransaction(db, async () => { ... })`, para cada cliente semilla en orden:
   - `validateCustomerInput` da el `NewCustomer` normalizado; si `findByCountryAndTaxId(country, taxId)` existe → cuenta como "ya existente" y se salta (no se modifica ni recibe simulaciones, U7).
   - Si no existe → `customersService.create(...)` y se guarda `key → id`.
4. Para cada simulación semilla cuyo cliente se creó en esta ejecución → `simulationsService.create({ customerId, users, storage, apiCalls, currency })` (secuencial, con `await`).
5. Si algo lanza, `ROLLBACK` y se relanza: la base queda como estaba (caso "interrumpida a la mitad").

`db.transaction(fn)` de better-sqlite3 es síncrono y no admite `await`; el `create` del servicio es asíncrono. Por eso `repositories/transaction.ts` ofrece `runInAsyncTransaction<T>(db, fn: () => Promise<T>): Promise<T>` (BEGIN, `await fn()`, COMMIT o ROLLBACK). El SQL sigue solo en `repositories/` (principio 6). El `db.transaction` interno que ya usa el servicio de simulaciones se convierte en un SAVEPOINT dentro de la transacción exterior (comportamiento de better-sqlite3). Solo hay una conexión y nada más escribe durante el seed, así que no hay intercalado.

## 6. Datos semilla
**Clientes (RF3).** España con DNI, NIE y CIF; PT, FR, DE, IT, GB y US; los tres planes repartidos. Los identificadores deben pasar `validateCustomerInput` (D10); el implementer los fija y los verifica con el test, no a ojo. Nombres de empresa ficticios (sin marcas reales) y emails `@example.com`.

**Simulaciones (14, dentro de 12 a 15).** El cliente "ES DNI" lleva las de los límites de tramo; la de GB no tiene simulaciones; el de España con DNI tiene varias.

| # | Cliente | Usuarios | Divisa | Base / IVA / Total esperados |
|---|---|---|---|---|
| 1 | ES DNI | 0 | EUR | 0,00 / 0,00 / 0,00 |
| 2 | ES DNI | 1 | EUR | 10,00 / 2,10 / 12,10 |
| 3 | ES DNI | 10 | EUR | 100,00 / 21,00 / 121,00 |
| 4 | ES DNI | 11 | EUR | 108,00 / 22,68 / 130,68 |
| 5 | ES DNI | 50 | EUR | 420,00 / 88,20 / 508,20 |
| 6 | ES DNI | 51 | EUR | 425,00 / 89,25 / 514,25 |
| 7 | ES DNI | 51 | USD (1,10) | 467,50 / 98,18 / 565,68 USD |
| 8 | ES NIE | 25 | GBP (0,85) | según `shared/` |
| 9 | ES CIF | 120 | EUR | según `shared/` |
| 10 | US | 15 | EUR | 140,00 / 0,00 / 140,00 |
| 11 | PT | 30 | USD | según `shared/` |
| 12 | FR | 8 | EUR | según `shared/` |
| 13 | DE | 60 | GBP | según `shared/` |
| 14 | IT | 12 | EUR | según `shared/` |

`storage` y `apiCalls` varían entre 0 y valores de miles (por debajo de 1 000 000); no suman (D4). Los importes de las filas 1 a 7 y 10 son literales en los tests; el resto se compara con `calculateQuote` y `convertQuote`.

## 7. Contrato de la CLI (no hay cambios de API)
```
$ npm run seed
Clientes: 9 creados, 0 ya existentes
Simulaciones: 14 creadas
```
- Éxito: código 0. Segunda ejecución: "Clientes: 0 creados, 9 ya existentes" y "Simulaciones: 0 creadas".
- Error de datos: stderr `Seed fallido: cliente "<key>": taxId — <message>`; código 1; la base no cambia.
- `ConfigError` (`DB_PATH` vacío o con carácter nulo): el mismo mensaje del backend; código 1.
- Se usa `process.exitCode` y se cierra la base, sin `process.exit` con salida pendiente.

Contrato de la API: sin cambios. Los datos se leen con los endpoints existentes (CA5).

## 8. Cambios en la base de datos
Ninguno. No hay columna de origen (U7); el esquema lo crea o migra `migrate(db)` antes de insertar.

## 9. README (RF5)
Secciones, en este orden: qué es y para quién; requisitos (Node ≥ 22); instalación; arranque (`npm run dev`, puertos 3000 del backend y el de Vite con proxy `/api`, comprobar el puerto de `frontend/vite.config.ts`); datos de ejemplo (`npm run seed`, idempotente, sin red, qué crea); tests y lint; estructura del monorepo; variables de entorno (`PORT` 3000, `DB_PATH` por defecto `backend/data/saas-o-matic.db`, `EXCHANGE_RATES_URL`); API (tabla de endpoints y un ejemplo `curl` de `POST /simulations`); reglas de negocio (tramos 10/8/5 € con límites 10 y 50, IVA por país, divisas EUR/USD/GBP y congelación); flujo SDD con enlaces a `docs/constitution.md`, `MEMORY.md` y `specs/`. Los valores se copian de `config.ts`, `shared/` y `package.json`, no de memoria.

## 10. Decisiones tomadas (alternativa descartada)
- **D-P1 · `ExchangeRatesService` propio del seed** (tipos fijos, `at` fijo). *Descartado:* proveedor falso dentro de `createExchangeRatesService` (la caché de 24 h lo invalidaría y `exchangeRateAt` sería la fecha actual) y llamar a Frankfurter (U5).
- **D-P2 · Transacción asíncrona con BEGIN/COMMIT en `repositories/`** para poder reutilizar `SimulationsService.create` (async). *Descartado:* `db.transaction` (no admite `await`); insertar filas directamente con el repositorio (duplicaría `frozenRow` y el cálculo, contra el principio 3); partir el servicio en una parte síncrona (cambia código de la 003 y la 004, fuera de alcance).
- **D-P3 · Validar todo antes de escribir** y además transacción. *Descartado:* solo transacción (da peor mensaje y deja la comprobación al final).
- **D-P4 · Existencia por `findByCountryAndTaxId`** antes de crear. *Descartado:* capturar el 409 (usa excepciones como flujo normal y aborta con savepoints).
- **D-P5 · `tsx` y `loadConfig` sin cambios.** *Descartado:* script compilado o `node --import tsx` nuevo.
- **D-P6 · Tests junto al código** (`backend/src/seed/`) y los de integración en `backend/test/`, como el resto del backend.

## 11. Estrategia de tests (Vitest, BD en memoria `:memory:`, sin red)
Primero el test en rojo. Ningún test usa `fetch`: el seed no tiene cliente HTTP y, como medida extra, un test comprueba que `runSeed` termina con `fetch` sustituido por una función que lanza.

| Test | Cubre |
|---|---|
| `seed-rates.test.ts` | USD 1 100 000 y GBP 850 000 micros, `at` fijo, sin red (RF4) |
| `validate-seed.test.ts` | cada cliente semilla pasa; DNI con letra errónea, país `UK`, divisa `CHF`, `customerKey` inexistente, duplicado y usuarios 100001 dan incidencia con sujeto y campo (RF2, CA4) |
| `run-seed.test.ts` | base vacía: totales de §6 y literales de las filas 1 a 7 y 10 (CA1, CA2); cobertura de RF3 (tipos de tax ID, países, planes, tramos 0/1/10/11/50/51, tres divisas, un cliente sin simulaciones y uno con varias); 22,68 EUR y 98,18 USD; USD y GBP con `exchangeRate` y `exchangeRateAt` congelados; segunda ejecución: 0 creados y totales iguales (CA3); cliente semilla ya existente con una simulación manual: no se duplica ni modifica ni recibe simulaciones y la suya se conserva (U7); datos de otros clientes intactos; dato corrupto: `SeedDataError` y base vacía (CA4); fallo a mitad (rates que lanza en GBP): `ROLLBACK`, nada guardado (RF2) |
| `transaction.test.ts` | confirma al resolver, deshace al rechazar y relanza el error |
| `format-summary.test.ts` | primera y segunda ejecución |
| `seed.int.test.ts` | tras `runSeed`, `GET /customers` y `GET /customers/:id/simulations` (CA5): `simulationCount` = longitud de la lista, `GET /simulations/:id` en USD con tipo 1,10 |
| `readme.test.ts` | cada `npm run X` del README está en `package.json`; cada variable de entorno está en `config.ts`; cada `MÉTODO /ruta` existe en `routes/`; cada enlace relativo apunta a un archivo o carpeta existente (CA6) |

Comprobación manual (no automática): `DB_PATH` temporal, `npm run seed` dos veces, abrir la interfaz con `npm run dev`.

## 12. Cobertura de RF
| RF | Dónde |
|---|---|
| RF1 | `seed.ts`, `format-summary.ts`, scripts de `package.json` |
| RF2 | `validate-seed.ts`, `run-seed.ts`, `transaction.ts` |
| RF3 | `seed-customers.ts`, `seed-simulations.ts`, `run-seed.test.ts` |
| RF4 | `run-seed.ts` (existencia y claves creadas), `seed-rates.ts` |
| RF5 | `README.md`, `readme.test.ts` |

## 13. Riesgos y dudas
1. **U2 corregido a 9 clientes** (RF3 exige 3 ES + PT, FR, DE, IT, GB y US). Resuelto por el usuario; los tests comprueban los 9.
2. Los identificadores fiscales válidos (sobre todo CIF, PT, FR, DE, IT, GB) deben salir de los validadores, no de memoria; los tests lo fuerzan.
3. `runInAsyncTransaction` usa SQL de transacción manual: revisar que el reviewer lo acepte como excepción justificada de la D-P2.
4. El README debe citar el puerto real de Vite (verificar en `frontend/vite.config.ts`) y los valores por defecto de `config.ts`.
