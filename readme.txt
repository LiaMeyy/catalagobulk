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
  scripts/         generar-catalogo.js   (≥120.000 filas, TODO)
  queues/          import.queue.js       (Queue de BullMQ)
  workers/         import.worker.js      (Worker, proceso aparte — TODOs)
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

## 4. Pendiente (a continuación)

1. **Conectar el worker** — `workers/import.worker.js` debe llamar `ImportService.procesarImport(importJobId)` (hoy tiene TODOs).
2. **Montar middlewares en rutas** — `import.routes.js` no aplica `upload.single('archivo')`, `auth` ni `rol`; el controller usa `req.file`/`req.user`.
3. **Activar la ruta** — `app.js:35` tiene comentado `app.use('/api/imports', importRoutes)`.
4. **Persistir advertencias** — `importJob.model.js` no tiene campo `advertencias` (hoy se cuentan en memoria y se devuelven en el resumen).
5. **Sockets** — relay `QueueEvents` → Socket.io en `sockets/index.js` (TODO).
6. **Script de datos** — implementar `scripts/generar-catalogo.js` (≥120.000 filas sucias).
7. **Tests** — jest + supertest.
8. **Docker** — docker-compose.yml (Mongo, Redis, API, worker).
9. **Docs** — swagger-ui-express (ya instalado, sin configurar).

Nota: el conteo CSV asume una fila = una fila lógica (usa csv-parser, así que tolera saltos de línea embebidos en campos entre comillas).
