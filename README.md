# CatálogoBulk — Backend

Documentación del estado actual del backend, pensada para trabajar el frontend por separado. Refleja el código real (revisado a la fecha), no una descripción genérica.

Stack: Node.js 20 + Express 5 + MongoDB/Mongoose + Redis + BullMQ + Socket.io + Multer.

---

## 1. Cómo levantar el proyecto

```bash
docker compose up -d
```

Levanta 4 servicios: `mongo`, `redis`, `api` y `worker` (este último es un proceso aparte que consume la cola de importación).

- **Puerto de la API:** `3000` (mapeado a `localhost:3000`).
- **Health check:** `GET /health` devuelve:

```json
{ "status": "ok", "mongo": "up", "redis": "up" }
```

`status` es `"ok"` solo si `mongo` y `redis` están `"up"`; si alguno cae, responde `503` con `"error"` y el servicio en `"down"`.

- **Raíz:** `GET /` devuelve `{ "message": "API catalogobulk funcionando" }`.

### Variables de entorno (requeridas, el server hace `exit(1)` si falta alguna)

`PORT`, `MONGO_URI`, `REDIS_HOST`, `REDIS_PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `MAX_FILE_SIZE_MB`, `BATCH_SIZE`, `CACHE_TTL_SECONDS`, `IMPORT_ERRORS_CAP`.

(Archivos de referencia: `src/config/env.js`, `.env`, `.env.example`.)

---

## 2. Base URL y autenticación

- **Base URL:** `http://localhost:3000`
- **Mecanismo:** JWT en el header `Authorization: Bearer <token>`.

### Cómo obtener el token

- **Registro:** `POST /api/auth/register` con body `{ "email", "password", "rol" }` (`rol` es opcional, `"admin"` o `"user"`, default `"user"`). El password se guarda hasheado (bcrypt). Devuelve `201`:

```json
{ "id": "...", "email": "...", "rol": "admin" }
```

- **Login:** `POST /api/auth/login` con body `{ "email", "password" }`. Devuelve `200`:

```json
{ "token": "<jwt>" }
```

El token lleva el payload `{ sub: <usuarioId>, rol }` y expira según `JWT_EXPIRES_IN` (`1h` por defecto en `.env`).

> **Regla de auth actual:** `imports` y `usuarios` exigen autenticación en **todos** sus endpoints (`auth` + `rol('admin')`, salvo `GET /api/imports/:id` que admite dueño o admin). En `productos`/`proveedores`/`categorias` los `GET` son **públicos** (catálogo sin login, con filtro `activo:true` por default) y las escrituras (`POST`/`PUT`/`DELETE`) exigen `auth` + `rol('admin')`.

---

## 3. Endpoints disponibles

Agrupados por módulo. El prefijo de cada grupo está definido en `src/app.js` (`app.use('/api/...', router)`).

### Auth — prefijo `/api/auth`

| Método | Path | Rol | Nota |
|---|---|---|---|
| POST | `/api/auth/register` | público | Crea usuario (hashea password). 201 |
| POST | `/api/auth/login` | público | Devuelve `{ token }`. 200 |

### Productos — prefijo `/api/productos`

| Método | Path | Rol | Nota |
|---|---|---|---|
| GET | `/api/productos` | público | Query: `page`, `limit` (max 100), `categoria`, `disponible`, `proveedor` (id o slug), `activo` (default `true`) |
| GET | `/api/productos/stats` | público | `{ totalProductos, precioPromedio, porCategoria[] }` |
| GET | `/api/productos/:id` | público | |
| POST | `/api/productos` | auth + admin | Crea producto; `disponible` se calcula solo |
| PUT | `/api/productos/:id` | auth + admin | |
| DELETE | `/api/productos/:id` | auth + admin | Borrado lógico (`activo:false`). 200 |

### Proveedores — prefijo `/api/proveedores`

