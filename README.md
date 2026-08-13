# 📦 CatálogoBulk — Sistema de Importación Masiva de Productos

Bienvenido/a a **CatálogoBulk**. Este sistema automatiza la ingesta y procesamiento asíncrono de catálogos masivos de productos desde archivos CSV y JSON, ofreciendo consultas rápidas, trazabilidad y reportes detallados.

---

## 📋 Estado del Proyecto (Fases 0 y 1)

El proyecto cuenta con las dos primeras fases completamente implementadas y verificadas:

- **Fase 0 — Setup + Docker Compose**: Entorno reproducible con Docker Compose, variables de entorno validadas con fallos tempranos (`config/env.js`) y un endpoint robusto de salud (`GET /health`).
- **Fase 1 — Auth + CRUDs**: Modelos de datos (`Usuario`, `Producto`, `Proveedor`, `Categoria`, `ImportJob`), autenticación con JWT y hash bcrypt, control de acceso basado en roles (`admin` / `user`), manejo de errores tipados (HTTP 400, 401, 403, 404, 409) y documentación interactiva en Swagger (`/api/docs`).

---

## 🛠️ Requisitos Previos

Asegúrate de tener instalado:
- **Node.js** v20 LTS o superior
- **Docker** y **Docker Compose** (recomendado para ejecución aislada)
- **Git**

---

## ⚙️ Configuración del Entorno (`.env`)

Crea un archivo `.env` en la raíz del proyecto (al mismo nivel que `package.json` y `docker-compose.yml`). Puedes usar los valores por defecto para desarrollo:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/catalogobulk
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=cambiar_en_produccion
JWT_EXPIRES_IN=1h
MAX_FILE_SIZE_MB=50
BATCH_SIZE=500
CACHE_TTL_SECONDS=300
IMPORT_ERRORS_CAP=1000
```

> ⚠️ **Nota**: Al ejecutar con Docker Compose, las variables `MONGO_URI` y `REDIS_HOST` se sobreescriben automáticamente a `mongo` y `redis` en el contenedor.

---

## 🚀 Cómo Arrancar el Proyecto

### Opción 1: Con Docker Compose (Recomendado)

Levanta la API, MongoDB y Redis con un solo comando:

```bash
docker compose up --build
```

- La API estará escuchando en: `http://localhost:3000`
- MongoDB en el puerto `27017`
- Redis en el puerto `6379`

Para detener los contenedores:
```bash
docker compose down
```

---

### Opción 2: Ejecución Local en Desarrollo

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Asegurar que MongoDB y Redis estén corriendo en tu máquina** (puertos `27017` y `6379`).

3. **Iniciar la aplicación**:
   ```bash
   npm start
   # o en modo desarrollo:
   npm run dev
   ```

---

## 🔍 Verificación de Salud (`/health`)

Puedes verificar en cualquier momento que la API y sus conexiones a MongoDB y Redis respondan correctamente:

```bash
curl http://localhost:3000/health
```

**Respuesta exitosa (HTTP 200 OK)**:
```json
{
  "status": "ok",
  "mongo": "up",
  "redis": "up"
}
```

---

## 📖 Documentación Interactiva de la API (Swagger)

Una vez iniciado el servidor, puedes explorar y probar todos los endpoints desde el navegador con la interfaz gráfica de Swagger UI:

👉 **`http://localhost:3000/api/docs`**

Desde ahí podrás registrar usuarios, obtener tokens de autenticación JWT y probar las rutas protegidas especificando el encabezado `Authorization: Bearer <token>`.

---

## 🧪 Cómo Ejecutar las Pruebas (Testing)

El proyecto incluye una suite completa de pruebas de integración con **Jest** y **Supertest**.

Para ejecutar los tests:
```bash
npm test
```

### ¿Qué validan los tests?
1. **Salud**: `GET /health` responde 200 OK.
2. **Autenticación**: Registro con rol `user` por defecto, ocultamiento del campo `password`, registro de `admin`, control de emails duplicados (409) y login con credenciales inválidas (401).
3. **Control de Acceso por Roles**: Bloqueo de rutas de modificación a usuarios normales (403 Forbidden).
4. **CRUD de Proveedores**: Creación con estado `activo: true`, control de slugs duplicados (409).
5. **CRUD de Productos**: Creación por admins, validación de SKU duplicado (409 tipado).
6. **Integridad Referencial**: Impedir la eliminación de proveedores con productos asociados (409 Conflict).
7. **Documentación**: Exposición de `/api/docs`.

---

## 📂 Estructura del Código

```text
├── docker-compose.yml     # Configuración de servicios Docker (api, mongo, redis)
├── Dockerfile             # Definición del contenedor Node.js 20
├── package.json           # Dependencias y scripts
├── README.md              # Guía de uso y documentación
├── src/
│   ├── app.js             # Configuración de Express, middlewares y rutas
│   ├── server.js          # Punto de entrada de la aplicación
│   ├── config/            # Conexiones (db, redis, env, swagger)
│   ├── errors/            # Clase tipada AppError
│   ├── middlewares/       # Auth (JWT), Rol (admin), Upload (Multer), ErrorHandler
│   ├── modules/           # Arquitectura por módulos
│   │   ├── auth/          # Registro y Login
│   │   ├── productos/     # CRUD, filtros y estadísticas
│   │   ├── proveedores/   # CRUD e integridad referencial
│   │   ├── categorias/    # Consulta y edición de metadata
│   │   └── imports/       # Estructura para carga masiva
│   ├── queues/            # Definición de colas con BullMQ
│   ├── scripts/           # Generación de datos de prueba
│   ├── sockets/           # Configuración de WebSockets con Socket.io
│   └── workers/           # Procesamiento asíncrono en segundo plano
└── tests/
    └── integration.test.js # Suite de pruebas de integración con Jest
```

---

## 📌 Rutas Principales de la API

| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Público | Comprueba la salud del servidor y bases de datos |
| `POST` | `/api/auth/register` | Público | Registro de usuario (`rol`: "user" o "admin") |
| `POST` | `/api/auth/login` | Público | Inicia sesión y retorna JWT |
| `GET` | `/api/productos` | Autenticado | Lista productos paginados y filtrables |
| `GET` | `/api/productos/stats` | Autenticado | Estadísticas del catálogo |
| `POST` | `/api/productos` | Admin | Crea un nuevo producto |
| `GET` | `/api/proveedores` | Autenticado | Lista proveedores paginados |
| `POST` | `/api/proveedores` | Admin | Registra un nuevo proveedor |
| `DELETE`| `/api/proveedores/:id` | Admin | Elimina proveedor si no tiene productos |
| `GET` | `/api/categorias` | Autenticado | Lista categorías y su metadata |
