<script setup>
/**
 * /components/Tables/TablaDatos.vue
 * Tabla reutilizable sobre <q-table> con búsqueda integrada, slots dinámicos y estados de carga.
 */
import { computed, ref, useSlots } from "vue";

const props = defineProps({
  filas: {
    type: Array,
    required: true,
  },
  columnas: {
    type: Array,
    required: true,
  },
  cargando: {
    type: Boolean,
    default: false,
  },
  filaClave: {
    type: String,
    default: "_id",
  },
  mensajeVacio: {
    type: String,
    default: "No hay registros disponibles",
  },
  paginacion: {
    type: Object,
    default: () => ({ rowsPerPage: 15 }),
  },
  mostrarBusqueda: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["request", "update:pagination"]);

const busqueda = ref("");
const slots = useSlots();

const slotsPropios = ["default", "top", "no-data", "acciones-tabla"];
const slotsReenviados = computed(() =>
  Object.keys(slots).filter((nombre) => !slotsPropios.includes(nombre))
);

const onTableRequest = (requestProp) => {
  emit("request", requestProp);
};
</script>

<template>
  <q-table
    :rows="filas"
    :columns="columnas"
    :row-key="filaClave"
    :loading="cargando"
    :filter="mostrarBusqueda ? busqueda : undefined"
    :pagination="paginacion"
    :rows-per-page-options="[10, 15, 25, 50, 100, 0]"
    :no-data-label="mensajeVacio"
    no-results-label="Ningún registro coincide con la búsqueda"
    loading-label="Cargando datos del servidor..."
    rows-per-page-label="Registros por página"
    flat
    bordered
    class="tabla-datos my-sticky-header-table tarjeta-elevada"
    @request="onTableRequest"
    @update:pagination="(val) => emit('update:pagination', val)"
  >
    <!-- Barra superior de la tabla -->
    <template #top>
      <div class="row full-width items-center q-col-gutter-sm">
        <div v-if="mostrarBusqueda" class="col-12 col-sm-5">
          <q-input
            v-model="busqueda"
            dense
            outlined
            clearable
            debounce="300"
            placeholder="Buscar en la tabla..."
            class="tabla-busqueda"
          >
            <template #prepend>
              <q-icon name="search" color="grey-6" />
            </template>
          </q-input>
        </div>

        <q-space class="gt-xs" />

        <div class="col-12 col-sm-auto row items-center q-gutter-sm">
          <slot name="acciones-tabla" />
        </div>
      </div>
    </template>

    <!-- Reenvío transparente de slots -->
    <template
      v-for="nombre in slotsReenviados"
      :key="nombre"
      #[nombre]="datosDelSlot"
    >
      <slot :name="nombre" v-bind="datosDelSlot || {}" />
    </template>

    <!-- Estado vacío personalizado -->
    <template #no-data>
      <div class="full-width column flex-center q-py-xl">
        <q-icon name="inbox" size="64px" color="grey-4" class="q-mb-sm" />
        <span class="empty-title">{{ mensajeVacio }}</span>
        <p class="text-caption text-grey-5 q-mt-xs">Intenta ajustar los filtros o busca con otros términos</p>
      </div>
    </template>
  </q-table>
</template>

<style scoped lang="scss">
.tabla-datos {
  border-radius: $radio-tarjeta;
  overflow: hidden;

  .q-table__top {
    padding: $spacing-md;
    border-bottom: 1px solid $color-borde;
    background: #fafafa;
  }

  .tabla-busqueda {
    max-width: 320px;
  }

  .q-table__bottom {
    padding: $spacing-md;
    border-top: 1px solid $color-borde;
    background: #fafafa;
  }

  .q-table__pagination {
    color: $texto-secundario;
  }
}
</style>
