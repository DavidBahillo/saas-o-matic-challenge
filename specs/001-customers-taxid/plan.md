# 001 · Plan técnico — Clientes con validación del identificador fiscal
Spec: [spec.md](spec.md) (aprobada) · Decisiones: MEMORY.md D1, D9, D10 y D11 · Tareas: [tasks.md](tasks.md)

## 1. Resumen
- Monorepo npm con solo dos workspaces, `shared/` y `backend/`; `frontend/` se crea en la 005.
- Toda la normalización y validación (tax ID por país, país, nombre, email, plan, clave de búsqueda y orden español) es **lógica pura en `shared/`**. El backend la invoca desde un esquema Zod en el borde, así que la API y la futura UI dan el mismo resultado (RF9).
- Backend en Express 5 con capas `routes → controllers → services → repositories`, SQLite mediante better-sqlite3 y el SQL solo en `repositories/`.
- El orden con colación española se hace en memoria con `Intl.Collator('es')`, y la búsqueda sin mayúsculas usa una columna de clave normalizada (§6.1).

## 2. Dependencias (justificación)
| Paquete | Workspace | Tipo | Por qué | Alternativa descartada |
|---|---|---|---|---|
| `express@^5` | backend | prod | D1. La v5 propaga los errores de handlers `async` sin envoltorios y es la versión estable actual | Express 4: necesita `express-async-errors` o try/catch en cada handler |
| `better-sqlite3@12.11.1` | backend | prod | D1. API síncrona y simple, transacciones atómicas, sin servidor de BD. Versión 12 porque la 11.x no publica binarios precompilados para Node 24 en win32-x64 (ABI 137) y no hay herramientas de C++ garantizadas para compilar | `sqlite3` (asíncrono con callbacks, más ruido); un ORM, demasiado para una tabla; `better-sqlite3@11` (sin binario para Node 24 en Windows) |
| `zod@4.6.7` | backend | prod | Constitución, principio 4: validación en el borde. Solo se usan `safeParse`, `z.record(clave, valor)`, `superRefine` y `error.issues`, que existen en la v4. v4 y ≥ 4.6.6 porque la 3.x tiene una vulnerabilidad alta de npm audit (agotamiento de memoria con colecciones grandes) | Validación manual sin Zod: incumple CLAUDE.md; `zod@3` (vulnerable) |
| `typescript@^5.6` | raíz | dev | TypeScript estricto en todo el repositorio | — |
| `tsx@^4` | backend | dev | `npm run dev` ejecuta TypeScript directamente en modo watch, sin paso de build | `ts-node` (fricción con ESM), `tsc --watch` + `nodemon` (dos procesos) |
| `vitest@4.1.12` | raíz | dev | Runner del proyecto (CLAUDE.md); ejecuta TS sin configuración extra. v4 y ≥ 4.1.12 porque la 3.x arrastra vulnerabilidades críticas de npm audit (tinypool, @vitest/mocker) | Jest (necesita transformador para TS/ESM); `vitest@3` (vulnerable) |
| `supertest@^7` + `@types/supertest` | backend | dev | Tests HTTP en proceso contra `createApp()`, sin abrir puertos | `fetch` contra un servidor real: más lento y con puertos que pueden colisionar |
| `eslint@^9` + `typescript-eslint@^8` + `@eslint/js` | raíz | dev | Lint con reglas que exigen la constitución: `no-explicit-any`, `max-lines: 200`, `max-lines-per-function: 40` | — |
| `@types/node`, `@types/express`, `@types/better-sqlite3` | raíz / backend | dev | Tipos para `strict` | — |

- **Lista ISO 3166-1:** sin paquete. Es un array estático en `shared/src/countries/iso3166-alpha2.ts`, copiado de la ISO OBP con fecha 1 de noviembre de 2026 (RF6). *Descartado:* `i18n-iso-countries`, que pesa unos 1 MB con nombres traducidos que no necesitamos e incluye códigos que no controlamos.
- **Entorno:** Node ≥ 22 LTS (`engines` en el `package.json` raíz). Node trae ICU completo por defecto, que `Intl.Collator('es')` necesita. better-sqlite3 12.11.1 tiene binarios precompilados para Windows con Node 22 y 24 (el entorno de desarrollo usa Node 24).

