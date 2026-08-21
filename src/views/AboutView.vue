<script setup>
/**
 * /views/AboutView.vue
 * Documentación interactiva de la arquitectura del proyecto, flujo de trabajo con el backend y matriz de seguridad.
 */
import { ref } from "vue";
import EncabezadoPagina from "@/components/Encabezados/EncabezadoPagina.vue";

const tabActiva = ref("flujo");

const arbol = `src/
├── assets/         recursos estáticos (logo.svg, favicon)
├── components/     componentes reutilizables agnósticos
│   ├── Cards/        TarjetaMetrica.vue
│   ├── Encabezados/  EncabezadoPagina.vue
│   └── Tables/       TablaDatos.vue
├── composables/    lógica reactiva Composition API (useNotificar, useConfirmar, useSocket)
├── layouts/        plantilla principal con barra y drawer (AdminLayout.vue)
├── plugins/        instancias de axios y Quasar (axios.js, quasar.js)
├── router/         rutas con protección RBAC y control de sesión (index.js)
├── services/       funciones HTTP desacopladas (api.service.js: get, post, put, del, upload)
├── store/          estado global Pinia con persistencia (Auth.js, General.js)
├── styles/         SCSS global, variables y tokens (variables.scss, main.scss)
├── utils/          funciones puras (security.js, reglas.js, formatDate.js, validateEmail.js)
├── views/          una pantalla por ruta (Login, Dashboard, Productos, Proveedores, Categorías, Imports, Registro, About, 404)
├── App.vue         componente raíz
└── main.js         punto de montaje y registro de plugins`;

const fasesBackend = [
  {
    fase: "Fase 0: Setup & Salud",
    icono: "dns",
    color: "teal",
    descripcion: "Docker Compose orquestando API Express en puerto 3000, MongoDB (27017) y Redis (6379).",
    detalles: [
      "GET /health verifica en tiempo real la conectividad de Mongo y Redis con respuesta 200/503.",
      "Variables de entorno validadas con fallos tempranos en config/env.js.",
      "Documentación interactiva disponible en Swagger UI (/api/docs).",
    ],
  },
  {
    fase: "Fase 1: Autenticación & RBAC",
    icono: "admin_panel_settings",
    color: "green-9",
    descripcion: "Seguridad basada en JWT con hash Bcrypt y control de acceso por roles ('admin' / 'user').",
    detalles: [
      "POST /api/auth/register guarda usuarios con password hasheada y rol asignado.",
      "POST /api/auth/login valida credenciales con rate limiting (loginLimiter) y emite token JWT con duración de 1 hora.",
      "Middleware de autorización exige 'Authorization: Bearer <token>' en endpoints privados.",
      "Middleware rol('admin') bloquea mutaciones (403 Forbidden) para usuarios normales.",
    ],
  },
  {
    fase: "Fase 2: Catálogo & Integridad",
    icono: "inventory_2",
    color: "blue-8",
    descripcion: "Gestión de Proveedores, Categorías y Productos con agregaciones MongoDB.",
    detalles: [
      "Proveedores: Slugs únicos, validación de formatos y protección contra borrado si tiene productos (409 Conflict).",
      "Productos: SKU único indexado, cálculo automático de disponibilidad (stock > 0), paginación y filtros.",
      "Estadísticas: Pipeline de agregación en GET /api/productos/stats para métricas globales en el Dashboard.",
    ],
  },
  {
    fase: "Fase 3: Ingesta Masiva Asíncrona",
    icono: "cloud_upload",
    color: "purple-8",
    descripcion: "Carga de archivos masivos CSV / JSON con colas BullMQ, Redis y WebSockets en tiempo real.",
    detalles: [
      "POST /api/imports recibe el archivo con Multer y encola un trabajo en BullMQ (HTTP 202 Accepted).",
      "Workers procesan por lotes (batches de 500) ejecutando validaciones de esquema e integridad.",
      "Socket.io emite progreso en vivo (import:id:progress) y finalización (import:id:completed).",
      "Trazabilidad completa con libro de errores detallando fila, SKU y motivo del fallo.",
    ],
  },
];

const medidasSeguridad = [
  {
    capa: "Protección de Rutas (Frontend RBAC)",
    icono: "shield",
    accion: "Guardián router.beforeEach que valida token no expirado y roles ('requiereAdmin').",
  },
  {
    capa: "Interceptor Seguro de Axios",
    icono: "lock",
    accion: "Valida URLs de confianza antes de adjuntar el Bearer Token para evitar filtraciones hacia terceros.",
  },
  {
    capa: "Control de Expiración JWT",
    icono: "timer",
    accion: "Decodifica el claim 'exp' y cierra sesión proactivamente ante tokens vencidos o manipulados.",
  },
  {
    capa: "Sanitización contra XSS",
    icono: "code_off",
    accion: "Módulo security.js que limpia caracteres peligrosos antes de renderizar datos dinámicos.",
  },
  {
    capa: "Manejo de Rate Limiting",
    icono: "speed",
    accion: "Captura respuestas HTTP 429 Too Many Requests para informar al usuario de los límites de consumo.",
  },
];
</script>

