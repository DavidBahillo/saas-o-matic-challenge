# Arquitectura de SaaS-O-Matic

Resumen en una página de cómo está organizado el sistema y de las reglas que se le dieron a la IA para mantenerlo limpio. El detalle de cada decisión está en [`MEMORY.md`](../MEMORY.md) y en el `plan.md` de cada spec.

## 1. Visión general

```
┌──────────────┐   /api/* (proxy Vite)   ┌──────────────────────────────┐   https   ┌──────────────────┐
│  frontend/   │ ──────────────────────▶ │  backend/ (Express)          │ ────────▶ │ open.er-api.com  │
│ React + Vite │                         │ routes → controllers →       │           │ (tipos de cambio)│
│ TanStack Q.  │ ◀────────────────────── │ services → repositories      │           └──────────────────┘
└──────┬───────┘        JSON             └──────┬───────────────┬───────┘
       │ importa                                │ importa       │ SQL
       ▼                                        ▼               ▼
┌──────────────────────────────────────────────────┐   ┌──────────────────┐
│ shared/  lógica pura: tramos, IVA, divisas,       │   │ SQLite           │
│          validadores de NIF (ES y otros países)   │   │ (better-sqlite3) │
└──────────────────────────────────────────────────┘   └──────────────────┘
```

- **Monorepo con npm workspaces**: `shared/`, `backend/` y `frontend/`, TypeScript estricto en los tres.
- **Una sola fuente de verdad** (constitución, principio 3): el cálculo de tramos e IVA vive en `shared/`. El frontend lo usa para la vista previa en tiempo real y el backend lo vuelve a ejecutar al guardar; nunca se confía en un total enviado por el cliente.

## 2. Organización de carpetas

| Carpeta | Contenido | Regla |
|---|---|---|
| `shared/src/pricing/` | Tramos acumulativos, IVA por país, redondeo half-up | Funciones puras, sin E/S, con TDD |
| `shared/src/taxid/` | Un archivo por algoritmo (`es-dni-nie.ts`, `es-cif.ts`, `pt-nif.ts`…) | Un validador por archivo |
| `shared/src/currency/` | Lista de divisas y conversión congelada | Céntimos enteros |
| `backend/src/routes/` | Declaración de endpoints | Sin lógica |
| `backend/src/controllers/` | Traducen HTTP ↔ servicio | Sin SQL |
| `backend/src/schemas/` | Esquemas Zod de cuerpos y queries | Validación en el borde |
| `backend/src/services/` | Casos de uso (crear cliente, simular, borrar en cascada) | Orquestan dominio y repositorios |
| `backend/src/repositories/` | SQL, esquema y migraciones | El SQL solo vive aquí |
| `backend/src/rates/` | Adaptador de open.er-api.com y caché de snapshot | El proveedor se inyecta (tests sin red) |
| `backend/src/http/` | Errores, content-type, manejador global | Formato `{ error: { code, message, details? } }` |
| `frontend/src/api/` | Cliente HTTP, queries y mutaciones de TanStack Query, esquemas Zod de respuesta | La UI nunca hace `fetch` directo |
| `frontend/src/customers/`, `simulator/`, `layout/` | Componentes por funcionalidad | Solo tokens de `DESIGN.md` |

## 3. Base de datos

Dos tablas en SQLite, con `PRAGMA foreign_keys = ON` siempre. El esquema está en [`schema.ts`](../backend/src/repositories/schema.ts) y [`simulations-ddl.ts`](../backend/src/repositories/simulations-ddl.ts).

```
customers                                   simulations
─────────────────────────────               ───────────────────────────────────────
id            PK                    1 ───< customer_id  FK → customers ON DELETE CASCADE
company_name                                users, storage, api_calls
company_name_search  (búsqueda)             tiers_json            (desglose congelado)
tax_id, tax_id_type  (DNI, CIF…)            base_cents, vat_rate_percent, vat_cents, total_cents
email, country (ISO-2), plan                country               (país del IVA, congelado)
created_at                                  currency, exchange_rate_micros, exchange_rate_at
UNIQUE (country, tax_id)                    converted_base/vat/total_cents
                                            created_at
                                            INDEX (customer_id, created_at DESC, id DESC)
```

Decisiones clave:
- **Importes en céntimos enteros** y tipo de cambio en micros (`exchange_rate_micros`): sin coma flotante en la base de datos.
- **Simulación congelada**: se guarda el desglose, el IVA y la conversión del momento; las lecturas no recalculan, así un cambio de tarifa o de tipo no altera presupuestos ya enviados.
- **Los `CHECK` son una red de integridad**, no reglas de negocio: las reglas viven en `shared/`.
- **Migraciones idempotentes** en código (`migrate()` al arrancar), sin herramienta externa.
- **`company_name_search`** normalizada (sin tildes ni mayúsculas) para que el buscador encuentre "Acmé" con "acme".

## 4. Directrices dadas a la IA para mantener el código limpio

1. **Constitución** ([`docs/constitution.md`](../docs/constitution.md)): 10 principios que ganan a cualquier spec (spec antes que código, céntimos, capas, archivos pequeños, errores explícitos…).
2. **`CLAUDE.md`**: reglas que la IA lee en cada sesión: capas `routes → controllers → services → repositories`, archivos < 200 líneas y funciones < 40, nada de `any`, Zod en el borde, tokens de diseño, ninguna dependencia sin justificar en el plan.
3. **ESLint como guardia automática**: `max-lines`, `max-lines-per-function` y `no-explicit-any` hacen fallar `npm run lint` si la IA genera archivos o funciones grandes, así que no depende de que la IA "se acuerde".
4. **Flujo SDD multiagente** (`/sdd`): el planner solo escribe en `specs/`, el implementer hace una tarea por llamada con el test primero y el reviewer valida RF por RF sin poder editar. Separar roles evita que la misma IA que escribe el código se lo apruebe.
5. **`MEMORY.md`**: decisiones vigentes con su alternativa descartada, para que la IA no reabra lo ya decidido en sesiones nuevas.
6. **Revisión humana en git**: la skill `/git-commit` se detiene hasta que el usuario aprueba cada commit.

## 5. Decisiones de diseño que conviene conocer

- **Tipos de cambio a través del backend.** El frontend no llama a open.er-api.com directamente, sino a `GET /exchange-rates`. Motivos: (a) la conversión que se guarda debe usar un tipo que el backend controle, porque nunca se fía de valores del cliente (principio 3); (b) un snapshot en caché 24 h, compartido por todos los usuarios, respeta el límite de peticiones del proveedor; (c) los tests no tocan la red porque el proveedor se inyecta; (d) no hace falta CORS. Para el usuario el efecto es el pedido: cambia la divisa y ve los costes convertidos en tiempo real, con estados de carga y error ("Reintentar").
- **Almacenamiento y llamadas a la API no suman al precio** (decisión D4). El enunciado solo define tarifa para usuarios; inventar precios por GB o por llamada sería añadir reglas de negocio no pedidas. Se guardan con cada simulación para que el día que se tarifiquen baste con ampliar `shared/src/pricing/`.
