# 006 · README y datos semilla
Estado: aprobada

> **Importes:** como en las specs anteriores, se redactan en la unidad natural (€, USD, GBP); la implementación trabaja en céntimos enteros (D2).

## Decisiones del usuario
- U1 · Comando: `npm run seed` en la raíz, que delega en un script de `backend/`. *Descartado:* solo script del workspace y sembrar al arrancar el backend.
- U2 · Clientes semilla: 9 (corregido desde 8: RF3 exige ES con DNI, NIE y CIF más PT, FR, DE, IT, GB y US, que son 9 como mínimo). *Descartado:* 5, 8 y 12 o más.
- U3 · Simulaciones semilla: de 12 a 15. *Descartado:* 6 y 25 o más.
- U4 · Idempotente: añade solo lo que falta, sin borrar nada y sin opción `--reset`. *Descartado:* borrar y resembrar, y negarse si la base no está vacía.
- U5 · Tipos de cambio fijos y documentados en el seed (1 EUR = 1,10 USD y 0,85 GBP, `exchangeRateAt` fijo `2026-01-01T00:00:00.000Z`), sin red. *Descartado:* pedir los tipos a Frankfurter, con o sin respaldo.
- U6 · README en español, solo texto, sin capturas. *Descartado:* bilingüe, inglés y capturas.
- U7 · Las simulaciones semilla se crean solo para los clientes que el seed crea en esa misma ejecución. Un cliente que ya existía (mismo país + tax ID) no se toca y no recibe simulaciones. Sin cambios de esquema (no se marca el origen de los datos). *Descartado:* marcar los datos semilla en la base y rellenar simulaciones a clientes ya existentes.

## Contexto y objetivo (por qué)
Las specs 001 a 005 dejan una herramienta completa, pero un recién llegado no puede probarla: la base de datos está vacía (la lista muestra solo el estado vacío), no hay documentación de cómo arrancarla y la 005 dejó "datos de ejemplo y README" fuera de alcance.

Esta spec añade (1) un README que permita instalar, arrancar, probar y entender el proyecto en pocos minutos, y (2) un comando de datos semilla que deje la base con clientes y simulaciones realistas, que ejerciten los casos límite de la herramienta (tramos, IVA por país, identificadores fiscales de cada tipo y divisas).

Principios que condicionan la spec:
- Los datos semilla no son una vía alternativa: pasan por las mismas reglas que la API (principio 4 y 3). Un cliente con identificador inválido o una simulación con importes escritos a mano sería un dato que la API jamás habría aceptado.
- Precisión monetaria y congelación (principio 2, D14, D15): los importes de las simulaciones semilla los calcula la regla compartida y se congelan igual que en producción; el seed no inventa totales.
- Lógica con tests y archivos pequeños (principios 5 y 7).