<template>
  <q-page>
    <div class="contenedor-app">
      <EncabezadoPagina
        titulo="Arquitectura & Flujo de Trabajo"
        subtitulo="Documentación técnica de la integración con CatálogoBulk API y capas de seguridad"
        icono="account_tree"
      />

      <q-tabs
        v-model="tabActiva"
        dense
        class="text-grey-7 q-mb-md"
        active-color="primary"
        indicator-color="primary"
        align="left"
      >
        <q-tab name="flujo" icon="sync_alt" label="Flujo con el Backend" no-caps />
        <q-tab name="seguridad" icon="security" label="Seguridad Frontend & RBAC" no-caps />
        <q-tab name="estructura" icon="folder" label="Estructura de Carpetas" no-caps />
      </q-tabs>

      <q-tab-panels v-model="tabActiva" animated>
        <!-- Panel 1: Flujo Backend -->
        <q-tab-panel name="flujo" class="q-pa-none">
          <div class="row q-col-gutter-lg">
            <div
              v-for="(fase, idx) in fasesBackend"
              :key="idx"
              class="col-12 col-md-6"
            >
              <div class="section-box full-height">
                <div class="section-box__title justify-between">
                  <div class="row items-center">
                    <q-icon :name="fase.icono" :color="fase.color" size="20px" class="q-mr-sm" />
                    <span>{{ fase.fase }}</span>
                  </div>
                </div>

                <div class="q-pa-md">
                  <p class="text-body2 text-weight-medium text-dark q-mb-sm">
                    {{ fase.descripcion }}
                  </p>

                  <q-list dense>
                    <q-item
                      v-for="(item, i) in fase.detalles"
                      :key="i"
                      class="q-px-none q-py-xs"
                    >
                      <q-item-section avatar style="min-width: 24px">
                        <q-icon name="check_circle" color="positive" size="16px" />
                      </q-item-section>
                      <q-item-section class="text-caption text-grey-8">
                        {{ item }}
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>
              </div>
            </div>
          </div>
        </q-tab-panel>

        <!-- Panel 2: Seguridad -->
        <q-tab-panel name="seguridad" class="q-pa-none">
          <div class="row q-col-gutter-lg">
            <div class="col-12 col-md-7">
              <q-card flat class="tarjeta">
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold q-mb-sm row items-center">
                    <q-icon name="verified_user" color="primary" class="q-mr-xs" />
                    Mecanismos de Seguridad en el Frontend
                  </div>
                  <p class="texto-suave text-body2">
                    Estrategias activas para proteger las sesiones, prevenir ataques XSS y controlar el acceso por roles.
                  </p>

                  <q-list separator class="q-mt-md">
                    <q-item v-for="(sec, idx) in medidasSeguridad" :key="idx" class="q-py-md">
                      <q-item-section avatar>
                        <q-avatar color="green-1" text-color="green-9" icon="shield" />
                      </q-item-section>
                      <q-item-section>
                        <div class="text-body2 text-weight-bold text-dark">{{ sec.capa }}</div>
                        <div class="text-caption text-grey-7">{{ sec.accion }}</div>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-5">
              <div class="section-box full-height">
                <div class="section-box__title">
                  <q-icon name="badge" size="18px" class="q-mr-sm" />
                  Matriz de Permisos por Rol
                </div>

                <div class="q-pa-md">
                  <q-markup-table flat dense bordered separator="cell">
                    <thead class="bg-grey-2">
                      <tr>
                        <th class="text-left">Módulo / Acción</th>
                        <th class="text-center">Admin</th>
                        <th class="text-center">User</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Ver Dashboard & Stats</td>
                        <td class="text-center text-positive text-weight-bold">✓</td>
                        <td class="text-center text-positive text-weight-bold">✓</td>
                      </tr>
                      <tr>
                        <td>Listar y Filtrar Productos</td>
                        <td class="text-center text-positive text-weight-bold">✓</td>
                        <td class="text-center text-positive text-weight-bold">✓</td>
                      </tr>
                      <tr>
                        <td>Crear / Editar / Eliminar Productos</td>
                        <td class="text-center text-positive text-weight-bold">✓</td>
                        <td class="text-center text-negative text-weight-bold">✗</td>
                      </tr>
                      <tr>
                        <td>Gestión de Proveedores</td>
                        <td class="text-center text-positive text-weight-bold">✓</td>
                        <td class="text-center text-grey-6">Lectura</td>
                      </tr>
                      <tr>
                        <td>Carga Masiva (CSV / JSON)</td>
                        <td class="text-center text-positive text-weight-bold">✓</td>
                        <td class="text-center text-negative text-weight-bold">✗</td>
                      </tr>
                      <tr>
                        <td>Registrar Nuevos Usuarios</td>
                        <td class="text-center text-positive text-weight-bold">✓</td>
                        <td class="text-center text-negative text-weight-bold">✗</td>
                      </tr>
                    </tbody>
                  </q-markup-table>
                </div>
              </div>
            </div>
          </div>
        </q-tab-panel>

        <!-- Panel 3: Estructura -->
        <q-tab-panel name="estructura" class="q-pa-none">
          <q-card flat class="tarjeta">
            <q-card-section>
              <div class="text-subtitle1 text-weight-bold q-mb-sm row items-center">
                <q-icon name="account_tree" color="primary" class="q-mr-xs" />
                Estructura Limpia por Carpetas
              </div>
              <pre class="bloque-codigo">{{ arbol }}</pre>
            </q-card-section>
          </q-card>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </q-page>
</template>