## 3. Estructura de carpetas
```
package.json            workspaces [shared, backend]; scripts dev, test, lint
tsconfig.base.json      strict, noUncheckedIndexedAccess, noImplicitOverride, module ESNext, moduleResolution Bundler, noEmit
eslint.config.js        flat config (ver §8)
vitest.config.ts        include **/*.test.ts, environment node
.gitignore              + backend/data/
shared/
  package.json          name @saas-o-matic/shared, "type": "module", exports "." → ./src/index.ts
  tsconfig.json
  src/index.ts                         reexporta la API pública
  src/customers/types.ts               Plan, TaxIdType, códigos, FieldError, Customer, DTO
  src/customers/plans.ts               PLANS
  src/customers/field-result.ts        FieldResult<T>, ok(), fail()
  src/customers/validate-company-name.ts
  src/customers/validate-email.ts
  src/customers/validate-plan.ts
  src/customers/validate-customer-input.ts   agrega todos los campos (RF3, RF8)
  src/countries/iso3166-alpha2.ts      ISO_3166_ALPHA2 (array estático)
  src/countries/validate-country.ts
  src/text/whitespace.ts               trimWhitespace (definición del Glosario)
  src/text/code-points.ts              codePointLength, hasControlChars
  src/text/search-key.ts               toSearchKey (NFC + minúsculas simples)
  src/taxid/result.ts                  TaxIdResult, taxIdOk(), formatError(), checksumError()
  src/taxid/normalize-tax-id.ts
  src/taxid/digits.ts                  isDigits, isAllZeros, digitsOf, doubleAndReduce
  src/taxid/es-dni-nie.ts
  src/taxid/es-cif.ts
  src/taxid/es.ts                      clasifica DNI/NIE/CIF y despacha
  src/taxid/pt-nif.ts
  src/taxid/fr-siren.ts
  src/taxid/de-vat.ts
  src/taxid/it-piva.ts
  src/taxid/gb-vat.ts
  src/taxid/generic.ts
  src/taxid/validate-tax-id.ts         punto de entrada: normaliza, REQUIRED, prefijo, despacho por país
  src/search/sort-customers.ts         compareByNameEs, sortByNameEs
  (cada archivo X.ts tiene al lado su X.test.ts)
backend/
  package.json          name @saas-o-matic/backend; scripts dev (tsx watch src/server.ts)
  tsconfig.json
  src/server.ts                        loadConfig → openDatabase → migrate → createApp → listen
  src/app.ts                           createApp(deps): orden de middlewares (§6.4)
  src/config.ts                        loadConfig(env) con Zod: PORT, DB_PATH
  src/db/connection.ts                 openDatabase(path)
  src/http/errors.ts                   HttpError y fábricas (validation, notFound…)
  src/http/content-type.ts             isJsonContentType (pura)
  src/http/json-body.ts                requireJsonContentType, readJsonBody
  src/http/not-found.ts
  src/http/error-handler.ts
  src/schemas/customer-body.schema.ts  Zod + validateCustomerInput
  src/schemas/customer-query.schema.ts Zod de q y de id
  src/routes/customers.routes.ts
  src/controllers/customers.controller.ts
  src/services/customers.service.ts
  src/repositories/schema.ts           migrate(db): DDL
  src/repositories/customers.repository.ts
  src/repositories/customer-row.ts     CustomerRow ↔ Customer
  test/helpers/test-app.ts             app con BD :memory: y reloj fijo
  test/*.int.test.ts                   integración HTTP por grupo de RF
```
El DDL vive en `repositories/schema.ts` para cumplir el principio 6 (SQL solo en repositorios).

