/**
 * @fileoverview /router/index.js
 * Configuración de Vue Router con protección RBAC (Control de acceso basado en roles) y control de expiración JWT.
 */
import { createRouter, createWebHashHistory } from "vue-router";
import { Notify } from "quasar";
import { useAuthStore } from "@/store/Auth";

// Layout principal
import AdminLayout from "@/layouts/AdminLayout.vue";

// Vistas
import LoginView from "@/views/LoginView.vue";
import DashboardView from "@/views/DashboardView.vue";
import ProductosView from "@/views/ProductosView.vue";
import ProveedoresView from "@/views/ProveedoresView.vue";
import CategoriasView from "@/views/CategoriasView.vue";
import ImportsView from "@/views/ImportsView.vue";
import RegistroView from "@/views/RegistroView.vue";
import AboutView from "@/views/AboutView.vue";
import NotFoundView from "@/views/NotFoundView.vue";

const routes = [
  {
    path: "/",
    name: "login",
    component: LoginView,
    meta: { titulo: "Iniciar Sesión", soloInvitados: true },
  },
  {
    path: "/",
    component: AdminLayout,
    children: [
      {
        path: "dashboard",
        name: "dashboard",
        component: DashboardView,
        meta: { titulo: "Dashboard", requiereAuth: true },
      },
      {
        path: "productos",
        name: "productos",
        component: ProductosView,
        meta: { titulo: "Productos", requiereAuth: true },
      },
      {
        path: "proveedores",
        name: "proveedores",
        component: ProveedoresView,
        meta: { titulo: "Proveedores", requiereAuth: true },
      },
      {
        path: "categorias",
        name: "categorias",
        component: CategoriasView,
        meta: { titulo: "Categorías", requiereAuth: true },
      },
      {
        path: "imports",
        name: "imports",
        component: ImportsView,
        meta: { titulo: "Carga Masiva", requiereAuth: true, requiereAdmin: true },
      },
      {
        path: "registro",
        name: "registro",
        component: RegistroView,
        meta: { titulo: "Registrar Usuario", requiereAuth: true, requiereAdmin: true },
      },
      {
        path: "acerca",
        name: "acerca",
        component: AboutView,
        meta: { titulo: "Estructura del Proyecto", requiereAuth: false },
      },
      {
        path: ":pathMatch(.*)*",
        name: "no-encontrado",
        component: NotFoundView,
        meta: { titulo: "Página no encontrada" },
      },
    ],
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
});

/**
 * Guardián global de navegación con validación de autenticación, expiración y control de roles (RBAC).
 */
export function protegerRutas(to) {
  const auth = useAuthStore();

  // 1. Ruta que requiere autenticación
  if (to.meta.requiereAuth === true) {
    if (!auth.estaAutenticado) {
      if (auth.token && auth.tokenExpirado) {
        auth.cerrarSesion();
        Notify.create({
          type: "warning",
          message: "Tu sesión ha expirado por inactividad. Por favor inicia sesión nuevamente.",
          icon: "timer_off",
          position: "top-right",
        });
      } else {
        Notify.create({
          type: "negative",
          message: "Debes iniciar sesión para acceder a esta sección.",
          icon: "lock",
          position: "top-right",
        });
      }
      return { name: "login" };
    }

    // 2. Control de Acceso por Roles: Requiere rol Administrador
    if (to.meta.requiereAdmin === true && !auth.esAdmin) {
      Notify.create({
        type: "warning",
        message: "Acceso restringido: Se requieren privilegios de Administrador para acceder a este módulo.",
        icon: "admin_panel_settings",
        position: "top-right",
      });
      return { name: "dashboard" };
    }
  }

  // 3. Pantalla de login para usuarios que ya están autenticados
  if (to.meta.soloInvitados === true && auth.estaAutenticado) {
    return { name: "dashboard" };
  }

  return true;
}

router.beforeEach(protegerRutas);

router.afterEach((to) => {
  const base = import.meta.env.VITE_APP_TITULO || "CatálogoBulk";
  document.title = to.meta.titulo ? `${to.meta.titulo} | ${base}` : base;
});