| Método | Path | Rol | Nota |
|---|---|---|---|
| GET | `/api/proveedores` | público | Query: `page`, `limit`, `activo` (default `true`) |
| GET | `/api/proveedores/:id` | público | |
| POST | `/api/proveedores` | auth + admin | 409 si `nombre`/`slug` ya existe |
| PUT | `/api/proveedores/:id` | auth + admin | |
| DELETE | `/api/proveedores/:id` | auth + admin | Borrado lógico (`activo:false`). 200 |

### Categorías — prefijo `/api/categorias`

| Método | Path | Rol | Nota |
|---|---|---|---|
| GET | `/api/categorias` | público | `{ message, data: [...] }` (default `activo:true`) |
| GET | `/api/categorias/:slug` | público | Por slug, no por id |
| PUT | `/api/categorias/:id` | auth + admin | Solo `nombre`, `descripcion`, `imagenUrl`; el `slug` NO se edita |
| DELETE | `/api/categorias/:id` | auth + admin | Borrado lógico (`activo:false`). 200 |

> No hay ruta `POST` para categorías: se crean automáticamente durante la importación.

### Usuarios — prefijo `/api/usuarios`

| Método | Path | Rol | Nota |
|---|---|---|---|
| GET | `/api/usuarios` | auth + admin | `{ message, data: [...] }` |
| GET | `/api/usuarios/:id` | auth + admin | |
| POST | `/api/usuarios` | auth + admin | Hashea el password (bcrypt) |
| PUT | `/api/usuarios/:id` | auth + admin | |
| PUT | `/api/usuarios/:id/status` | auth + admin | Body `{ "activo": true\|false }` |
| DELETE | `/api/usuarios/:id` | auth + admin | Borrado **real** (`findByIdAndDelete`). 204 |

### Imports — prefijo `/api/imports`

| Método | Path | Rol | Nota |
|---|---|---|---|
| GET | `/api/imports` | **auth + admin** | Lista jobs. `{ data, page, limit, total }` |
| GET | `/api/imports/:id` | **auth** (dueño o admin) | Progreso del import |
| POST | `/api/imports` | **auth + admin** | Sube archivo (multipart). 202 |

---

## 4. Módulo de imports (detalle)

### Subir un archivo — `POST /api/imports`

- **Content-Type:** `multipart/form-data` (lo genera el cliente automáticamente con su boundary; **no** setearlo a mano).
- **Campos exactos:**
  - `archivo` → tipo **File** (`.csv` o `.json`, extensión validada en el server).
  - `proveedorId` → tipo **texto** (ObjectId del proveedor, debe existir y estar activo).
- **Validaciones de negocio (en orden):**
  - `400` si falta `archivo` → `{ "message": "Falta el archivo" }`
  - `400` si falta `proveedorId` → `{ "message": "Falta proveedorId" }`
  - `400` si la extensión no es `.csv`/`.json` → `{ "message": "Extensión de archivo inválida (solo .csv o .json)", "code": "FORMATO_INVALIDO" }`
  - `404` si el proveedor no existe → `{ "message": "proveedorId no existe", "code": "PROVEEDOR_NO_ENCONTRADO" }`
  - `409` si el proveedor está inactivo (`activo: false`) → `{ "message": "El proveedor está inactivo, no puede recibir importaciones", "code": "PROVEEDOR_INACTIVO" }`
- **Respuesta exitosa:** `202` (el procesamiento es asíncrono):

```json
{ "importJobId": "6a9b...", "estado": "pending" }
```

### Consultar progreso — `GET /api/imports/:id`

- Requiere `auth`. Solo el dueño del import o un `admin` pueden verlo; de lo contrario `403`.
- Respuesta `200` con estos campos:

| Campo | Descripción |
|---|---|
| `importJobId` | id del job |
| `proveedorId` | id del proveedor |
| `estado` | `pending` / `processing` / `completed` / `failed` |
| `total` | filas totales detectadas (o `null` antes de procesar) |
| `procesados` | filas procesadas |
| `exitosos` | filas insertadas |
| `fallidos` | filas rechazadas |
| `porcentaje` | `round(procesados/total * 100)`, o `0` si no hay `total` |
| `errores` | array de `{ fila, sku, motivo }` (cap por `IMPORT_ERRORS_CAP`) |
| `advertencias` | array de `{ fila, sku, motivo }` (cap por `IMPORT_ERRORS_CAP`) |
| `startedAt` | fecha de inicio del procesamiento |
| `finishedAt` | fecha de finalización |