## 4. Tipos compartidos (`shared/src/customers/types.ts`, `taxid/result.ts`)
```ts
export const PLANS = ['starter', 'growth', 'enterprise'] as const;
export type Plan = (typeof PLANS)[number];
export const TAX_ID_TYPES = ['DNI','NIE','CIF','PT_NIF','FR_SIREN','DE_VAT','IT_PIVA','GB_VAT','OTHER'] as const;
export type TaxIdType = (typeof TAX_ID_TYPES)[number];
export type TaxIdReason = 'COUNTRY_PREFIX' | 'ALL_ZEROS' | 'FIRST_DIGIT' | 'IT_OFFICE_CODE';
export type FieldErrorCode = 'REQUIRED' | 'INVALID_TYPE' | 'UNKNOWN_FIELD' | 'INVALID_LENGTH'
  | 'INVALID_CHARACTERS' | 'INVALID_EMAIL' | 'INVALID_COUNTRY' | 'INVALID_PLAN' | 'INVALID_ID'
  | 'TAX_ID_INVALID_FORMAT' | 'TAX_ID_INVALID_CHECKSUM';
export interface FieldError {
  field: string; code: FieldErrorCode; message: string;
  taxIdType?: TaxIdType; reason?: TaxIdReason; suggestion?: string;
}
export type FieldResult<T> = { ok: true; value: T } | { ok: false; error: FieldError };
export type TaxIdResult =
  | { ok: true; value: string; taxIdType: TaxIdType }
  | { ok: false; error: Omit<FieldError, 'field'> };
export interface NewCustomer {            // ya normalizado y validado
  companyName: string; taxId: string; taxIdType: TaxIdType;
  email: string; country: string; plan: Plan;
}
export interface Customer extends NewCustomer { id: number; createdAt: string }
export interface CustomerList { items: Customer[]; total: number }
export type ApiErrorCode = 'VALIDATION_ERROR' | 'UNSUPPORTED_CONTENT_TYPE' | 'PAYLOAD_TOO_LARGE'
  | 'MALFORMED_JSON' | 'CUSTOMER_NOT_FOUND' | 'NOT_FOUND' | 'CUSTOMER_ALREADY_EXISTS' | 'INTERNAL_ERROR';
export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string; details?: { fields?: FieldError[]; existingId?: number } };
}
```

## 5. Funciones puras (firmas) y RF que cubren
| Función | Archivo | RF |
|---|---|---|
| `trimWhitespace(s: string): string` | text/whitespace.ts | RF2 |
| `codePointLength(s: string): number` · `hasControlChars(s: string): boolean` | text/code-points.ts | RF4, RF5, RF24 |
| `toSearchKey(s: string): string`: NFC y después `toLowerCase()` **por code point**, con `U+0130 → 'i'` (única minúscula multicarácter incondicional), para cumplir "minúscula simple, carácter a carácter, sin case folding" | text/search-key.ts | RF23 |
| `normalizeTaxId(raw: string): string` | taxid/normalize-tax-id.ts | RF2 |
| `isDigits(s: string, length: number): boolean` · `isAllZeros(digits: string): boolean` · `digitsOf(s: string): number[]` · `doubleAndReduce(d: number): number` | taxid/digits.ts | RF11–RF18 |
| `validateDniNie(id: string): TaxIdResult` | taxid/es-dni-nie.ts | RF11, RF12, RF18 |
| `validateCif(id: string): TaxIdResult` | taxid/es-cif.ts | RF11, RF12, RF18 |
| `validateEsTaxId(id: string): TaxIdResult`: primer carácter dígito → DNI; `X`/`Y`/`Z` → NIE; letra de CIF → CIF; otro → FORMAT | taxid/es.ts | RF12 |
| `validatePtNif(id: string): TaxIdResult` | taxid/pt-nif.ts | RF13, RF18 |
| `validateFrSiren(id: string): TaxIdResult` | taxid/fr-siren.ts | RF14, RF18 |
| `validateDeVat(id: string): TaxIdResult` | taxid/de-vat.ts | RF15, RF18 |
| `validateItPiva(id: string): TaxIdResult` | taxid/it-piva.ts | RF16, RF18 |
| `validateGbVat(id: string): TaxIdResult` | taxid/gb-vat.ts | RF17, RF18 |
| `validateGenericTaxId(id: string): TaxIdResult` | taxid/generic.ts | RF20 |
| `validateTaxId(country: string, raw: string): TaxIdResult`: normaliza **una vez** y delega en `validateNormalizedTaxId` | taxid/validate-tax-id.ts | RF2, RF9 |
| `validateNormalizedTaxId(country: string, normalized: string): TaxIdResult`: `REQUIRED` → prefijo (solo los 6 países) → despacho, sin volver a normalizar (T11) | taxid/validate-tax-id.ts | RF2, RF9, RF10, RF19, RF20 |
| `validateCountry(raw: unknown): FieldResult<string>` | countries/validate-country.ts | RF2, RF3, RF6 |
| `validateCompanyName(raw: unknown): FieldResult<string>` | customers/validate-company-name.ts | RF2–RF4 |
| `validateEmail(raw: unknown): FieldResult<string>` | customers/validate-email.ts | RF2, RF3, RF5 |
| `validatePlan(raw: unknown): FieldResult<Plan>` | customers/validate-plan.ts | RF2, RF3, RF7 |
| `validateCustomerInput(raw: Readonly<Record<string, unknown>>): { ok: true; value: NewCustomer } \| { ok: false; errors: FieldError[] }` | customers/validate-customer-input.ts | RF3, RF8, RF9 |
| `compareByNameEs(a: Named, b: Named): number` · `sortByNameEs<T extends Named>(items: readonly T[]): T[]`, con `Named = { companyName: string; id: number }` | search/sort-customers.ts | RF24 |