## Requisitos funcionales (EARS)
- RF1: CUANDO el usuario ejecuta `npm run seed` desde la raíz (U1), el sistema DEBERÁ insertar en la base de datos configurada (`DB_PATH`, o la de desarrollo por defecto) un conjunto fijo de 9 clientes semilla (U2) y de 12 a 15 simulaciones semilla (U3), y terminar con código 0 mostrando un resumen de lo creado (clientes y simulaciones).
- RF2: El sistema DEBERÁ crear los datos semilla con las mismas reglas que la API: cada cliente pasa por los validadores de `shared/` (país ISO y identificador fiscal con el algoritmo oficial, principio 4) y cada simulación se calcula con `calculateQuote` y la conversión de `shared/` y se guarda congelada (D14, D15). SI algún dato semilla no pasa esas reglas, ENTONCES el comando DEBERÁ terminar con código distinto de 0, indicando qué dato falló, y NO DEBERÁ dejar datos a medias (todo o nada).
- RF3: El conjunto de clientes semilla DEBERÁ cubrir como mínimo: España con DNI, NIE y CIF (cada uno con letra o dígito de control correctos); al menos un cliente de PT, FR, DE, IT y GB (D10); uno de US (IVA 0 %); y los tres planes (`starter`, `growth`, `enterprise`). El conjunto de simulaciones semilla DEBERÁ cubrir los límites de tramo 0, 1, 10, 11, 50 y 51 usuarios, las tres divisas (EUR, USD y GBP) y al menos un cliente sin simulaciones y uno con varias, para que la lista, el vacío y el `simulationCount` se vean con datos reales.
- RF4: CUANDO el comando se ejecuta y la base ya contiene datos semilla o de otro origen, el sistema DEBERÁ ser idempotente (U4): no duplicar clientes ya presentes por la unicidad país + tax ID (D9), crear simulaciones semilla solo para los clientes que crea en esa misma ejecución (U7; un cliente ya existente no se modifica y no recibe simulaciones) y no tocar ni borrar ningún dato previo. No hay opción de reseteo. Las simulaciones en USD y GBP DEBERÁN congelarse con los tipos fijos del seed (U5), sin llamar a la red ni a `GET /exchange-rates`.
- RF5: El proyecto DEBERÁ tener un `README.md` en la raíz, en español, solo texto y sin capturas (U6), que explique como mínimo: qué es SaaS-O-Matic y para quién; requisitos (Node ≥ 22, D12); instalación; `npm run dev` (puertos y proxy `/api`); `npm run seed` y su efecto; `npm test` y `npm run lint`; la estructura del monorepo (`shared/`, `backend/`, `frontend/`); variables de entorno (`PORT`, `DB_PATH`, `EXCHANGE_RATES_URL`); la lista de endpoints de la API con un ejemplo de petición; las reglas de negocio clave (tramos, IVA por país, divisas y congelación); y el flujo SDD con enlace a `docs/constitution.md`, `MEMORY.md` y `specs/`. Todo comando y variable del README DEBERÁ existir y funcionar tal como se documenta.

## Casos límite (entrada → salida esperada)

### Seed
| Entrada | Salida esperada |
|---|---|
| `npm run seed` con la base vacía | Clientes y simulaciones semilla creados; resumen con los totales; código 0 |
| `npm run seed` dos veces seguidas | La segunda vez no crea nada nuevo, informa "0 creados, N ya existentes" y termina con 0; los totales de la base no cambian |
| Base con un cliente semilla ya existente (con o sin simulaciones, también las añadidas a mano) | El cliente no se duplica ni se modifica; sus simulaciones se conservan; no recibe simulaciones semilla. Los clientes semilla que faltan se crean con sus simulaciones |
| Base con datos reales de otros clientes | No se modifican ni borran |
| Cliente semilla con DNI de letra errónea (dato corrompido en el código) | Código distinto de 0, mensaje con el cliente y el motivo; no queda ningún dato semilla a medias |
| `DB_PATH` apunta a un directorio que no existe | Se crea igual que en el backend (`openDatabase`) y el seed funciona |
| `DB_PATH` inválido (vacío o con carácter nulo) | Mismo error de configuración que el backend; código distinto de 0 |
| Seed con la base de otra versión (sin migrar) | El esquema se crea o migra como lo haría el backend antes de insertar |
| Seed sin conexión a internet | Funciona igual: las simulaciones USD y GBP usan los tipos fijos del seed (1,10 y 0,85) |
| Seed con ejecución interrumpida a la mitad | Nada a medias (transacción): la base queda como estaba |

