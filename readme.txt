Listo. Dejé la estructura exacta que pediste.
Eliminado (mis archivos extra): import.parser.js, import.parser.test.js, jest.config.js, y revertí package.json (quité el script test y la devDep jest).
Renombrado: scripts/generate-catalogo.js → scripts/generar-catalogo.js.
Árbol final (coincide 1:1 con tu spec):
src/
  config/
    db.js            # usa env.MONGO_URI
    redis.js         # cliente ioredis con REDIS_HOST/REDIS_PORT
    env.js           # valida 10 vars, process.exit(1) si falta alguna
  middlewares/
    auth.js, rol.js, errorHandler.js, upload.js, rateLimit.js
  modules/
    auth/            auth.controller.js, auth.service.js, auth.routes.js
    usuarios/        usuario.model.js, .controller, .service, .repository, .routes
    productos/       producto.* (model/controller/service/repository/routes)
    proveedores/     proveedor.*
    categorias/      categoria.*
    imports/         importJob.model.js, import.controller, .service, .repository, .routes
  scripts/
    generar-catalogo.js   # ≥120.000 filas (con TODO para filas "sucias")
  queues/
    import.queue.js       # Queue de BullMQ
  workers/
    import.worker.js      # Worker de BullMQ (proceso aparte)
  sockets/
    index.js              # Socket.io + TODO relay QueueEvents→socket
  errors/
    AppError.js
  app.js
  server.js               # HTTP + Socket.io + conexiones Mongo/Redis
Alineado a la nueva spec (estos archivos los reescribí):
- config/env.js — valida las 10 vars (PORT, MONGO_URI, REDIS_HOST, REDIS_PORT, JWT_SECRET, JWT_EXPIRES_IN, MAX_FILE_SIZE_MB, BATCH_SIZE, CACHE_TTL_SECONDS, IMPORT_ERRORS_CAP) y hace process.exit(1) si falta alguna.
- config/db.js → env.MONGO_URI; config/redis.js → REDIS_HOST/REDIS_PORT.
- queues/import.queue.js y workers/import.worker.js → BullMQ (Queue/Worker).
- server.js → levanta HTTP + initSocket + conexiones Mongo/Redis.
- sockets/index.js → socket.io con TODO para el relay QueueEvents→socket.
- middlewares/upload.js → fileSize desde env.MAX_FILE_SIZE_MB.
Verifiqué sintaxis de todos los archivos modificados (node --check) y que env.js carga bien las 10 vars desde .env.
Nota: package.json (en src/) aún no lista bullmq, socket.io, ioredis ni multer (los imports ya los usan). No lo toqué porque no está en tu árbol, pero avisame si querés que agregue esas dependencias.