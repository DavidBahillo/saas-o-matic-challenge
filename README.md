# SaaS-O-Matic

Herramienta interna para que el equipo comercial simule y presupueste suscripciones SaaS multidivisa. Permite registrar clientes, calcular el precio por tramos de usuarios con el IVA de su país y guardar presupuestos en 23 divisas con el tipo de cambio congelado.

## Puesta en marcha (paso a paso)
Sigue estos pasos en orden la primera vez que clones el repositorio.

### 1. Requisitos previos
- **Node.js 22 o superior** (lo exige `engines` del `package.json`). Compruébalo con `node -v`.
- **npm** (viene con Node). Compruébalo con `npm -v`.
- **Git**.
- **Conexión a internet**, para instalar dependencias y, ya en marcha, para los tipos de cambio (open.er-api.com) y las banderas (flagcdn.com).
- `better-sqlite3` es un módulo nativo. Normalmente se descarga precompilado, pero si no hay binario para tu sistema o tu versión de Node, `npm install` lo compila y necesitas:
  - **Windows**: Python 3 y Visual Studio Build Tools con la carga de trabajo "Desarrollo para el escritorio con C++".
  - **macOS**: `xcode-select --install`.
  - **Linux**: `python3`, `make` y `g++` (en Debian/Ubuntu, `sudo apt install build-essential python3`).

### 2. Clonar el repositorio
```bash
git clone https://github.com/DavidBahillo/saas-o-matic-challenge.git
cd saas-o-matic-challenge
```

### 3. Instalar las dependencias (una sola vez, en la raíz)
```bash
npm install
```
El repositorio es un monorepo con **npm workspaces** (`shared`, `backend` y `frontend`), así que este único comando, ejecutado en la raíz, instala las dependencias de los tres paquetes y enlaza `@saas-o-matic/shared`. **No ejecutes `npm install` dentro de `backend/` ni de `frontend/`**: crearía lockfiles y dependencias duplicadas. Para añadir una dependencia a un solo paquete, hazlo también desde la raíz: `npm install <paquete> -w @saas-o-matic/backend`.

### 4. Cargar datos de ejemplo (recomendado)
```bash
npm run seed
```
Sin este paso la aplicación arranca vacía. La base de datos SQLite se crea sola en `backend/data/saas-o-matic.db`. La primera vez verás:
```
Clientes: 9 creados, 0 ya existentes
Simulaciones: 14 creadas
```
Detalles del seed:
- Carga 9 clientes de distintos países, planes y tipos de identificador fiscal, y 14 simulaciones en EUR, USD y GBP (una en cada límite de tramo). Un cliente no tiene simulaciones y otro tiene varias.
- Es idempotente: si lo ejecutas otra vez informa "0 creados, 9 ya existentes". Los clientes que ya existen no se modifican ni reciben simulaciones, y los datos de otros clientes no se tocan.
- No usa la red: las simulaciones en USD y GBP congelan tipos fijos (1,10 USD y 0,85 GBP por euro).
- Es todo o nada: si un dato no es válido o algo falla, no se guarda nada y el comando termina con código 1.

### 5. Arrancar la aplicación
```bash
npm run dev
```
Levanta a la vez el backend y el frontend (los logs salen con el prefijo `[backend]` y `[frontend]`):
- Backend (Express): `http://localhost:3000`. Verás `SaaS-O-Matic backend escuchando en http://localhost:3000`.
- Frontend (Vite): `http://localhost:5173`.
- El frontend reenvía las peticiones `/api/...` al backend quitando el prefijo `/api` (proxy de Vite, sin CORS).

### 6. Abrir la aplicación
- Abre **http://localhost:5173** en el navegador.
- Para comprobar que el backend responde, abre http://localhost:3000/customers: debe devolver un JSON con los clientes.

### 7. Comprobar que todo está bien (opcional)
```bash
npm test
```
```bash
npm run lint
```
`npm test` ejecuta todos los tests (Vitest) y `npm run lint` pasa ESLint y la comprobación de tipos de los tres paquetes. Existe también `npm run test:quiet`, con salida reducida. Los tests no usan la red ni tu base de datos.

### 8. Parar la aplicación
Pulsa `Ctrl+C` en la terminal donde corre `npm run dev`: se detienen el backend y el frontend a la vez.

## Problemas frecuentes
| Síntoma | Solución |
|---|---|
| `npm install` falla compilando `better-sqlite3` (`node-gyp`, `gyp ERR!`) | Instala las herramientas de compilación del paso 1 y repite `npm install`. |
| `EBADENGINE` o errores de sintaxis al arrancar | Tu Node es anterior a la 22: actualízalo (por ejemplo con nvm). |
| `EADDRINUSE` en el puerto 3000 | Otro proceso usa el puerto: ciérralo o arranca con otro `PORT` (y el mismo valor en `BACKEND_URL`, ver abajo). |
| Vite arranca en 5174 u otro puerto | El 5173 estaba ocupado; usa la URL que muestra la terminal. |
| La interfaz carga pero las peticiones fallan | El backend no está levantado o `BACKEND_URL` no apunta a su puerto. |
| Las divisas distintas de EUR no muestran tipo de cambio | Sin conexión a open.er-api.com. Funciona en EUR; reintenta pasados 60 s. |
| Las banderas no se ven | Sin conexión a flagcdn.com: se muestra solo el código del país. |
| Quiero empezar con la base de datos vacía | Para la app, borra `backend/data/` y, si quieres datos, vuelve a ejecutar `npm run seed`. |

## Estructura del monorepo
- `shared/`: lógica pura compartida (tramos, IVA, divisas, validadores de identificador fiscal).
- `backend/`: API Express con SQLite (better-sqlite3) y validación con Zod, en capas rutas, controladores, servicios y repositorios.
- `frontend/`: interfaz React con Vite y TanStack Query.