### Datos semilla (propiedades comprobables)
| Dato | Comprobación |
|---|---|
| Cada cliente semilla | Pasa `validateCustomerInput` de `shared/` (país ISO e identificador fiscal oficial) |
| Usuarios 0, 1, 10, 11, 50 y 51 (cliente `ES`) | Base / IVA / Total: 0,00 / 0,00 / 0,00; 10,00 / 2,10 / 12,10; 100,00 / 21,00 / 121,00; 108,00 / 22,68 / 130,68; 420,00 / 88,20 / 508,20; 425,00 / 89,25 / 514,25 EUR (mismas cifras que la 002) |
| Cliente `US` con 15 usuarios | 140,00 / 0,00 / 140,00 EUR (IVA 0 %) |
| 51 usuarios en USD con tipo 1,10 (cliente `ES`) | IVA convertido 98,18 y total 565,68 USD (half-up al céntimo, 004) |
| Simulación semilla en USD o GBP | `currency`, `exchangeRate` y `exchangeRateAt` congelados y coherentes con los importes convertidos |
| Todas las simulaciones semilla | `storage` y `apiCalls` dentro de 0–1 000 000 y no suman al precio (D4) |
| Cliente sin simulaciones | `simulationCount` 0; la interfaz muestra "Crear la primera simulación" |

### README
| Caso | Salida esperada |
|---|---|
| Una persona nueva sigue el README en una máquina limpia (Node ≥ 22) | Llega a ver la interfaz con datos en el navegador sin consultar otra fuente |
| Un script o variable citados en el README | Existe en `package.json` / `config.ts` con el nombre y el valor por defecto documentados |
| Un endpoint citado en el README | Existe en el backend con su método y ruta |
| Un enlace relativo del README (`docs/constitution.md`, `MEMORY.md`, `specs/`) | Apunta a un archivo o carpeta existente |

### Casos límite obligatorios de SaaS-O-Matic
- Límites de tramo 0, 1, 10, 11, 50 y 51: ver "Datos semilla".
- Letras de control de DNI, NIE y CIF: los clientes españoles semilla tienen cada tipo con control válido (RF3); el dato corrupto falla (ver "Seed").
- Divisa no disponible: el seed solo usa EUR, USD y GBP; una divisa fuera de la lista en un dato semilla es un dato inválido y hace fallar el comando (RF2).
- Redondeo del IVA: la simulación de 11 usuarios (22,68 EUR) y la de 51 usuarios en USD (98,18).

## Criterios de aceptación
- CA1: `npm run seed` sobre una base vacía termina con código 0 y deja los clientes y simulaciones de RF3; un test automatizado lo comprueba con una base en memoria y sin red.
- CA2: Un test comprueba que cada cliente semilla pasa los validadores de `shared/` y que las simulaciones semilla coinciden con `calculateQuote` y la conversión de `shared/` para los usuarios 0, 1, 10, 11, 50 y 51 y las cifras de la tabla (incluidos 22,68 EUR y 98,18 USD).
- CA3: Un test comprueba la idempotencia (RF4): dos ejecuciones seguidas dejan los mismos totales; un cliente semilla ya existente no se duplica, no se modifica y no recibe simulaciones (U7), y sus simulaciones previas se conservan.
- CA4: Un test comprueba que un dato semilla inválido hace fallar el comando y no deja datos a medias.
- CA5: Los datos semilla se leen sin errores desde la API real (`GET /customers`, `GET /customers/:id/simulations`) y el `simulationCount` de cada cliente coincide con su lista.
- CA6: Todo script, variable de entorno, endpoint y enlace citados en el README existen (verificado por un test sencillo o por revisión del reviewer con evidencia).
- CA7: `npm test` y `npm run lint` terminan sin errores y `npm run dev` sigue funcionando; ningún test llama a una API real.
- CA8: El seed no añade dependencias nuevas, o cada una se justifica en el plan (CLAUDE.md).

## Fuera de alcance
- Datos de ejemplo para producción o para otros entornos, y un panel de administración de datos.
- Borrar, vaciar o resembrar la base de datos desde el comando (sin `--reset`).
- Obtener tipos de cambio reales en el seed.
- Generación aleatoria o masiva de datos, e importación/exportación (CSV, JSON).
- Cambios en las reglas de negocio, en los contratos de la API o en la interfaz.
- Documentación en otros idiomas, sitio de documentación y diagramas generados.
- Despliegue, Docker e integración continua.

## Preguntas abiertas
Ninguna. U1 a U6 están cerradas.
