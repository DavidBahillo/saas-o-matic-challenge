# 003 · Plan técnico — Simulaciones guardadas por cliente
Spec: [spec.md](spec.md) (aprobada) · Decisiones: MEMORY.md D2, D4, D9, D13 y D14 · Tareas: [tasks.md](tasks.md)

## 1. Resumen
- La validación del cuerpo es **lógica pura en `shared/src/simulations/`**: `validateSimulationInput`. El backend la invoca desde un esquema Zod en el borde, con el mismo patrón que la 001 (`customer-body.schema.ts`). La 005 podrá reutilizarla en el formulario.
- El precio sale siempre de `calculateQuote` (002), con `users` del cuerpo y el país del cliente guardado. El backend no tiene ninguna fórmula de precio propia (CA2).
- Capas en el backend: `routes → controllers → services → repositories`, con una tabla nueva `simulations`, FK `ON DELETE RESTRICT` hacia `customers` y `PRAGMA foreign_keys = ON` en `openDatabase`.
- El resultado se congela: el desglose se guarda como JSON en una columna y los importes en columnas enteras. Las lecturas no recalculan nada (RF14 y RF20).

## 2. Dependencias
**Ninguna nueva.** Se reutilizan `express@5`, `better-sqlite3@12`, `zod@4`, `vitest@4` y `supertest@7`, que ya están en el repo (D12).

## 3. Archivos por capa
```
shared/src/simulations/
  types.ts                         SimulationInput, Simulation, ResourceReason, constantes
  validate-resource.ts             validateResource (storage y apiCalls)          RF8
  validate-customer-ref.ts         validateCustomerRef (customerId)               RF6
  validate-simulation-input.ts     agrega campos y UNKNOWN_FIELD en orden         RF4–RF8
  (cada uno con su .test.ts)
shared/src/customers/types.ts      + INVALID_RESOURCE, ResourceReason, SIMULATION_NOT_FOUND (este último en T7, con su endpoint)
shared/src/index.ts                + exportaciones de simulations/

backend/src/
  db/connection.ts                 + db.pragma('foreign_keys = ON') en los dos modos   RF13
  repositories/schema.ts           + DDL de simulations (§6)                            RF13
  repositories/simulation-row.ts   SimulationRow ↔ Simulation (parseo de tiers_json)
  repositories/simulations.repository.ts   insert, findById, listByCustomer             RF1, RF14, RF16
  services/simulations.service.ts  create, getById, listByCustomer                      RF1–RF3, RF11, RF12, RF15, RF17
  controllers/simulations.controller.ts                                                 RF9, RF10
  schemas/simulation-body.schema.ts        Zod + validateSimulationInput                RF5–RF9
  routes/simulations.routes.ts     POST /simulations, GET /simulations/:id, GET /customers/:id/simulations   RF19
  http/errors.ts                   + simulationNotFound(id)                             RF15
  app.ts                           + montar el router; AppDeps.simulationsRepository opcional (tests de RF12)
  tests: simulations.repository.test.ts, simulations.service.test.ts,
         simulations.http.create.test.ts, simulations.http.validation.test.ts,
         simulations.http.read.test.ts, simulations.http.routes.test.ts, db/connection.test.ts (+FK)

frontend/                          sin cambios (spec 005)
```
Todos los archivos tienen menos de 200 líneas. Los tests HTTP se reparten en cuatro archivos para no pasar de ese límite.

## 4. Funciones puras (shared/)
```ts
export const RESOURCE_MAX = 1_000_000;
export type ResourceReason = 'NOT_INTEGER' | 'NEGATIVE' | 'TOO_LARGE';
export const SIMULATION_FIELDS = ['customerId', 'users', 'storage', 'apiCalls'] as const;

export interface SimulationInput { customerId: number; users: number; storage: number; apiCalls: number }
export interface Simulation extends Quote {          // Quote de la 002: users, tiers, baseCents, country, vatRatePercent, vatCents, totalCents
  id: number; customerId: number; storage: number; apiCalls: number; createdAt: string;
}

/** undefined → ok(0); null o no número → INVALID_TYPE; reason en orden NOT_INTEGER → NEGATIVE → TOO_LARGE; -0 → +0. */
export function validateResource(field: 'storage' | 'apiCalls', raw: unknown): FieldResult<number>;

/** undefined/null → REQUIRED; no número → INVALID_TYPE; no entero seguro ≥ 1 (incluido -0) → INVALID_ID. */
export function validateCustomerRef(raw: unknown): FieldResult<number>;

/** Orden fijo: customerId, users (validateUsers de la 002), storage, apiCalls y, al final,
 *  UNKNOWN_FIELD por cada clave propia ajena, en el orden de Object.keys (orden del cuerpo). */
export function validateSimulationInput(raw: Readonly<Record<string, unknown>>):
  { ok: true; value: SimulationInput } | { ok: false; errors: FieldError[] };
```
- Las claves se leen con `Object.hasOwn` para que una clave heredada se trate como ausente, igual que en la 002. Una clave propia `__proto__` es `UNKNOWN_FIELD`, como en la 001.
- `NOT_FINITE` de `users` no puede llegar por HTTP, pero `validateUsers` lo sigue cubriendo y no se toca.

