<script setup>
/**
 * /views/ProveedoresView.vue
 * Gestión de Proveedores: CRUD completo, validación de slugs y control de integridad referencial.
 */
import { computed, onMounted, ref, watch } from "vue";
import EncabezadoPagina from "@/components/Encabezados/EncabezadoPagina.vue";
import TablaDatos from "@/components/Tables/TablaDatos.vue";
import { get, post, put, del } from "@/services/api.service";
import { useGeneralStore } from "@/store/General";
import { useAuthStore } from "@/store/Auth";
import { useNotificar } from "@/composables/useNotificar";
import { useConfirmar } from "@/composables/useConfirmar";
import { usePagination } from "@/composables/usePagination";
import { formatDate } from "@/utils/formatDate";
import { requerido, minimo, esEmail, slugValido, urlValida } from "@/utils/reglas";

const general = useGeneralStore();
const auth = useAuthStore();
const { notificarOk, notificarError } = useNotificar();
const { confirmar } = useConfirmar();

const {
  paginacion,
  rowsPerPageOpts,
  actualizarDesdeRequest,
  resetear,
  setTotal,
} = usePagination({ pageInicial: 1, rowsPerPageInicial: 20 });

const columnas = [
  { name: "logo", label: "Logo", field: "logoUrl", align: "center" },
  { name: "nombre", label: "Proveedor", field: "nombre", align: "left", sortable: true },
  { name: "slug", label: "Slug Identificador", field: "slug", align: "left", sortable: true },
  { name: "contactoEmail", label: "Correo de Contacto", field: "contactoEmail", align: "left", sortable: true },
  { name: "activo", label: "Estado", field: "activo", align: "center", sortable: true },
  {
    name: "createdAt",
    label: "Fecha Registro",
    field: "createdAt",
    align: "left",
    sortable: true,
    format: (val) => formatDate(val),
  },
  { name: "acciones", label: "Acciones", field: "acciones", align: "right" },
];

const proveedores = ref([]);
const cargando = ref(false);
const error = ref(null);
const filtroActivo = ref(null);

const cargarProveedores = async () => {
  cargando.value = true;
  error.value = null;
  try {
    const params = new URLSearchParams();
    params.set("page", paginacion.value.page);
    params.set("limit", paginacion.value.rowsPerPage);

    if (filtroActivo.value !== null && filtroActivo.value !== undefined) {
      params.set("activo", String(filtroActivo.value));
    }

    const res = await get(`/proveedores?${params.toString()}`);
    proveedores.value = res.data || [];
    setTotal(res.total || 0);

    general.marcarSincronizacion();
  } catch (e) {
    error.value = e.mensaje;
    notificarError(e);
  } finally {
    cargando.value = false;
  }
};

const onPeticionTabla = (req) => {
  actualizarDesdeRequest(req);
  cargarProveedores();
};

watch(() => filtroActivo.value, () => {
  resetear(1);
  cargarProveedores();
});

onMounted(cargarProveedores);

// --- Modal Crear / Editar ---
const dialogo = ref(false);
const guardando = ref(false);
const proveedorEditando = ref(null);
const formularioRef = ref(null);

const formularioVacio = () => ({
  nombre: "",
  slug: "",
  contactoEmail: "",
  logoUrl: "",
  activo: true,
});

const formulario = ref(formularioVacio());
const esEdicion = computed(() => proveedorEditando.value !== null);

const abrirCreacion = () => {
  proveedorEditando.value = null;
  formulario.value = formularioVacio();
  dialogo.value = true;
};

const abrirEdicion = (prov) => {
  proveedorEditando.value = prov;
  formulario.value = {
    nombre: prov.nombre,
    slug: prov.slug,
    contactoEmail: prov.contactoEmail || "",
    logoUrl: prov.logoUrl || "",
    activo: prov.activo,
  };
  dialogo.value = true;
};

