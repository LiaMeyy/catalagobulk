<script setup>
/**
 * /layouts/AdminLayout.vue
 * Plantilla principal de CatálogoBulk con barra superior, menú lateral y pie con estado de conexión.
 */
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useGeneralStore } from "@/store/General";
import { useAuthStore } from "@/store/Auth";
import { useNotificar } from "@/composables/useNotificar";
import { formatDateTime } from "@/utils/formatDate";
import logo from "@/assets/logo.svg";

const general = useGeneralStore();
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const { notificarInfo } = useNotificar();

const salir = () => {
  auth.cerrarSesion();
  notificarInfo("Sesión finalizada correctamente");
  router.push({ name: "login" });
};

const opcionesMenu = computed(() => {
  const base = [
    { name: "dashboard", titulo: "Dashboard", icono: "dashboard" },
    { name: "productos", titulo: "Productos", icono: "inventory_2" },
    { name: "proveedores", titulo: "Proveedores", icono: "local_shipping" },
    { name: "categorias", titulo: "Categorías", icono: "category" },
    { name: "imports", titulo: "Carga Masiva", icono: "cloud_upload" },
    { name: "registro", titulo: "Registrar Usuario", icono: "person_add" },
    { name: "acerca", titulo: "Estructura del Proyecto", icono: "folder_open" },
  ];
  return base;
});

const tituloSeccion = computed(() => route.meta?.titulo || "CatálogoBulk");

onMounted(() => {
  general.verificarSalud();
});
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Barra Superior -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Abrir menú"
          @click="general.alternarMenu()"
        />

        <q-toolbar-title class="text-weight-bold text-subtitle1 row items-center">
          <span>{{ tituloSeccion }}</span>
        </q-toolbar-title>

        <!-- Indicador de Salud del Backend -->
        <q-btn
          flat
          dense
          no-caps
          size="sm"
          class="q-mr-md"
          @click="general.verificarSalud"
        >
          <q-badge
            :color="general.backendOnline ? 'positive' : 'negative'"
            class="q-px-sm q-py-xs"
          >
            <q-icon
              :name="general.backendOnline ? 'cloud_done' : 'cloud_off'"
              size="13px"
              class="q-mr-xs"
            />
            API: {{ general.backendOnline ? 'En línea' : 'Sin conexión' }}
          </q-badge>
          <q-tooltip>
            Mongo: {{ general.saludServidor.mongo }} | Redis: {{ general.saludServidor.redis }} (Clic para re-verificar)
          </q-tooltip>
        </q-btn>

        <!-- Sesión de Usuario -->
        <template v-if="auth.estaAutenticado">
          <div class="row items-center q-mr-sm gt-xs">
            <q-badge
              :color="auth.esAdmin ? 'deep-orange-9' : 'teal-8'"
              :label="auth.rolUsuario.toUpperCase()"
              class="q-mr-sm text-weight-bold text-caption"
            />
            <span class="text-caption text-weight-medium">
              {{ auth.nombreUsuario }}
            </span>
          </div>

          <q-btn
            flat
            dense
            round
            icon="logout"
            aria-label="Cerrar sesión"
            @click="salir"
          >
            <q-tooltip>Cerrar sesión</q-tooltip>
          </q-btn>
        </template>

        <q-btn
          v-else
          flat
          dense
          no-caps
          icon="login"
          label="Iniciar Sesión"
          :to="{ name: 'login' }"
        />
      </q-toolbar>
    </q-header>

    <!-- Menú Lateral Drawer -->
    <q-drawer
      v-model="general.menuAbierto"
      show-if-above
      bordered
      :width="260"
      class="bg-white"
    >
      <!-- Cabecera del Drawer -->
      <div class="q-pa-md row items-center no-wrap bg-green-1">
        <img :src="logo" alt="Logo" width="38" height="38" class="q-mr-sm" />
        <div>
          <div class="text-weight-bold text-green-9 text-subtitle1" style="line-height: 1.1">
            {{ general.titulo }}
          </div>
          <div class="text-caption text-grey-7" style="font-size: 11px">
            Ingesta & Catálogos Masivos
          </div>
        </div>
      </div>

      <q-separator />

      <!-- Navegación -->
      <q-list padding class="q-pt-sm">
        <q-item-label header class="text-uppercase text-caption text-weight-bold text-grey-6">
          Módulos del Sistema
        </q-item-label>

        <q-item
          v-for="opcion in opcionesMenu"
          :key="opcion.name"
          v-ripple
          clickable
          class="enlace-menu"
          :to="{ name: opcion.name }"
        >
          <q-item-section avatar style="min-width: 40px">
            <q-icon :name="opcion.icono" size="22px" />
          </q-item-section>
          <q-item-section>
            <div class="text-body2 text-weight-medium">{{ opcion.titulo }}</div>
          </q-item-section>
        </q-item>
      </q-list>

      <!-- Pie del Drawer -->
      <div class="absolute-bottom q-pa-md text-caption bg-grey-1 text-grey-8" style="border-top: 1px solid #e0e0e0">
        <div class="row items-center no-wrap ellipsis q-mb-xs">
          <q-icon name="dns" size="14px" class="q-mr-xs text-primary" />
          <span class="ellipsis" :title="general.urlApi">{{ general.urlApi }}</span>
        </div>
        <div v-if="general.ultimaSincronizacion" class="row items-center no-wrap">
          <q-icon name="schedule" size="14px" class="q-mr-xs text-grey-6" />
          <span>{{ formatDateTime(general.ultimaSincronizacion) }}</span>
        </div>
      </div>
    </q-drawer>

    <!-- Contenedor de Vista -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