## 5. Contrato de la API
### POST /simulations → 201
Request:
```json
{ "customerId": 7, "users": 15, "storage": 50 }
```
Response 201 (la forma normativa de la spec; `apiCalls` vale 0 por defecto):
```json
{
  "id": 1, "customerId": 7, "users": 15, "storage": 50, "apiCalls": 0,
  "tiers": [
    { "tier": 1, "from": 1,  "to": 10,   "unitPriceCents": 1000, "billedUsers": 10, "subtotalCents": 10000 },
    { "tier": 2, "from": 11, "to": 50,   "unitPriceCents": 800,  "billedUsers": 5,  "subtotalCents": 4000 },
    { "tier": 3, "from": 51, "to": null, "unitPriceCents": 500,  "billedUsers": 0,  "subtotalCents": 0 }
  ],
  "baseCents": 14000, "country": "ES", "vatRatePercent": 21, "vatCents": 2940, "totalCents": 16940,
  "createdAt": "2026-11-12T10:00:00.000Z"
}
```
Response 400:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "La petición contiene campos no válidos.",
  "details": { "fields": [
    { "field": "users", "code": "INVALID_USERS", "reason": "NEGATIVE", "message": "El número de usuarios no puede ser negativo." },
    { "field": "totalCents", "code": "UNKNOWN_FIELD", "message": "Este campo no está permitido." } ] } } }