## Variables de entorno
| Variable | Por defecto | Efecto |
|---|---|---|
| `PORT` | `3000` | Puerto del backend (entero de 1 a 65535). |
| `DB_PATH` | `backend/data/saas-o-matic.db` | Ruta del archivo SQLite; no puede estar vacía. Se crea si no existe. También la usa `npm run seed`. |
| `EXCHANGE_RATES_URL` | `https://open.er-api.com/v6/latest/EUR` | URL https del proveedor de tipos de cambio (open.er-api.com, sin clave, base EUR). Si no es https, el backend no arranca. |
| `BACKEND_URL` | `http://localhost:3000` | Destino del proxy `/api` del frontend (Vite). Si cambias `PORT`, pon aquí el mismo puerto. |

El proyecto **no lee archivos `.env`**: crear uno no tiene efecto. Las variables se pasan en la terminal al lanzar el comando. Por ejemplo, para usar el puerto 4000:

bash (Linux, macOS, Git Bash):
```bash
PORT=4000 BACKEND_URL=http://localhost:4000 npm run dev
```
PowerShell (Windows):
```powershell
$env:PORT="4000"; $env:BACKEND_URL="http://localhost:4000"; npm run dev
```
En PowerShell las variables duran lo que la sesión de la terminal.

## API
| Endpoint | Descripción |
|---|---|
| `POST /customers` | Da de alta un cliente. |
| `GET /customers` | Lista paginada de clientes, con `simulationCount` (parámetros opcionales `q` de búsqueda y `page`). |
| `GET /customers/:id` | Detalle de un cliente. |
| `PUT /customers/:id` | Edita un cliente. |
| `DELETE /customers/:id` | Borra un cliente y, en cascada, sus simulaciones. |
| `POST /simulations` | Crea una simulación con el precio congelado. |
| `GET /simulations/:id` | Detalle de una simulación. |
| `GET /customers/:id/simulations` | Simulaciones de un cliente, las más recientes primero. |
| `GET /exchange-rates` | Tipos de cambio vigentes de las divisas disponibles (las que el proveedor no trae o trae inválidas se omiten). |

Ejemplo de petición (con el backend en marcha y un cliente con id 1, por ejemplo tras `npm run seed`):
bash:
```bash
curl -X POST http://localhost:3000/simulations -H "Content-Type: application/json" -d '{"customerId":1,"users":25,"storage":100,"apiCalls":5000,"currency":"EUR"}'
```
PowerShell (las comillas simples del ejemplo anterior no funcionan ahí):
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/simulations -ContentType "application/json" -Body '{"customerId":1,"users":25,"storage":100,"apiCalls":5000,"currency":"EUR"}'
```

## Reglas de negocio
- Los importes se manejan en céntimos enteros.
- Precio por usuario y mes, por tramos: 10 EUR hasta 10 usuarios, 8 EUR de 11 a 50 y 5 EUR a partir de 51. Se admiten de 0 a 100 000 usuarios.
- El almacenamiento y las llamadas a la API se guardan con cada simulación, pero no suman al precio: el enunciado solo fija tarifa por usuario y no se inventan reglas de negocio. Quedan persistidos para poder tarifarlos más adelante ampliando `shared/src/pricing/` (decisión D4 en `MEMORY.md`).
- El IVA se calcula sobre el coste base con el tipo del país del cliente: ES 21 %, PT 23 %, FR 20 %, DE 19 %, IT 22 %, GB 20 %, US 0 % y 0 % para el resto de países ISO válidos.
- El precio se calcula siempre en euros. Divisas disponibles (lista fija de `shared/`): EUR, USD, GBP, CHF, SEK, NOK, DKK, PLN, CZK, CAD, AUD, NZD, MXN, BRL, RON, HKD, SGD, CNY, ILS, ZAR, TRY, THB y AED. Al abrir un cliente, el simulador arranca con la divisa de su país (EUR si no tiene una en la lista o sus tipos no están disponibles). La conversión se hace una sola vez al crear la simulación, y se congelan la divisa, el tipo de cambio y su fecha: las lecturas posteriores no recalculan.

## Tipos de cambio y banderas (servicios externos)
- La interfaz consulta los tipos a open.er-api.com **a través del backend** (`GET /exchange-rates`) y no directamente desde el navegador, por diseño: la conversión que se guarda usa un tipo controlado por el servidor (nunca se confía en valores del cliente), un único snapshot compartido respeta el límite del proveedor, los tests no usan la red y no hace falta CORS. Para el usuario el resultado es el mismo: cambia la divisa y ve los costes convertidos al momento, con estados de carga y error.
- Detalles de la caché: una sola petición por snapshot, guardado en memoria 24 h, petición compartida entre llamadas simultáneas y 60 s de enfriamiento tras un fallo. El proveedor limita las peticiones (una actualización diaria; bloqueo temporal si se abusa).
- Las banderas se cargan desde el CDN `flagcdn.com` (no se guardan en el repositorio). Sin red o con el CDN caído la aplicación funciona y muestra solo el código del país. El CDN ve la IP del navegador.

## Flujo de trabajo (SDD)
Las funcionalidades se desarrollan con specs: especificación, plan, tareas, implementación y revisión.
- Principios del proyecto: [docs/constitution.md](docs/constitution.md).
- Decisiones vigentes y estado de cada spec: [MEMORY.md](MEMORY.md).
- Specs: [specs/](specs/).
- Arquitectura, base de datos y directrices dadas a la IA: [ai-workspace/architecture.md](ai-workspace/architecture.md).
