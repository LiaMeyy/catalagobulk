# CatálogoBulk — Estado del proyecto

Sistema de importación masiva de catálogos de productos (Node.js 20 + Express + MongoDB/Mongoose + Redis + BullMQ + Socket.io).

---

## 1. Scaffolding (hecho)

Estructura de carpetas completa según spec, coincidiendo 1:1:

```
src/
  config/          db.js, redis.js, env.js (valida 10 vars, exit(1) si falta alguna)
  middlewares/     auth.js, rol.js, errorHandler.js, upload.js, rateLimit.js
  modules/
    auth/          controller, service, routes
    usuarios/      model, controller, service, repository, routes
    productos/     model, controller, service, repository, routes
    proveedores/   model, controller, service, repository, routes
    categorias/    model, controller, service, repository, routes
    imports/       importJob.model, controller, service, repository, routes
  scripts/         generar-catalogo.js   (≥120.000 filas sucias, implementado)
  queues/          import.queue.js       (Queue de BullMQ)
  workers/         import.worker.js      (Worker, proceso aparte — implementado)
  sockets/         index.js              (Socket.io + TODO relay QueueEvents→socket)
  errors/          AppError.js
  app.js           (construye Express, sin listen)
  server.js        (HTTP + Socket.io + conexiones Mongo/Redis)
```

Archivo base: `.env`, `.env.example`, `.gitignore` (Node).

## 2. Dependencias (hecho)

`src/package.json` ya lista el stack completo:
- prod: express, mongoose, ioredis, bullmq, socket.io, multer, jsonwebtoken, bcrypt, swagger-ui-express, csv-parser, stream-json, stream-chain, dotenv, cors, morgan, express-rate-limit.
- dev: jest, supertest.
- `main` corregido a `server.js`.

## 3. Módulo imports — lógica de importación (hecho)

Implementado dentro de `import.service.js`, `import.repository.js` e `import.controller.js` (sin crear archivos nuevos), respetando capas (controller → service → repository; repository es el único que toca Mongoose).

- **Detección de formato**: `.csv` / `.json` por extensión; otra extensión → `AppError(400)`.
- **Streaming** (sin cargar todo en memoria):
  - CSV con `csv-parser`.
  - JSON con `stream-json` (`parser()` + `streamArray()` via `stream-chain`).
- **Validación por fila** (no aborta): `sku`, `nombre`, `categoria` no vacíos; `precio` ≥ 0; `stock` **entero** ≥ 0 (decimales → rechazado, "stock inválido"); `sku duplicado` (en archivo y en BD).
- **Caso especial**: `imagenUrl` inválida no rechaza la fila, se guarda `null` y se registra advertencia.
- **Normalización** (solo filas válidas): sku trim+mayúsculas, nombre colapsa espacios, precio a 2 decimales, stock `Math.trunc` (defensivo), categoria minúsculas, descripcion/imagenUrl `null`, `disponible = stock > 0`, `proveedorId` inyectado desde afuera.
- **Inserción por lotes**: `insertMany` con `ordered:false` por `BATCH_SIZE`.
- **Efectos secundarios**: `proveedorId` asociado; upsert de categorías nuevas (slugs únicos) al final.
- **Progreso del ImportJob**: actualizaciones incrementales (`$inc` + `$push` con `$slice` respetando `IMPORT_ERRORS_CAP`); `completed`/`failed` al final.
- **Conteo previo de `total`**: `contarFilasCSV` (csv-parser en modo descarte) y `contarFilasJSON` (por tokens), guardado al pasar a `processing` para el % en tiempo real.

## 4. Pipeline de importación (hecho)

El flujo completo de importación está conectado de punta a punta:

- **Worker conectado** — `workers/import.worker.js` escucha la cola `import-bulk` de BullMQ, conecta su propia instancia de Mongo (`connectDB()`), hace ping a Redis, y por cada job llama `ImportService.procesarImport(importJobId)`. Los errores por job se loguean sin tumbar el proceso (evento `worker.on('failed')`).
- **Middlewares en rutas** — `import.routes.js` aplica `auth`, `rol('admin')` y `upload.single('archivo')` según el contrato:
  - `POST /api/imports` → `auth` + `rol('admin')` + `upload.single('archivo')`
  - `GET /api/imports/:id` → `auth` (dueño o admin validado en controller)
  - `GET /api/imports` → `auth` + `rol('admin')`
