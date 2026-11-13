# MEMORY — estado vivo del proyecto

Breve: menos de 60 líneas. Solo decisiones vigentes y estado. El histórico está en `ai-workspace/journal.md`.

## Decisiones vigentes
- D1 · Stack: monorepo npm con `shared/`, `backend/` (Express + SQLite) y `frontend/` (React + Vite). *Descartado:* NestJS, demasiado ceremonioso para el alcance.
- D2 · Importes en céntimos enteros. *Descartado:* `number` con decimales, por errores de coma flotante.
- D3 · Cálculo de tramos compartido en `shared/` para que el slider responda en tiempo real y coincida con el backend.
- D4 · Coste base = solo tramos de usuarios. El almacenamiento y las llamadas a la API se guardan pero no suman (el enunciado no les asigna precio).
- D5 · IVA mediante una tabla fija por país en `shared/` (ES 21 %, PT 23 %, FR 20 %, DE 19 %, IT 22 %, GB 20 %, US 0 %, resto de países ISO válidos 0 %; un código no válido es un error, no un 0 %).
- D6 · UI en modo oscuro por defecto (`DESIGN.md`), basada en InsightDeck.
- D7 · Multiagente: el coordinador es el comando `/sdd` (en Claude Code los subagentes no anidan).
- D8 · Commits solo con la skill `/git-commit`: Conventional Commits en inglés y aprobación humana antes de commit y push. Siempre con cuerpo explicativo en viñetas.
- D9 · Clientes (spec 001): plan en lista cerrada `starter|growth|enterprise`, solo informativo (no cambia el precio, D4). País: cualquier ISO 3166-1 alfa-2 (`UK` → 400, con sugerencia GB). Unicidad por (país, tax ID normalizado) → 409. Email no único.
- D10 · Tax ID: algoritmo oficial para ES (DNI/NIE/CIF), PT (NIF), FR (solo SIREN), DE (solo USt-IdNr), IT (Partita IVA + código de oficina) y GB (VAT de 9 dígitos, mód. 97/9755). Resto: formato genérico. Se rechazan el prefijo de país, todo ceros y el DNI de 7 dígitos. Validadores puros en `shared/`. *Descartado:* validar solo ES.
- D11 · Listado de clientes ordenado con colación española y desempate por id. La búsqueda no ignora tildes. `frontend/` se crea en la spec 005.
- D12 · Versiones: better-sqlite3 12 (la 11.x no tiene binario para Node 24 en win32), zod 4 y vitest 4 (las 3.x tenían vulnerabilidades altas o críticas). Quedan 7 avisos moderados de minimatch vía typescript-eslint, solo en desarrollo y aceptados. Node ≥ 22.
- D13 · Tramos (spec 002): fijos y congelados en `shared/` (10 €, 8 € y 5 €; límites 10 y 50), con usuarios de 0 a 100 000. El IVA va en la 002 y solo sobre la base de tramos, half-up al céntimo y una sola vez. El desglose lleva siempre los tres tramos. País estricto sin normalizar, con los códigos de la 001. Los campos ajenos se ignoran (Zod los rechaza en la 003). Errores tipados, nunca excepciones. La spec está redactada en euros y la implementación trabaja en céntimos. *Descartado:* tramos configurables, IVA sobre bases arbitrarias y BigInt.
- D14 · Simulaciones (spec 003): ligadas a un cliente existente (`customerId`); el país del IVA es el del cliente (404 `CUSTOMER_NOT_FOUND`). Precio congelado (desglose, base, país, tipo de IVA, IVA y total, siempre con `calculateQuote`; las lecturas no recalculan). `storage` (GB) y `apiCalls` (llamadas/mes): opcionales, 0 por defecto, enteros 0–1 000 000, no suman (D4). Zod estricto: `UNKNOWN_FIELD` en el orden del cuerpo. Endpoints: `POST /simulations`, `GET /simulations/:id`, `GET /customers/:id/simulations` (`createdAt` DESC, `id` DESC, sin paginación). Inmutables. Códigos nuevos: `INVALID_RESOURCE` (`NOT_INTEGER`/`NEGATIVE`/`TOO_LARGE`) y `SIMULATION_NOT_FOUND`. `PRAGMA foreign_keys = ON` siempre y FK `ON DELETE RESTRICT`. Ampliada por la 004: la simulación congela también `currency`, `exchangeRate`, `exchangeRateAt` y los importes convertidos (`currency` entra en el orden de validación tras `apiCalls`). *Descartado:* sin cliente, recalcular al leer, paginación, listado global, borrado.
- D15 · Divisa (spec 004): el precio se calcula siempre en euros (principio 2 de la constitución, enmendado) y se convierte una sola vez al crear la simulación; se congelan divisa, tipo y fecha. U1 EUR, USD y GBP. U2 API externa con caché (Frankfurter/BCE, sin clave, `EXCHANGE_RATES_URL`). U3 lecturas sin reconvertir. U4 base e IVA se convierten por separado (half-up) y el total es su suma; los tramos no se convierten. U5 `currency` opcional, EUR por defecto; las simulaciones de la 003 migran como EUR. U6 sin tipo vigente y API caída: 500 `EXCHANGE_RATE_UNAVAILABLE`. U7 caché en memoria de 24 h por divisa. U8 tipo válido de 0,01 a 100 (6 decimales). U9 `GET /exchange-rates` para la vista previa de la interfaz (misma función de `shared/`). V1 timeout 5 s, V2 sin tipos parciales, V3 lista en `suggestion`, V4 antigüedad negativa no vigente, V5 caché en memoria. Códigos nuevos: `INVALID_CURRENCY`, `CURRENCY_NOT_AVAILABLE`, `EXCHANGE_RATE_UNAVAILABLE`. El tipo es un entero en micro-unidades (texto de 6 decimales en el JSON) y el producto cabe en enteros seguros, sin BigInt. *Descartado:* tabla fija, caducados con aviso, convertir al leer, convertir los tramos.

## Estado de specs
| Spec | Estado |
|---|---|
| 001-customers-taxid | completada · reviewer APROBADO (2 vueltas de corrección) |
| 002-tiered-pricing | completada · reviewer APROBADO (1 vuelta de corrección) |
| 003-simulations | completada · reviewer APROBADO (0 vueltas de corrección) |
| 004-currency | completada · reviewer APROBADO (0 vueltas de corrección) |
| 005-dashboard-ui | pendiente |
| 006-readme-seed | pendiente |