```
Response 404: `{ "error": { "code": "CUSTOMER_NOT_FOUND", "message": "No existe el cliente 999." } }`

### GET /simulations/:id → 200
Devuelve la misma forma. 404 `SIMULATION_NOT_FOUND` ("No existe la simulación 424242."); un id no válido da 400 con `INVALID_ID` en `id` (se reutiliza `parseCustomerId` de `customer-query.schema.ts`).

### GET /customers/:id/simulations → 200
`{ "items": [ Simulation, ... ] }`, ordenado por `createdAt` DESC y `id` DESC, o `{ "items": [] }`. 404 `CUSTOMER_NOT_FOUND`. La query se ignora.

### Rutas no definidas
Siguen el patrón de la 001: el transporte JSON (`requireJsonContentType` y `readJsonBody`) se monta **solo** en `POST /simulations`. Cualquier otro método o ruta llega a `notFound` sin leer el cuerpo, así que `PUT /simulations/1` con `{` da 404 (RF19).

## 6. Cambios en la base de datos
```sql
CREATE TABLE IF NOT EXISTS simulations (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id      INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  users            INTEGER NOT NULL CHECK (users BETWEEN 0 AND 100000),
  storage          INTEGER NOT NULL CHECK (storage BETWEEN 0 AND 1000000),
  api_calls        INTEGER NOT NULL CHECK (api_calls BETWEEN 0 AND 1000000),
  tiers_json       TEXT    NOT NULL,
  base_cents       INTEGER NOT NULL CHECK (base_cents >= 0),
  country          TEXT    NOT NULL CHECK (length(country) = 2),
  vat_rate_percent INTEGER NOT NULL CHECK (vat_rate_percent >= 0),
  vat_cents        INTEGER NOT NULL CHECK (vat_cents >= 0),
  total_cents      INTEGER NOT NULL CHECK (total_cents >= 0),
  created_at       TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS simulations_customer_created_idx
  ON simulations (customer_id, created_at DESC, id DESC);
```
- Va en el mismo `DDL` de `schema.ts`, después de `customers`. Es idempotente (`IF NOT EXISTS`), así que una base existente conserva la tabla `customers` y sus filas, y solo gana la tabla nueva.
- `openDatabase` ejecuta `db.pragma('foreign_keys = ON')` tanto en memoria como en archivo, antes de devolver la conexión.
- El orden con `created_at` como texto es correcto porque `toISOString()` tiene ancho fijo y está en UTC.
- `country` se guarda en la simulación (es el país del cliente en el momento del alta), así que un cambio futuro de país del cliente no altera el presupuesto (U2).

## 7. Flujo del alta (service)
1. El controller valida el cuerpo con `parseCreateSimulationBody`. Si falla → 400, sin consultar la BD (RF10).
2. `customers.findById(customerId)`. Si no existe → `customerNotFound` (404, RF11).
3. `calculateQuote({ users, country: customer.country })`. Si devuelve errores → `throw new Error(...)`: el `errorHandler` lo registra con `console.error` y responde 500 sin `details` (RF12).
4. `repository.insert({ ...input, ...quote, createdAt: now().toISOString() })` → 201.

Los pasos 2 a 4 van dentro de una transacción de better-sqlite3 (`db.transaction`), para que ningún error deje filas a medias (CA3).

## 8. Decisiones
| Decisión | Alternativa descartada | Motivo |
|---|---|---|
| Validación pura en `shared/simulations` y Zod como envoltorio (patrón de la 001) | `z.strictObject` con mensajes de Zod | `strictObject` reconstruye el objeto, pierde `__proto__` y no da el orden de errores de la spec ni los códigos propios |
| `tiers_json` en una columna TEXT | Tabla `simulation_tiers` con 3 filas por simulación | Son 3 líneas inmutables que siempre se leen juntas; con una tabla aparte haría falta un join y más SQL sin ningún beneficio |
| Importes en columnas INTEGER separadas | Guardar el `Quote` entero como JSON | Los CHECK y las consultas futuras (004 y 005) necesitan columnas |
| Reutilizar `parseCustomerId` para `:id` de simulaciones | Un esquema nuevo de id | Es el mismo criterio canónico (RF15), así que se evita duplicarlo |
| FK con `ON DELETE RESTRICT` y `PRAGMA` en la conexión | Comprobar en el service antes de borrar | No hay endpoint de borrado y la regla tiene que valer también fuera de la API |
| `SIMULATION_NOT_FOUND` en `ApiErrorCode` de shared | Reutilizar `NOT_FOUND` | La spec distingue ruta inexistente de recurso inexistente |
| Repositorio de simulaciones inyectable en `AppDeps` | Monkey patch en los tests | Permite el test de 500 (RF12) igual que RF31 de la 001 |

## 9. Estrategia de tests (Vitest, TDD)
- **shared:** `validate-resource.test.ts`, `validate-customer-ref.test.ts` y `validate-simulation-input.test.ts`, con `it.each` fila a fila (`-0`, `1000000`, `1000001`, `2.5`, `null`, `"50"`; el orden `customerId → users → storage → apiCalls → desconocidos`; `UNKNOWN_FIELD` en el orden del cuerpo; `__proto__` propio).
- **db:** `connection.test.ts` comprueba que `PRAGMA foreign_keys` vale 1 en memoria y en un archivo temporal. `simulations.repository.test.ts` cubre insertar y leer con `toEqual` y la tabla customers previa intacta tras `migrate` dos veces. También que el `DELETE` de un cliente con simulaciones lanza `SqliteError` con code `SQLITE_CONSTRAINT_TRIGGER` y mensaje "FOREIGN KEY constraint failed" (SQLite señala `ON DELETE RESTRICT` por la vía del trigger) y uno sin simulaciones se borra, que insertar con un `customer_id` inexistente lanza `SQLITE_CONSTRAINT_FOREIGNKEY`, y el orden `created_at DESC, id DESC` con empates.
- **service:** se prueba con un reloj fijo y cubre el 404 del cliente, que el precio es `toEqual` a `calculateQuote` (CA2) y que un cliente con `XX` lanza.
- **HTTP (supertest contra `createApp` con `:memory:`):** una fila por caso límite de la spec, repartidas en cuatro archivos (alta, validación, lecturas, y rutas e inmutabilidad). Las filas de 400/404/500 cuentan `SELECT COUNT(*)` antes y después (CA3). La congelación (RF20) se prueba insertando una fila con `base_cents = 99900` mediante el repositorio. El 500 se prueba insertando un cliente con `country = 'XX'` por SQL directo y espiando `console.error`.
- Las claves duplicadas se prueban enviando el JSON como texto crudo (`.send('{"customerId":7,"users":999999,"users":15}')`).

## 10. Cobertura de RF
| Parte | RF |
|---|---|
| `validate-simulation-input` y sus validadores | RF4–RF8 |
| `simulation-body.schema` + transporte de la 001 | RF5, RF9 |
| controller (validar antes de consultar) | RF10 |
| service | RF1–RF3, RF11, RF12, RF15, RF17 |
| repositorio + esquema | RF13, RF14, RF16, RF20 |
| connection (PRAGMA) | RF13 |
| routes + notFound | RF18, RF19 |