Reglas comunes a todos los validadores de país:
- La entrada ya llega normalizada y sin prefijo.
- El orden de comprobación es el de RF10: forma con expresión regular anclada → `isAllZeros` de la parte numérica → regla del país (`FIRST_DIGIT`, `IT_OFFICE_CODE`) → control.
- `formatError(reason?, taxIdType?)` solo añade `taxIdType` si hay `reason` distinto de `COUNTRY_PREFIX` (RF11).
- Los mensajes de error, en español, son constantes de `shared/` para que la UI muestre los mismos textos.

Detalles por algoritmo:
- **DNI/NIE:** `^\d{8}[TRWAGMYFPDXBNJZSQVHLCKE]$` y `^[XYZ]\d{7}[TRWAGMYFPDXBNJZSQVHLCKE]$`. Cualquier otra letra final, o una longitud distinta, da FORMAT sin `reason`. La parte numérica del NIE son los 7 dígitos.
- **CIF:** `^[ABCDEFGHJNPQRSUVW]\d{7}[0-9JABCDEFGHI]$`. El tipo de control (dígito, letra o ambos) se comprueba en el paso de control, así que un dígito donde el tipo exige letra da CHECKSUM (RF11).
- **IT:** conjunto de oficinas válidas: `001`–`100`, `120`, `121`, `888` y `999`, como `ReadonlySet<string>`.

## 6. Backend

### 6.1 Búsqueda y orden (punto (a) del QA)
better-sqlite3 no permite registrar colaciones propias, y `lower()` y `LIKE` de SQLite solo funcionan con ASCII. Decisión:
1. **Búsqueda sin mayúsculas (RF23):** se guarda la columna `company_name_search = toSearchKey(companyName)`, calculada en el service con la función de `shared/` al insertar. El filtro SQL es `instr(company_name_search, @nameKey) > 0 OR (@taxIdFragment <> '' AND instr(tax_id, @taxIdFragment) > 0)`. `instr` compara literalmente, así que `%` y `_` no son comodines y no hace falta escaparlos.
2. **Orden español (RF24):** el repositorio devuelve **todas** las filas que cumplen el filtro, sin `ORDER BY` ni `LIMIT`. El service ordena con `sortByNameEs`, que usa un `Intl.Collator('es', { sensitivity: 'base', usage: 'sort' })` creado una sola vez y desempata por `id`. Después devuelve `{ items: sorted.slice(0, 50), total: sorted.length }`.
   - Con `sensitivity: 'base'`, `á` = `a` y `A` = `a`, mientras que `ñ` es una letra primaria propia en la colación española de ICU, así que va después de `n`.
   - **Coste:** O(n log n) y memoria O(n) por petición sobre las coincidencias (sin `q`, todas las filas). Es aceptable para una herramienta interna; con 10 000 clientes son unos pocos milisegundos.
   - **Límite:** a partir de unos 50 000 clientes habría que paginar. La paginación está fuera de alcance; si llega, se añadiría una clave de orden precalculada.
   - *Descartado:* guardar una clave de orden propia (quitar tildes salvo la ñ, `ñ → n~`…). Reimplementa ICU a mano, falla con puntuación y espacios, y obliga a migrar si cambia.
   - *Descartado:* `ORDER BY company_name COLLATE NOCASE`, que no cumple ni la Ñ ni las tildes.
