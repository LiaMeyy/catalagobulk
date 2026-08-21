<script setup>
/**
 * /views/CategoriasView.vue
 * Consulta y gestión de metadatos de Categorías del Catálogo.
 */
import { computed, onMounted, ref } from "vue";
import EncabezadoPagina from "@/components/Encabezados/EncabezadoPagina.vue";
import { get, put } from "@/services/api.service";
import { useGeneralStore } from "@/store/General";
import { useAuthStore } from "@/store/Auth";
import { useNotificar } from "@/composables/useNotificar";
import { requerido, minimo, urlValida, slugValido } from "@/utils/reglas";
import { generarSlug } from "@/utils/slug";

const general = useGeneralStore();
const auth = useAuthStore();
const { notificarOk, notificarError } = useNotificar();

const categorias = ref([]);
const statsCategorias = ref({});
const cargando = ref(false);
const error = ref(null);
const busqueda = ref("");

const endpointDisponible = ref(true);

const verificarEndpointCategorias = async () => {
  try {
    await get("/categorias");
    endpointDisponible.value = true;
  } catch (e) {
    if (e.status === 404) {
      endpointDisponible.value = false;
    }
    throw e;
  }
};

const cargarCategorias = async () => {
  cargando.value = true;
  error.value = null;
  try {
    await verificarEndpointCategorias();
    const [listaCategorias, stats] = await Promise.all([
      get("/categorias"),
      general.obtenerStats(),
    ]);

    categorias.value = listaCategorias || [];

    const mapa = {};
    if (stats?.porCategoria) {
      for (const item of stats.porCategoria) {
        mapa[item.categoria?.toLowerCase()] = item.count;
      }
    }
    statsCategorias.value = mapa;

    general.marcarSincronizacion();
  } catch (e) {
    if (e.status === 404) {
      error.value = "El endpoint de categorías no está disponible en el backend. Las funcionalidades de gestión de categorías están deshabilitadas.";
      notificarError("Gestión de categorías no disponible: El backend no expone el endpoint /api/categorias");
    } else {
      error.value = e.mensaje;
      notificarError(e);
    }
  } finally {
    cargando.value = false;
  }
};

const categoriasFiltradas = computed(() => {
  if (!busqueda.value.trim()) return categorias.value;
  const q = busqueda.value.toLowerCase().trim();
  return categorias.value.filter(
    (c) =>
      c.nombre?.toLowerCase().includes(q) ||
      c.slug?.toLowerCase().includes(q) ||
      c.descripcion?.toLowerCase().includes(q)
  );
});

onMounted(cargarCategorias);

// --- Modal Crear / Editar Metadata de Categoría ---
const dialogo = ref(false);
const guardando = ref(false);
const categoriaEditando = ref(null);
const formularioRef = ref(null);

const formularioVacio = () => ({
  nombre: "",
  slug: "",
  descripcion: "",
  imagenUrl: "",
});

const formulario = ref(formularioVacio());
const esEdicion = computed(() => categoriaEditando.value !== null);

const abrirEdicion = (cat) => {
  if (!endpointDisponible.value) {
    notificarError("Gestión de categorías no disponible: El backend no expone el endpoint /api/categorias");
    return;
  }
  categoriaEditando.value = cat;
  formulario.value = {
    nombre: cat.nombre,
    slug: cat.slug,
    descripcion: cat.descripcion || "",
    imagenUrl: cat.imagenUrl || "",
  };
  dialogo.value = true;
};

// Generación automática de slug a partir del nombre
const generarSlugAuto = () => {
  if (!esEdicion.value && formulario.value.nombre) {
    formulario.value.slug = generarSlug(formulario.value.nombre);
  }
};

const guardar = async () => {
  if (!endpointDisponible.value) {
    notificarError("Gestión de categorías no disponible: El backend no expone el endpoint /api/categorias");
    return;
  }
  guardando.value = true;
  try {
    const payload = {
      nombre: formulario.value.nombre.trim(),
      slug: formulario.value.slug.trim().toLowerCase(),
      descripcion: formulario.value.descripcion?.trim() || null,
      imagenUrl: formulario.value.imagenUrl?.trim() || null,
    };

    await put(`/categorias/${categoriaEditando.value._id}`, payload);
    notificarOk("Metadatos de categoría actualizados con éxito");

    dialogo.value = false;
    await cargarCategorias();
  } catch (e) {
    if (e.status === 404) {
      endpointDisponible.value = false;
      notificarError("Gestión de categorías no disponible: El backend no expone el endpoint /api/categorias");
    } else {
      notificarError(e);
    }
  } finally {
    guardando.value = false;
  }
};

</script>