- **Ruta activada** — `app.js` monta `app.use('/api/imports', importRoutes)`.
- **Script de datos** — `scripts/generar-catalogo.js` genera 121.000 filas "sucias" determinísticas (sku vacío, nombre vacío, precio negativo, stock decimal/negativo/no numérico, categoria vacía, sku duplicado, imagenUrl inválida, espacios extra, minúsculas/mayúsculas, precio con >2 decimales, descripcion vacía, etc.).
- **Docker** — `docker-compose.yml` define 4 servicios: mongo, redis, api y worker (proceso aparte con su propio `command`).

## 5. Resuelto recientemente

- **Persistir advertencias** — `importJob.model.js` ya expone `advertencias: [errorItemSchema]` (default `[]`); `import.repository.js` las persiste con `$push` + `$slice` respetando `IMPORT_ERRORS_CAP`, y `import.service.js` las acumula y flushea junto con el progreso.
- **Borrado lógico (soft delete)** — `productos`, `proveedores` y `categorias` ya no borran el documento: el `DELETE` hace `activo: false` (responde 200 + doc). `producto.model.js` y `categoria.model.js` ganaron el campo `activo` (default `true`); `proveedor` ya lo tenía. En proveedor se quitó el bloqueo de "no se puede eliminar si tiene productos".
- **Auth + rol en rutas** — `productos`, `proveedores` y `categorias` ahora aplican `auth + rol('admin')` en POST/PUT/DELETE, mismo patrón que `imports`. Se agregó `DELETE /api/categorias/:id`.
- **GET públicos (catálogo sin login)** — los `GET` de `productos` (`/`, `/stats`, `/:id`), `proveedores` (`/`, `/:id`) y `categorias` (`/`, `/:slug`) se quitaron de `auth` y vuelven a ser públicos, para que el frontend muestre el catálogo sin token. Las escrituras (`POST`/`PUT`/`DELETE`) siguen exigiendo `auth + rol('admin')`.
- **Módulo usuarios protegido y con borrado real** — `usuario.routes.js` aplica `auth + rol('admin')` en todos sus endpoints; se agregó `DELETE /api/usuarios/:id` (borrado **real** con `findByIdAndDelete`, coexistiendo con `changeStatus` para desactivar).
- **Limpieza de logs de debug** — se eliminaron los `console.log` de diagnóstico en `import.controller.js`.
- **Filtro `activo` por default** — los listados (`GET /productos`, `/categorias`, `/proveedores`) devuelven solo `activo:true` salvo que se pase `?activo=false`.
- **Seguridad de passwords** — `usuario.controller.js` hashea el password en `create` y `update` (bcrypt); `auth.service.js` (`login`) ahora valida contra el hash y firma el JWT con el rol real; ninguna respuesta devuelve el campo `password`.
- **Refactor de capas (imports)** — `import.repository.js` ya no importa el modelo `Proveedor` directo: `findProveedorById` delega en `proveedorRepository.findById`.

## 6. Pendiente

1. **Sockets** — relay `QueueEvents` → Socket.io en `sockets/index.js` (TODO: suscribir socket a room por importJobId + relay de progreso).
2. **Tests** — jest + supertest (dependencias instaladas, sin tests escritos ni script `test` en `package.json`).
3. **Docs** — swagger-ui-express (ya instalado, sin configurar en `app.js`).
4. **Capa service/repository** — `producto/categoria/proveedor.service.js` son stubs; `usuario.service.js` y `usuario.repository.js` están vacíos. Los controllers de esos módulos tocan Mongoose directo.

## 7. Notas

- El conteo CSV asume una fila = una fila lógica (usa csv-parser, así que tolera saltos de línea embebidos en campos entre comillas).
- `POST /api/imports` exige `multipart/form-data` (campo File `archivo` + campo texto `proveedorId`). Multer ignora en silencio cualquier request que no sea multipart (`if (!is(req, ['multipart'])) return next()`), por lo que un body `raw`/`binary`/`x-www-form-urlencoded` devuelve `400 "Falta el archivo"` aunque exista el campo `archivo`. En Postman/Thunder Client usar tipo *form-data* y confirmar que el campo archivo quede como *File* con un `filename` real.