3. **`q`:** `nameKey = toSearchKey(trimWhitespace(q))` y `taxIdFragment = normalizeTaxId(q)`. Si `q` está vacío tras el trim, el repositorio usa una consulta sin `WHERE`.
4. Si `toSearchKey` cambia en el futuro, habrá que recalcular `company_name_search` con una migración. Queda anotado en el código.

### 6.2 Base de datos (punto (b))
- `DB_PATH`, validada con Zod en `config.ts`, vale por defecto `data/saas-o-matic.db`, relativa a `backend/`. Si el directorio no existe, se crea con `mkdirSync({ recursive: true })` y se ignora en git.
- `openDatabase(path)` aplica `journal_mode = WAL` si la ruta no es `:memory:`.
- Los tests usan `:memory:` mediante `createApp({ db, now })`. El test de persistencia (RF32) usa un archivo temporal en `os.tmpdir()`.
- `migrate(db)` es idempotente (`CREATE TABLE IF NOT EXISTS`) y se ejecuta al arrancar.

```sql
CREATE TABLE IF NOT EXISTS customers (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name        TEXT NOT NULL,
  company_name_search TEXT NOT NULL,
  tax_id              TEXT NOT NULL,
  tax_id_type         TEXT NOT NULL CHECK (tax_id_type IN
                        ('DNI','NIE','CIF','PT_NIF','FR_SIREN','DE_VAT','IT_PIVA','GB_VAT','OTHER')),
  email               TEXT NOT NULL,
  country             TEXT NOT NULL CHECK (length(country) = 2),
  plan                TEXT NOT NULL CHECK (plan IN ('starter','growth','enterprise')),
  created_at          TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS customers_country_tax_id_uq ON customers (country, tax_id);
```
Los `CHECK` son una red de integridad de la BD, no reglas de negocio: las reglas viven en `shared/`.

### 6.3 409 con concurrencia (punto (c))
- No se consulta antes de insertar, para evitar la condición de carrera entre la comprobación y la inserción.
- `insert()` ejecuta el `INSERT`. Si better-sqlite3 lanza `SqliteError` con `code === 'SQLITE_CONSTRAINT_UNIQUE'`, el repositorio lo traduce a `DuplicateCustomerError`. El service busca el `existingId` con `findByCountryAndTaxId` y lanza `HttpError(409, 'CUSTOMER_ALREADY_EXISTS', …, { existingId })`.
- El índice UNIQUE garantiza el 409 aunque haya varios procesos. Dentro de un proceso, better-sqlite3 es síncrono y serializa las inserciones.
- Un `INSERT` único es atómico, así que nunca quedan filas a medias (RF31, CA5).

### 6.4 Middlewares, errores y orden de comprobación (punto (d))
Orden en `createApp`:
1. `app.set('query parser', 'extended')`. Express 5 usa por defecto el parser simple, y con él `q[]=a` llegaría como la clave `q[]` en vez de como array. Con `qs`, `q=a&q=b` y `q[]=a` llegan como array y `q[a]=b` como objeto, y todos dan `INVALID_TYPE` (RF24).
2. **Sin parser de cuerpo global.** El router monta, solo en `POST /customers`, la cadena `requireJsonContentType → readJsonBody → controller.create`. Así una ruta o método inexistente nunca llega al transporte y responde primero 404 (RF30).
3. `requireJsonContentType` usa `isJsonContentType(header)`, que es pura: el tipo de medio debe ser `application/json`, sin distinguir mayúsculas, y el único parámetro admitido es `charset=utf-8`. Si falla, responde 400 `UNSUPPORTED_CONTENT_TYPE` (RF26).
4. `readJsonBody` = `express.raw({ type: 'application/json', limit: 10240 })`, después `new TextDecoder('utf-8', { fatal: true, ignoreBOM: true })` y por último `JSON.parse` propio. Lo cambia la T11; antes era `express.text`, que sustituye los bytes no válidos por U+FFFD.
   - Si el cuerpo supera 10 240 bytes, body-parser lanza `entity.too.large`, que se traduce a 400 `PAYLOAD_TOO_LARGE` (RF27).
   - Un cuerpo `undefined` o de 0 bytes, un `TypeError` del decodificador (UTF-8 no válido) o un error de `JSON.parse` dan 400 `MALFORMED_JSON` (RF28).
   - Con `ignoreBOM: true` el BOM se conserva en el texto decodificado como U+FEFF. Si el texto empieza por U+FEFF, la respuesta es `MALFORMED_JSON` (RF28). Se comprueba de forma explícita y no se deja a que `JSON.parse` lo rechace por casualidad.
   - Sin dependencias nuevas: `TextDecoder` es global en Node.
   - El resultado `unknown` se guarda en `req.body`.
   - *Descartado:* `express.json()`. Convierte un cuerpo vacío en `{}` y, en modo `strict`, rechaza `"texto"` o `42` como sintaxis inválida en lugar de `VALIDATION_ERROR` (RF29).
