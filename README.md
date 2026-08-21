# 📦 CatálogoBulk — Frontend (Vue 3 + Quasar + Pinia + Vite)

Frontend moderno, modular y reactivo para **CatálogoBulk** (Sistema de Ingesta y Gestión de Catálogos Masivos). Construido siguiendo estrictamente el principio de responsabilidad única de `estructura_frontend`.

---

## 🚀 1. Puesta en marcha

### Paso 1: Iniciar el Backend
En una terminal:
```bash
cd "C:\Users\juanp\OneDrive\Desktop\catalagobulk-Maria"
npm install
npm run dev              # Corre en http://localhost:3000
```

> **Nota**: El backend expone la API en `http://localhost:3000/api`, Documentación Swagger en `http://localhost:3000/api/docs` y Health check en `http://localhost:3000/health`.

### Paso 2: Iniciar el Frontend
En otra terminal:
```bash
cd "C:\Users\juanp\OneDrive\Desktop\frontendcatalogobulk"
npm install
npm run dev              # Queda escuchando en http://localhost:5173
```

---

## 🔑 2. Cuentas y Autenticación

Puedes registrar cualquier cuenta nueva directamente desde la pantalla de login en la pestaña **"Crear Cuenta"** seleccionando el rol deseado:
- **Administrador (`admin`)**: Acceso completo a creación/edición/eliminación de productos, proveedores, categorías y carga masiva de catálogos.
- **Usuario Estándar (`user`)**: Acceso en modo consulta y visualización de productos, estadísticas e informes.

---

## 🌐 3. Configuración del Entorno (`.env`)

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_APP_TITULO=CatálogoBulk
```

---

## 📂 4. Estructura del Código

```text
src/
├── assets/         recursos estáticos (logo.svg, favicon)
├── components/     componentes reutilizables agnósticos
│   ├── Cards/        TarjetaMetrica.vue
│   ├── Encabezados/  EncabezadoPagina.vue
│   └── Tables/       TablaDatos.vue
├── composables/    lógica reactiva Composition API (useNotificar, useConfirmar, useSocket)
├── layouts/        plantilla principal con barra y drawer (AdminLayout.vue)
├── plugins/        instancias de axios y Quasar (axios.js, quasar.js)
├── router/         rutas con navegación protegida y guards de rol (index.js)
├── services/       funciones HTTP desacopladas (api.service.js: get, post, put, del, upload)
├── store/          estado global Pinia con persistencia (Auth.js, General.js)
├── styles/         SCSS global, variables y tokens (variables.scss, main.scss)
├── utils/          funciones puras (reglas.js, formatDate.js, validateEmail.js)
├── views/          una pantalla por ruta
│   ├── LoginView.vue       Inicio de sesión y creación de cuentas
│   ├── DashboardView.vue   Métricas y estado del catálogo
│   ├── ProductosView.vue   CRUD productos, filtros y paginación
│   ├── ProveedoresView.vue CRUD proveedores y slugs
│   ├── CategoriasView.vue  Metadatos de categorías
│   ├── ImportsView.vue     Carga masiva CSV/JSON + WebSockets en tiempo real
│   ├── RegistroView.vue    Creación interna de usuarios
│   ├── AboutView.vue       Documentación interactiva de la arquitectura
│   └── NotFoundView.vue    404
├── App.vue
└── main.js
```

---

## ⚡ 5. Características Destacadas

1. **Monitoreo en Tiempo Real**: Conexión WebSockets con `socket.io-client` para visualizar barras de progreso de ingesta masiva (BullMQ).
2. **Normalización de Errores**: Interceptor central de Axios que parsea códigos HTTP `400`, `401`, `403`, `404` y `409` tipados desde el backend.
3. **Persistencia Automática**: Sesión JWT guardada y recuperada con `pinia-plugin-persistedstate`.
4. **Validación Visual Inmediata**: Reglas `:rules` de Quasar (`requerido`, `esEmail`, `minimo`, `slugValido`, `numeroPositivo`, etc.).