// Generación automática de slug a partir del nombre
const generarSlug = () => {
  if (!esEdicion.value && formulario.value.nombre) {
    formulario.value.slug = formulario.value.nombre
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
};

const guardar = async () => {
  guardando.value = true;
  try {
    const payload = {
      nombre: formulario.value.nombre.trim(),
      slug: formulario.value.slug.trim().toLowerCase(),
      contactoEmail: formulario.value.contactoEmail?.trim() || null,
      logoUrl: formulario.value.logoUrl?.trim() || null,
      activo: Boolean(formulario.value.activo),
    };

    if (esEdicion.value) {
      await put(`/proveedores/${proveedorEditando.value._id}`, payload);
      notificarOk("Proveedor actualizado con éxito");
    } else {
      await post("/proveedores", payload);
      notificarOk("Proveedor registrado exitosamente");
    }

    dialogo.value = false;
    await cargarProveedores();
  } catch (e) {
    notificarError(e);
  } finally {
    guardando.value = false;
  }
};

// --- Cambiar Estado Activo / Inactivo ---
const alternarEstado = async (prov) => {
  const nuevoEstado = !prov.activo;
  try {
    await put(`/proveedores/${prov._id}`, { activo: nuevoEstado });
    notificarOk(`Proveedor ${prov.nombre} ${nuevoEstado ? "activado" : "desactivado"}`);
    await cargarProveedores();
  } catch (e) {
    notificarError(e);
  }
};

// --- Eliminar Proveedor ---
const eliminarProveedor = async (prov) => {
  const aceptado = await confirmar({
    titulo: "Eliminar Proveedor",
    mensaje: `¿Deseas eliminar el proveedor "${prov.nombre}"? Nota: No se podrá eliminar si tiene productos asociados.`,
    textoOk: "Eliminar",
    color: "negative",
  });

  if (!aceptado) return;

  try {
    await del(`/proveedores/${prov._id}`);
    notificarOk("Proveedor eliminado correctamente");
    await cargarProveedores();
  } catch (e) {
    // Si tiene productos, el backend devuelve 409 PROVEEDOR_CON_PRODUCTOS
    notificarError(e);
  }
};
</script>

<template>
  <q-page>
    <div class="contenedor-app">
      <EncabezadoPagina
        titulo="Proveedores"
        subtitulo="Gestión de fabricantes, distribuidores e integradores de catálogo"
        icono="local_shipping"
      >
        <template #acciones>
          <q-btn
            v-if="auth.esAdmin"
            unelevated
            no-caps
            color="primary"
            icon="add_business"
            label="Nuevo Proveedor"
            @click="abrirCreacion"
          />
        </template>
      </EncabezadoPagina>

      <!-- Filtro de estado -->
      <q-card flat class="tarjeta q-pa-md q-mb-md">
        <div class="row items-center q-col-gutter-sm">
          <div class="col-12 col-sm-4">
            <q-select
              v-model="filtroActivo"
              outlined
              dense
              clearable
              emit-value
              map-options
              label="Filtrar por Estado"
              :options="[
                { label: 'Activos', value: true },
                { label: 'Inactivos', value: false },
              ]"
            >
              <template #prepend>
                <q-icon name="filter_list" size="18px" />
              </template>
            </q-select>
          </div>
        </div>
      </q-card>

      <q-banner v-if="error" dense class="bg-red-1 text-negative q-mb-md rounded-borders">
        <template #avatar>
          <q-icon name="error_outline" />
        </template>
        {{ error }}
        <template #action>
          <q-btn flat dense no-caps label="Reintentar" @click="cargarProveedores" />
        </template>
      </q-banner>

      <TablaDatos
        :filas="proveedores"
        :columnas="columnas"
        :cargando="cargando"
        :paginacion="paginacion"
        mensaje-vacio="No hay proveedores registrados en el catálogo"
        @request="onPeticionTabla"
        @update:pagination="actualizarDesdeRequest"
      >
        <!-- Slot Logo -->
        <template #body-cell-logo="celda">
          <q-td :props="celda" class="text-center">
            <q-avatar size="34px" color="grey-2" text-color="primary">
              <img v-if="celda.row.logoUrl" :src="celda.row.logoUrl" alt="logo" />
              <q-icon v-else name="business" size="20px" />
            </q-avatar>
          </q-td>
        </template>

        <!-- Slot Slug -->
        <template #body-cell-slug="celda">
          <q-td :props="celda">
            <code class="q-px-sm q-py-xs bg-grey-2 text-dark rounded-borders text-caption">
              {{ celda.row.slug }}
            </code>
          </q-td>
        </template>

        <!-- Slot Estado -->
        <template #body-cell-activo="celda">
          <q-td :props="celda" class="text-center">
            <q-badge
              :color="celda.row.activo ? 'positive' : 'grey-6'"
              :label="celda.row.activo ? 'Activo' : 'Inactivo'"
            />
          </q-td>
        </template>

        <!-- Slot Acciones -->
        <template #body-cell-acciones="celda">
          <q-td :props="celda" class="text-right">
            <template v-if="auth.esAdmin">
              <q-btn
                flat
                dense
                round
                size="sm"
                icon="edit"
                color="primary"
                class="action-secondary"
                @click="abrirEdicion(celda.row)"
              >
                <q-tooltip>Editar proveedor</q-tooltip>
              </q-btn>

              <q-btn
                flat
                dense
                round
                size="sm"
                :icon="celda.row.activo ? 'toggle_on' : 'toggle_off'"
                :color="celda.row.activo ? 'positive' : 'grey-6'"
                class="action-secondary"
                @click="alternarEstado(celda.row)"
              >
                <q-tooltip>{{ celda.row.activo ? 'Desactivar' : 'Activar' }}</q-tooltip>
              </q-btn>

              <q-btn
                flat
                dense
                round
                size="sm"
                icon="delete"
                color="negative"
                class="action-secondary"
                @click="eliminarProveedor(celda.row)"
              >
                <q-tooltip>Eliminar proveedor</q-tooltip>
              </q-btn>
            </template>
            <span v-else class="text-caption text-grey-5">Solo lectura</span>
          </q-td>
        </template>
      </TablaDatos>
    </div>

    <!-- ================= MODAL CREAR / EDITAR PROVEEDOR ================= -->
    <q-dialog v-model="dialogo" persistent @show="formularioRef?.resetValidation()">
      <q-card class="dialog-card">
        <q-card-section class="bg-primary text-white row items-center no-wrap q-px-lg q-py-md">
          <q-icon :name="esEdicion ? 'edit' : 'add_business'" size="28px" class="q-mr-md" />
          <div>
            <div class="dialog-title">
              {{ esEdicion ? "Editar Proveedor" : "Nuevo Proveedor" }}
            </div>
            <div class="text-caption text-green-2">
              Registro del emisor de productos y cargas masivas
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
              label="Nombre Comercial del Proveedor *"
              hint="Ej: ACME Corporation"
              :rules="[requerido('El nombre'), minimo(2, 'El nombre')]"
              lazy-rules
              @blur="generarSlug"
            />

            <q-input
              v-model="formulario.slug"
              outlined
              dense
              label="Slug Único *"
              hint="Identificador en minúsculas para importaciones (ej: acme-corp)"
              :rules="[requerido('El slug'), slugValido()]"
              lazy-rules
            />

            <q-input
              v-model="formulario.contactoEmail"
              outlined
              dense
              type="email"
              label="Correo de Contacto (Opcional)"
              hint="Ej: ventas@proveedor.com"
              :rules="[formulario.contactoEmail ? esEmail() : () => true]"
              lazy-rules
            />

            <q-input
              v-model="formulario.logoUrl"
              outlined
              dense
              label="URL del Logotipo (Opcional)"
              hint="https://ejemplo.com/logo.png"
              :rules="[urlValida()]"
              lazy-rules
            />

            <div class="q-pt-sm">
              <q-toggle
                v-model="formulario.activo"
                label="Proveedor Activo para Importaciones y Catálogo"
                color="primary"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-px-md q-pb-md">
            <q-btn v-close-popup flat no-caps label="Cancelar" color="dark" class="btn-cancel" />
            <q-btn
              unelevated
              no-caps
              type="submit"
              color="primary"
              class="btn-ok"
              :label="esEdicion ? 'Guardar Cambios' : 'Registrar Proveedor'"
              :loading="guardando"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>