5. Controller: `parseCreateCustomerBody(req.body)`.
   - Zod 4 `z.record(z.string(), z.unknown())` (en la v4 la clave es obligatoria): si no es un objeto plano (arrays, `null`, primitivos), da `{ field: 'body', code: 'INVALID_TYPE' }` (RF29).
   - Después, `.superRefine` con `validateCustomerInput`, y cada `FieldError` se añade con `ctx.addIssue({ code: 'custom', message, params: { fieldError } })`. En la v4 `superRefine` sigue disponible (la alternativa nueva es `.check()`); no se usan `required_error`, `invalid_type_error` ni `errorMap`, que la v4 elimina.
   - Por último se transforma a `NewCustomer`. En la v4, `.transform` no se ejecuta si el refinamiento ha añadido issues.
   - La traducción de issue de Zod a `FieldError` es directa, sin heurísticas: se recorre `result.error.issues` (la v4 ya no tiene el alias `.errors`) y se lee `issue.params` en los `custom`. Los mensajes por defecto de Zod no se muestran nunca: los textos en español salen de `shared/`.
6. `GET /customers/:id`: el `id` debe cumplir `^[1-9]\d*$` y `Number.isSafeInteger(Number(id))`; si no, `INVALID_ID` (RF22). `GET /customers`: el esquema Zod de `q` admite `string | undefined`; cualquier otra cosa da `INVALID_TYPE`, y más de 100 code points tras el trim dan `INVALID_LENGTH`.
7. `notFound`, montado después del router, responde 404 `NOT_FOUND`.
   - **OPTIONS (T11):** un middleware `rejectOptions`, montado **antes** del router, responde 404 `NOT_FOUND` a cualquier `OPTIONS`. Sin él, Express 5 contesta automáticamente 200 con `Allow`.
   - **HEAD (RF30):** no se añade nada. Express sirve `HEAD` con el handler del `GET` y omite el cuerpo; hay tests que lo fijan.
8. `errorHandler` traduce los errores así:
   - `HttpError` → su estado y cuerpo;
   - **`URIError` al decodificar parámetros de ruta (T11):** Express lanza un error con `status: 400` cuando falla `decodeURIComponent` (`/customers/%ZZ`, `/customers/%`). Si `req.path` empieza por `/customers/`, se traduce a 400 `VALIDATION_ERROR` con `{ field: 'id', code: 'INVALID_ID' }` (RF22) en vez de a 500;
   - **Estrechamiento de tipos sin `as` (T11):** los errores de body-parser y del router se reconocen con un type guard `isHttpLikeError(err: unknown): err is { status: number; type?: string }`, construido con `typeof err === 'object' && err !== null && 'status' in err && typeof err.status === 'number'`;
   - un error de body-parser con `type === 'entity.too.large'` → `PAYLOAD_TOO_LARGE`;
   - otros errores 4xx de body-parser (`charset.unsupported`, `request.aborted`…) → 400 `MALFORMED_JSON`;
   - cualquier otro → 500 `INTERNAL_ERROR` con el mensaje genérico "Error interno del servidor.". El detalle solo va a `console.error`, nunca a la respuesta (RF31).

## 7. Contrato de la API (resumen; el detalle completo está en la spec)
`POST /customers` → 201:
```json
// request
{ "companyName": "Acme Ibérica SL", "taxId": "b-1234567-4", "email": " Compras@Acme.ES ", "country": "es", "plan": "growth" }
// 201
{ "id": 1, "companyName": "Acme Ibérica SL", "taxId": "B12345674", "taxIdType": "CIF", "email": "compras@acme.es", "country": "ES", "plan": "growth", "createdAt": "2026-11-12T10:00:00.000Z" }
```
400:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "La petición contiene campos no válidos.",
  "details": { "fields": [ { "field": "taxId", "code": "TAX_ID_INVALID_FORMAT", "reason": "ALL_ZEROS", "taxIdType": "DNI", "message": "…" } ] } } }