<template>
  <q-page>
    <div class="contenedor-app">
      <EncabezadoPagina
        titulo="Categorías"
        subtitulo="Metadatos, descripciones y clasificación de productos del catálogo"
        icono="category"
      />

      <!-- Barra de Búsqueda -->
      <div class="row q-col-gutter-sm items-center q-mb-md">
        <div class="col-12 col-sm-6">
          <q-input
            v-model="busqueda"
            outlined
            dense
            clearable
            placeholder="Buscar por nombre, slug o descripción..."
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
      </div>

      <q-banner v-if="error" dense class="bg-red-1 text-negative q-mb-md rounded-borders">
        <template #avatar>
          <q-icon name="error_outline" />
        </template>
        {{ error }}
        <template #action>
          <q-btn flat dense no-caps label="Reintentar" @click="cargarCategorias" />
        </template>
      </q-banner>

      <!-- Grid de Categorías -->
      <div v-if="cargando" class="row justify-center q-py-xl">
        <q-spinner-dots size="48px" color="primary" />
      </div>

      <div v-else-if="categoriasFiltradas.length > 0" class="row q-col-gutter-md">
        <div
          v-for="cat in categoriasFiltradas"
          :key="cat._id || cat.slug"
          class="col-12 col-sm-6 col-md-4"
        >
          <q-card flat class="tarjeta tarjeta-hover full-height column justify-between">
            <q-card-section>
              <div class="row items-center justify-between no-wrap q-mb-sm">
                <div class="text-subtitle1 text-weight-bold text-capitalize ellipsis">
                  <q-icon name="folder" color="primary" size="20px" class="q-mr-xs" />
                  {{ cat.nombre }}
                </div>
                <q-badge
                  color="green-9"
                  :label="`${statsCategorias[cat.slug] || 0} productos`"
                />
              </div>

              <div class="text-caption text-grey-6 q-mb-xs">
                Slug: <code>{{ cat.slug }}</code>
              </div>

              <p class="text-body2 text-grey-8 q-mb-none" style="min-height: 40px">
                {{ cat.descripcion || 'Sin descripción detallada registrada.' }}
              </p>
            </q-card-section>

            <q-separator />

            <q-card-actions align="between" class="q-px-md q-py-sm bg-grey-1">
              <q-btn
                flat
                dense
                no-caps
                size="sm"
                color="primary"
                icon="inventory_2"
                label="Ver productos"
                :to="{ name: 'productos', query: { categoria: cat.slug } }"
              />

              <template v-if="auth.esAdmin">
                <q-btn
                  flat
                  dense
                  round
                  size="sm"
                  icon="edit"
                  color="teal-8"
                  @click="abrirEdicion(cat)"
                >
                  <q-tooltip>Editar metadatos</q-tooltip>
                </q-btn>

              </template>
            </q-card-actions>
          </q-card>
        </div>
      </div>

      <!-- Estado vacío -->
      <div v-else class="text-center q-py-xl tarjeta">
        <q-icon name="category" size="64px" color="grey-4" />
        <div class="empty-title q-mt-sm">No se encontraron categorías disponibles</div>
      </div>
    </div>

    <!-- ================= MODAL CREAR / EDITAR METADATA CATEGORÍA ================= -->
    <q-dialog v-model="dialogo" persistent @show="formularioRef?.resetValidation()">
      <q-card class="dialog-card">
        <q-card-section class="bg-primary text-white row items-center no-wrap q-px-lg q-py-md">
          <q-icon name="edit" size="28px" class="q-mr-md" />
          <div>
            <div class="dialog-title">
              Editar Categoría
            </div>
            <div class="text-caption text-green-2">
              Actualiza los metadatos de una categoría existente
            </div>
          </div>
          <q-space />
          <q-btn v-close-popup flat round dense icon="close" color="white" />
        </q-card-section>

        <q-form ref="formularioRef" greedy @submit="guardar">
          <q-card-section class="q-gutter-sm">
            <q-input
              v-model="formulario.nombre"
              outlined
              dense
              label="Nombre Visible *"
              :rules="[requerido('El nombre'), minimo(2, 'El nombre')]"
              lazy-rules
              @blur="generarSlugAuto"
            />

            <q-input
              v-model="formulario.slug"
              outlined
              dense
              label="Slug *"
              hint="Identificador único en minúsculas (ej: electronica, ropa-hombre)"
              :rules="[requerido('El slug'), slugValido()]"
              lazy-rules
            />

            <q-input
              v-model="formulario.imagenUrl"
              outlined
              dense
              label="URL de Imagen Representativa (Opcional)"
              hint="https://ejemplo.com/categoria.jpg"
              :rules="[urlValida()]"
              lazy-rules
            />

            <q-input
              v-model="formulario.descripcion"
              outlined
              dense
              type="textarea"
              rows="3"
              label="Descripción de la Categoría"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-px-md q-pb-md">
            <q-btn v-close-popup flat no-caps label="Cancelar" color="dark" class="btn-cancel" />
            <q-btn
              unelevated
              no-caps
              type="submit"
              color="primary"
              class="btn-ok"
              label="Guardar Cambios"
              :loading="guardando"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
code {
  background: #f1f3f5;
  border-radius: 4px;
  padding: 1px 4px;
}
</style>