El worker (`src/workers/import.worker.js`) procesa el job en segundo plano y va actualizando estos campos en el `ImportJob`.

---

## 5. Formato de errores

Hay **dos formas** de respuesta de error en el código hoy (inconsistencia, ver Pendiente):

**a) Errores lanzados como `AppError`** (pasan por `src/middlewares/errorHandler.js`):

```json
{ "message": "...", "code": "CODIGO_ENUM" }
```

`errorHandler.js` distingue:
- Si es `AppError` → devuelve `statusCode` con `{ message, code }`.
- Cualquier otro error → `500` con:

```json
{ "message": "Error interno del servidor", "code": "INTERNAL_SERVER_ERROR" }
```

**b) Errores devueltos directo por los controllers** (`res.status(...).json({ message })`):

```json
{ "message": "Producto no encontrado" }
```

Estos **no** llevan campo `code`. Ejemplos: `401` de auth (`{ message: "Token no proporcionado" }`), `404` de recursos, `409` de duplicados, etc.

**Regla práctica para el frontend:** el campo `message` está siempre presente; el campo `code` **solo** existe en errores tipo `AppError` (o `INTERNAL_SERVER_ERROR`). No asumir `code`.

---

## 6. Campos derivados / calculados por el backend

NO enviarlos desde el frontend al crear/editar; el backend los calcula o ignora:

| Recurso | Campo | Regla |
|---|---|---|
| Producto | `disponible` | Se calcula como `stock > 0` (en el modelo `pre('save')` y en el controller `create`/`update`). Lo que mande el cliente se **sobrescribe**. |
| Producto | `createdAt` / `updatedAt` | Autogenerados (timestamps). |
| Producto | `proveedorId` | Debe ser un id existente; no es derivado, pero se valida contra `Proveedor`. |
| Categoría | `slug` | No editable (el `PUT` solo acepta `nombre`, `descripcion`, `imagenUrl`). |
| ImportJob | `estado`, `total`, `procesados`, `exitosos`, `fallidos`, `errores`, `advertencias`, `bullJobId`, `motivoFallo`, `startedAt`, `finishedAt` | Todo lo maneja el backend/worker; el cliente solo dispara el `POST /api/imports`. |
| Producto / Categoría / Proveedor | `activo` | Lo gestiona el backend: default `true`; el `DELETE` lo pone en `false` (borrado lógico). Para reactivar, `PUT` con `{ "activo": true }`. |

---

## 7. Pendiente

Lo que todavía **no** está implementado o está incompleto en el backend:

1. **Sockets (progreso en tiempo real).** `src/sockets/index.js` solo loguea conexiones; hay dos `TODO` explícitos: suscribir socket a una room por `importJobId` y relay de `QueueEvents` → Socket.io. El progreso hoy solo se consulta por polling a `GET /api/imports/:id`.
2. **Tests.** `jest` y `supertest` están en `devDependencies`, pero **no hay ningún archivo de test** ni script `test` en `package.json`.
3. **Swagger.** `swagger-ui-express` está instalado pero **no** configurado en `app.js` (sin spec ni ruta `/docs`).
4. **Capa service/repository incompleta.** Los controllers de `productos`, `proveedores`, `categorias` y `usuarios` hablan con el modelo de Mongoose directamente. Los `*.service.js` son stubs (`return []` / `return data`) y `usuario.service.js` / `usuario.repository.js` están **vacíos**. El módulo `imports` es el único con service + repository reales.

> Nota: `express-rate-limit` limita a `100` requests / 15 min por IP (ver `src/middlewares/rateLimit.js`); el frontend debe manejar el `429`.