```
409: `{ "error": { "code": "CUSTOMER_ALREADY_EXISTS", "message": "…", "details": { "existingId": 1 } } }`
`GET /customers?q=acme` → 200 `{ "items": [Customer…], "total": 1 }` · `GET /customers/1` → 200 `Customer` · 404 `CUSTOMER_NOT_FOUND` / `NOT_FOUND`.

## 8. Calidad: lint y tipos
- `eslint.config.js`:
  - `@eslint/js` recommended + `typescript-eslint` `strictTypeChecked`;
  - `@typescript-eslint/no-explicit-any: error`;
  - `max-lines: [error, { max: 200, skipBlankLines: false }]`;
  - `max-lines-per-function: [error, { max: 40, skipBlankLines: true, skipComments: true }]`, desactivada solo en `*.test.ts`, porque `describe` y `it.each` son callbacks largos por naturaleza. `max-lines` sigue aplicándose a los tests, así que se reparten por validador.
- `npm run lint` = `eslint . && tsc -p shared && tsc -p backend` (con `noEmit`).
- Sin paso de build en la 001: tsx y Vitest ejecutan TS directamente, y `shared` se consume desde `src`. *Descartado:* project references con `tsc -b` y `dist/`, que añaden configuración sin beneficio hasta el despliegue (se revisará en la 006).

## 9. Estrategia de tests (Vitest)
- **Unitarios en `shared/` (TDD, primero en rojo):**
  - Un `*.test.ts` por validador o algoritmo.
  - Cada tabla de casos límite de la spec se copia **fila a fila** en un `it.each` (CA1 y CA2), indicando la salida esperada (`ok` y `taxIdType`, o `code`, `reason` y `taxIdType`).
  - `validate-tax-id.test.ts` cubre normalización, `REQUIRED`, prefijo y despacho para los 6 países, más el genérico.
  - `validate-customer-input.test.ts` cubre varios errores a la vez, `UNKNOWN_FIELD`, `null` como `REQUIRED` y RF8.
  - `sort-customers.test.ts` cubre las filas de orden de la spec.
  - `iso3166-alpha2.test.ts` comprueba que hay 249 códigos, que no hay duplicados, que están ES, GB, PT, FR, DE, IT y US, y que no están UK, EU, EL ni XK.
- **Integración HTTP en `backend/test/` (supertest + `:memory:` + reloj fijo):**
  - `customers-create.int.test.ts`: RF1–RF8, filas de "Otros campos" y "País".
  - `customers-taxid.int.test.ts`: un caso válido y uno inválido por país a través de la API, y RF9/CA3 comparando la respuesta con `validateTaxId` para una muestra de filas.
  - `customers-duplicates.int.test.ts`: RF21, incluida la concurrencia con `Promise.all` de dos POST iguales, que da exactamente un 201 y un 409.
  - `customers-get.int.test.ts`: RF22.
  - `customers-search.int.test.ts`: RF23–RF25, con las filas de búsqueda, 51 coincidencias y orden.
  - `transport.int.test.ts`: RF26–RF30 y el orden 404 → transporte.
  - `errors.int.test.ts`: RF31 con un repositorio inyectado que lanza (500 genérico y 0 filas) y CA6, que comprueba la forma y los códigos de error de todas las respuestas.
  - `persistence.int.test.ts`: RF32/CA4 con un archivo temporal, cerrando y reabriendo la BD.
  - CA5: un helper `countCustomers(db)` comprueba que cada petición rechazada en los tests de integración no cambia el recuento.
- **Repositorio:** `customers.repository.test.ts` con `:memory:`: insert y find, `DuplicateCustomerError` y filtro con `instr` (`%` y `_` literales).

## 10. Decisiones tomadas
| Decisión | Alternativa descartada | Motivo |
|---|---|---|
| Validación de negocio en `shared/` invocada desde Zod (`superRefine`) | Reglas escritas directamente en esquemas Zod del backend | RF9: la UI debe reutilizarlas sin depender del backend |
| Orden español en memoria con `Intl.Collator('es')` | Clave de orden propia en BD; `COLLATE NOCASE` | Corrección ICU frente a una reimplementación frágil (§6.1) |
| Columna `company_name_search` + `instr` | `LIKE` con escape | `LIKE` solo ignora mayúsculas en ASCII y obliga a escapar `%` y `_` |
| Parser `express.raw` + `TextDecoder` estricto + `JSON.parse` propio en la ruta POST (T11) | `express.json()` global; `express.text` | Control exacto del vacío, de RF28 (UTF-8 estricto y BOM), de RF29 y del orden 404 → transporte. `express.text` sustituye los bytes no válidos por U+FFFD (§6.4) |
| Normalizar el tax ID una sola vez: `validateCustomerInput` comprueba el tipo, normaliza y llama a `validateNormalizedTaxId` (T11) | Pasar el valor ya normalizado a `validateTaxId`, que vuelve a normalizar | La doble normalización convertía `12345678Z\n-` en válido (el segundo trim quitaba el `\n`), en contra de RF2 |
| Middleware `rejectOptions` antes del router (T11) | Dejar el `OPTIONS` automático de Express | RF30: `OPTIONS` es un método no definido; `HEAD` sí se mantiene |
| `INSERT` directo + UNIQUE → 409 | Comprobar antes con `SELECT` | Evita la carrera entre comprobación e inserción |
| Express 5 | Express 4 | Errores async nativos |
| Sin build (tsx/Vitest sobre TS) | `tsc -b` con `dist/` | Menos configuración en la 001 |

## 11. Trazabilidad RF → tarea → test
| RF | Tarea | Test |
|---|---|---|
| RF1 | T8 | customers-create.int |
| RF2 | T2, T6, T8, T11 | normalize-tax-id, whitespace, validate-*, validate-tax-id (normalización única), customers-create.int, customers-taxid.int |
| RF3 | T6, T8 | validate-customer-input, customers-create.int |
| RF4 | T6 | validate-company-name, code-points |
| RF5 | T6 | validate-email |
| RF6 | T6 | iso3166-alpha2, validate-country |
| RF7 | T6 | validate-plan |
| RF8 | T6, T8 | validate-customer-input, customers-create.int |
| RF9 | T5, T10, T11 | validate-tax-id, customers-taxid.int (paridad, con las filas `12345678Z\n-` y `-\n-`) |
| RF10 | T3–T5 | es-*, pt-nif, de-vat, it-piva, validate-tax-id |
| RF11 | T3–T5 | todos los validadores de país |
| RF12 | T3, T11 | es-dni-nie (`00000022E`), es-cif (17 tipos con `it.each`), es |
| RF13 | T4 | pt-nif |
| RF14 | T4 | fr-siren |
| RF15 | T4 | de-vat |
| RF16 | T5, T11 | it-piva (`12345671016`: la oficina se comprueba antes que el control, RF10) |
| RF17 | T5 | gb-vat |
| RF18 | T3–T5 | todos los validadores de país |
| RF19 | T5, T11 | validate-tax-id, customers-create.int (mensaje literal) |
| RF20 | T5 | generic, validate-tax-id |
| RF21 | T7, T8, T10, T11 | customers.repository, customers-duplicates.int (`existingId: 2`), test del service (el 409 viene de UNIQUE) |
| RF22 | T9, T11 | customers-get.int (incluye `/%ZZ` y `/%` → `INVALID_ID`) |
| RF23 | T2, T9 | search-key, customers.repository, customers-search.int |
| RF24 | T9, T11 | sort-customers, customers-search.int, customers-search-order.int (empate Ácme/acme) |
| RF25 | T9 | customers-search.int |
| RF26, RF27, RF29 | T8 | content-type, transport.int |
| RF28 | T8, T11 | transport.int (0xE9 suelto, 0xC3 sin continuación, BOM, `Ibérica` válido) |
| RF30 | T8, T11 | transport.int (OPTIONS → 404; HEAD `/customers` y `/customers/:id` como GET sin cuerpo) |
| RF31 | T8, T10, T11 | errors.int (sin `as` en error-handler) |
| RF32 | T7, T10 | persistence.int |
| CA7 | T1, T10 | ejecución de `npm install`, `npm test`, `npm run lint` y `npm run dev` |
