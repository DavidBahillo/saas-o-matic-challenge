# 006 · Tareas
Spec: [spec.md](spec.md) · Plan: [plan.md](plan.md)

Reglas para todas las tareas:
- TDD: primero los tests en rojo, después el código.
- Al terminar cada tarea, `npm test` y `npm run lint` quedan en verde, incluidos los tests de la 001 a la 005.
- Ningún archivo de más de 200 líneas ni función de más de 40, nada de `any` y ninguna dependencia nueva (CA8).
- Todos los tests usan BD en memoria y ninguno llama a una API real. Importes en céntimos enteros; los literales de los tests salen de la spec.
- El seed solo reutiliza `shared/` y los servicios y repositorios existentes: no escribe SQL ni calcula importes.
- El orden de los bloques es obligatorio: A y luego B.

## Bloque A · Seed del backend (T1–T2)

- [x] T1 · Datos, tipos fijos y lógica pura del seed — RF: RF2, RF3, RF4 — Archivos: `backend/src/seed/{seed-types,seed-rates,seed-customers,seed-simulations,seed-data,validate-seed,format-summary}.ts` y los tests de `seed-rates`, `validate-seed` y `format-summary`. — Hecho cuando: `createSeedRates().getRate('USD')` da 1 100 000 micros, `GBP` 850 000 y `at` `2026-01-01T00:00:00.000Z`, sin red; `validateSeedData(SEED_DATA)` devuelve `[]`; cada cliente semilla pasa `validateCustomerInput`; los datos cubren RF3 (ES con DNI, NIE y CIF; PT, FR, DE, IT, GB y US; los tres planes; 14 simulaciones con 0, 1, 10, 11, 50 y 51 usuarios, EUR, USD y GBP, un cliente sin simulaciones y uno con varias); un DNI con letra errónea, país `UK`, divisa `CHF`, `customerKey` inexistente, duplicado y 100001 usuarios dan una incidencia con sujeto, campo y motivo; `formatSummary` da el texto del plan §7 en la primera y la segunda ejecución.

- [x] T2 · `runSeed`, transacción, CLI y scripts — RF: RF1, RF2, RF4 — Archivos: `backend/src/repositories/transaction.ts` y su test, `backend/src/seed/{run-seed,seed}.ts`, `run-seed.test.ts`, `backend/test/seed.int.test.ts`, `backend/package.json` (script `seed` con `tsx`) y `package.json` raíz (script `seed`). — Hecho cuando: sobre una base vacía `runSeed` crea los clientes y 14 simulaciones y devuelve el resumen; las filas 1 a 7 y 10 del plan §6 dan 0,00/0,00/0,00, 10,00/2,10/12,10, 100,00/21,00/121,00, 108,00/22,68/130,68, 420,00/88,20/508,20, 425,00/89,25/514,25, 467,50/98,18/565,68 USD y 140,00/0,00/140,00 (en céntimos); USD y GBP congelan tipo y `exchangeRateAt` del seed; una segunda ejecución crea 0 y deja los totales; un cliente ya existente no se duplica ni se modifica ni recibe simulaciones y conserva las suyas, y los datos de otros clientes no cambian; un dato corrupto lanza `SeedDataError` sin tocar la base; un fallo a mitad (rates que lanza en GBP) hace ROLLBACK y no guarda nada; `runInAsyncTransaction` confirma al resolver y deshace al rechazar; `seed.int.test.ts` lee los datos con `GET /customers` y `GET /customers/:id/simulations` y `simulationCount` coincide con cada lista; `seed.ts` termina con 0 y resumen, o con 1 y el motivo en stderr (incluido `ConfigError` de `DB_PATH`); el script `seed` existe en la raíz y en `backend/`.

## Bloque B · README y verificación (T3–T4)

- [x] T3 · README y test de coherencia — RF: RF5 — Archivos: `README.md` (español, solo texto, secciones del plan §9) y `backend/test/readme.test.ts`. — Hecho cuando: el README cubre todos los puntos de RF5 con los valores de `config.ts`, `package.json` y `shared/`; el test comprueba que cada `npm run X` está en `package.json`, cada variable de entorno en `config.ts`, cada `MÉTODO /ruta` en `routes/` y cada enlace relativo apunta a un archivo o carpeta existente (y falla si se rompe uno de ellos); el ejemplo de petición es válido contra la API.

- [x] T4 · Verificación y cierre — RF: RF1 a RF5 (CA1 a CA8) — Archivos: `MEMORY.md` (D17 con U1 a U7 y las decisiones D-P1 a D-P2; estado de la 006; menos de 60 líneas) y ajustes de revisión de los archivos de T1 a T3. — Hecho cuando: `npm test` y `npm run lint` terminan en verde; se ejecuta `npm run seed` con `DB_PATH` temporal dos veces (resumen 9/14 y luego 0 creados) y con `DB_PATH` vacío (código 1); con los datos cargados `npm run dev` muestra la lista con `simulationCount` y el cliente sin simulaciones ofrece "Crear la primera simulación" (comprobación manual para el reviewer); `package.json` no tiene dependencias nuevas; ningún archivo pasa de 200 líneas ni función de 40; `MEMORY.md` tiene D17 y menos de 60 líneas.
