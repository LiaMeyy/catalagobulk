<script setup>
/**
 * /views/DashboardView.vue
 * Panel principal con estadísticas del catálogo, distribución por categorías y salud del sistema.
 */
import { computed, onMounted, ref } from "vue";
import EncabezadoPagina from "@/components/Encabezados/EncabezadoPagina.vue";
import TarjetaMetrica from "@/components/Cards/TarjetaMetrica.vue";
import { useGeneralStore } from "@/store/General";
import { useAuthStore } from "@/store/Auth";
import { useNotificar } from "@/composables/useNotificar";
import { formatMoneda } from "@/utils/formatDate";

const general = useGeneralStore();
const auth = useAuthStore();
const { notificarError } = useNotificar();

const cargando = ref(false);
const error = ref(null);
const stats = ref({
  totalProductos: 0,
  precioPromedio: 0,
  porCategoria: [],
});

const totalCategorias = computed(() => stats.value.porCategoria?.length || 0);

const categoriaMasPoblada = computed(() => {
  if (!stats.value.porCategoria?.length) return "N/A";
  const mayor = stats.value.porCategoria[0];
  return `${mayor.categoria} (${mayor.count})`;
});

const cargarDashboard = async () => {
  cargando.value = true;
  error.value = null;
  try {
    const [datosStats] = await Promise.all([
      general.obtenerStats(),
      general.verificarSalud(),
    ]);

    stats.value = datosStats || { totalProductos: 0, precioPromedio: 0, porCategoria: [] };
    general.marcarSincronizacion();
  } catch (e) {
    error.value = e.mensaje;
    notificarError(e);
  } finally {
    cargando.value = false;
  }
};

onMounted(cargarDashboard);
</script>

<template>
  <q-page>
    <div class="contenedor-app">
      <EncabezadoPagina
        titulo="Dashboard del Catálogo"
        subtitulo="Métricas generales de productos, categorías y estado de la plataforma"
        icono="dashboard"
      >
      </EncabezadoPagina>

      <!-- Banner de Error si la API no responde -->
      <q-banner
        v-if="error"
        dense
        class="bg-red-1 text-negative q-mb-lg rounded-borders"
      >
        <template #avatar>
          <q-icon name="error_outline" />
        </template>
        {{ error }}
        <template #action>
          <q-btn flat dense no-caps label="Reintentar" @click="cargarDashboard" />
        </template>
      </q-banner>

      <!-- Métricas Principales -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-sm-6 col-md-3">
          <TarjetaMetrica
            titulo="Total Productos"
            :valor="stats.totalProductos.toLocaleString('es-CO')"
            subtitulo="Ítems en base de datos"
            icono="inventory_2"
            color="green-9"
            :cargando="cargando"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <TarjetaMetrica
            titulo="Precio Promedio"
            :valor="formatMoneda(stats.precioPromedio)"
            subtitulo="Calculado en catálogo"
            icono="payments"
            color="blue-8"
            :cargando="cargando"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <TarjetaMetrica
            titulo="Categorías"
            :valor="totalCategorias"
            :subtitulo="`Top: ${categoriaMasPoblada}`"
            icono="category"
            color="purple-8"
            :cargando="cargando"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <TarjetaMetrica
            titulo="Estado Servidor"
            :valor="general.backendOnline ? 'Operativo' : 'Verificar'"
            :subtitulo="`Mongo: ${general.saludServidor.mongo} | Redis: ${general.saludServidor.redis}`"
            :icono="general.backendOnline ? 'check_circle' : 'warning'"
            :color="general.backendOnline ? 'positive' : 'negative'"
            :cargando="general.verificandoSalud"
          />
        </div>
      </div>

      <!-- Contenido Principal: Categorías y Accesos Directos -->
      <div class="row q-col-gutter-lg">
        <!-- Distribución por Categoría -->
        <div class="col-12 col-md-7">
          <div class="section-box">
            <div class="section-box__title justify-between">
              <div class="row items-center">
                <q-icon name="pie_chart" size="18px" class="q-mr-sm" />
                <span>Distribución por Categorías</span>
              </div>
              <q-badge color="primary" :label="`${totalCategorias} categorías`" />
            </div>

            <div class="q-pa-md">
              <div v-if="stats.porCategoria?.length" class="q-gutter-y-md">
                <div
                  v-for="cat in stats.porCategoria"
                  :key="cat.categoria"
                  class="row items-center justify-between"
                >
                  <div class="col-4 text-weight-medium text-capitalize ellipsis">
                    <q-icon name="label" size="16px" color="primary" class="q-mr-xs" />
                    {{ cat.categoria }}
                  </div>
                  <div class="col-5 q-px-sm">
                    <q-linear-progress
                      rounded
                      size="10px"
                      :value="stats.totalProductos ? cat.count / stats.totalProductos : 0"
                      color="primary"
                      track-color="green-1"
                    />
                  </div>
                  <div class="col-3 text-right text-caption text-grey-8">
                    <strong>{{ cat.count.toLocaleString("es-CO") }}</strong>
                    ({{ stats.totalProductos ? Math.round((cat.count / stats.totalProductos) * 100) : 0 }}%)
                  </div>
                </div>
              </div>

              <div v-else class="text-center q-py-lg text-grey-6">
                <q-icon name="inbox" size="48px" class="q-mb-xs" />
                <div>Aún no hay productos registrados para agrupar</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Accesos Directos y Acciones Rápidas -->
        <div class="col-12 col-md-5">
          <div class="section-box q-mb-md">
            <div class="section-box__title">
              <q-icon name="bolt" size="18px" class="q-mr-sm" />
              <span>Acciones Rápidas</span>
            </div>

            <div class="q-pa-md q-gutter-sm">
              <q-btn
                unelevated
                no-caps
                color="primary"
                icon="cloud_upload"
                label="Cargar Catálogo Masivo (CSV / JSON)"
                class="full-width q-py-sm text-body2"
                :to="{ name: 'imports' }"
              />

              <q-btn
                outline
                no-caps
                color="primary"
                icon="inventory_2"
                label="Ver Listado de Productos"
                class="full-width q-py-sm text-body2"
                :to="{ name: 'productos' }"
              />

              <q-btn
                outline
                no-caps
                color="grey-8"
                icon="local_shipping"
                label="Gestionar Proveedores"
                class="full-width q-py-sm text-body2"
                :to="{ name: 'proveedores' }"
              />

              <q-btn
                outline
                no-caps
                color="grey-8"
                icon="category"
                label="Catálogo de Categorías"
                class="full-width q-py-sm text-body2"
                :to="{ name: 'categorias' }"
              />
            </div>
          </div>

          <!-- Banner Informativo de Sesión -->
          <q-card flat class="tarjeta bg-green-1 text-green-10 q-pa-md">
            <div class="row items-start no-wrap">
              <q-icon name="verified_user" size="24px" class="q-mr-sm q-mt-xs" />
              <div>
                <div class="text-weight-bold">
                  Sesión: {{ auth.nombreUsuario }}
                </div>
                <div class="text-caption text-grey-8">
                  Rol activo: <strong>{{ auth.rolUsuario.toUpperCase() }}</strong>.
                  <span v-if="auth.esAdmin"> Tienes permisos para crear, editar y eliminar recursos.</span>
                  <span v-else> Acceso en modo consulta y visualización.</span>
                </div>
              </div>
            </div>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>