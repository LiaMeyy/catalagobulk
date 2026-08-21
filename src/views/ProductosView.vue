<script setup>
/**
 * /views/ProductosView.vue
 * Gestión de Productos: Listado paginado con filtros, alta, edición y eliminación.
 */
import { computed, onMounted, ref, watch } from "vue";
import EncabezadoPagina from "@/components/Encabezados/EncabezadoPagina.vue";
import TablaDatos from "@/components/Tables/TablaDatos.vue";
import CrearProveedorRapido from "@/components/Modales/CrearProveedorRapido.vue";
import { get, post, put, del } from "@/services/api.service";
import { useGeneralStore } from "@/store/General";
import { useAuthStore } from "@/store/Auth";
import { useNotificar } from "@/composables/useNotificar";
import { useConfirmar } from "@/composables/useConfirmar";
import { usePagination } from "@/composables/usePagination";
import { useProveedores } from "@/composables/useProveedores";
import { formatMoneda } from "@/utils/formatDate";
import {
  requerido,
  minimo,
  numeroPositivo,
  enteroPositivo,
  seleccionRequerida,
  urlValida,
  slugValido,
  esEmail,
} from "@/utils/reglas";

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
  paramsPaginacion,
} = usePagination({ pageInicial: 1, rowsPerPageInicial: 20 });

const {
  proveedores,
  categorias,
  cargandoProveedores,
  cargandoCategorias,
  mapaProveedores,
  opcionesProveedoresSelect,
  opcionesCategoriasSelect,
  hayProveedores,
  cargarTodo,
  invalidarCache: invalidarCacheProveedores,
  crearProveedorRapido,
} = useProveedores();

// --- Columnas de la Tabla ---
const columnas = [
  { name: "sku", label: "SKU", field: "sku", align: "left", sortable: true },
  { name: "nombre", label: "Nombre del Producto", field: "nombre", align: "left", sortable: true },
  { name: "categoria", label: "Categoría", field: "categoria", align: "left", sortable: true },
  {
    name: "precio",
    label: "Precio",
    field: "precio",
    align: "right",
    sortable: true,
    format: (val) => formatMoneda(val),
  },
  { name: "stock", label: "Stock", field: "stock", align: "right", sortable: true },
  { name: "disponible", label: "Disponibilidad", field: "disponible", align: "center", sortable: true },
  { name: "proveedor", label: "Proveedor", field: "proveedor", align: "left" },
  { name: "acciones", label: "Acciones", field: "acciones", align: "right" },
];

// --- Estado del Listado ---
const productos = ref([]);
const cargando = ref(false);
const error = ref(null);

const filtroCategoria = ref(null);
const filtroProveedor = ref(null);
const filtroDisponible = ref(null);

// --- Carga de Datos ---
const cargarProductos = async () => {
  cargando.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams(paramsPaginacion.value);

    if (filtroCategoria.value) params.set("categoria", filtroCategoria.value);
    if (filtroProveedor.value) params.set("proveedor", filtroProveedor.value);
    if (filtroDisponible.value !== null && filtroDisponible.value !== undefined) {
      params.set("disponible", String(filtroDisponible.value));
    }

    const respuesta = await get(`/productos?${params.toString()}`);
    productos.value = respuesta.data || [];
    setTotal(respuesta.total || 0);

    general.marcarSincronizacion();
  } catch (e) {
    error.value = e.mensaje;
    notificarError(e);
  } finally {
    cargando.value = false;
  }
};

const onPeticionTabla = (requestProp) => {
  actualizarDesdeRequest(requestProp);
  cargarProductos();
};

watch([filtroCategoria, filtroProveedor, filtroDisponible], () => {
  resetear(1);
  cargarProductos();
});

onMounted(async () => {
  await cargarTodo();
  await cargarProductos();
});

// --- Modal de Crear / Editar Producto ---
const dialogo = ref(false);
const guardando = ref(false);
const productoEditando = ref(null);
const formularioRef = ref(null);

const formularioVacio = () => ({
  sku: "",
  nombre: "",
  precio: 0,
  stock: 0,
  categoria: "",
  descripcion: "",
  imagenUrl: "",
  proveedorId: null,
});

const formulario = ref(formularioVacio());
const esEdicion = computed(() => productoEditando.value !== null);

const abrirCreacion = async () => {
  productoEditando.value = null;
  formulario.value = formularioVacio();
  if (opcionesProveedoresSelect.value.length > 0) {
    formulario.value.proveedorId = opcionesProveedoresSelect.value[0].value;
  }
  dialogo.value = true;
};

const abrirEdicion = async (prod) => {
  productoEditando.value = prod;
  formulario.value = {
    sku: prod.sku,
    nombre: prod.nombre,
    precio: prod.precio,
    stock: prod.stock,
    categoria: prod.categoria,
    descripcion: prod.descripcion || "",
    imagenUrl: prod.imagenUrl || "",
    proveedorId: prod.proveedorId,
  };
  dialogo.value = true;
};

const guardar = async () => {
  guardando.value = true;
  try {
    const payload = {
      sku: formulario.value.sku.trim(),
      nombre: formulario.value.nombre.trim(),
      precio: Number(formulario.value.precio),
      stock: Math.trunc(Number(formulario.value.stock)),
      categoria: formulario.value.categoria,
      descripcion: formulario.value.descripcion?.trim() || null,
      imagenUrl: formulario.value.imagenUrl?.trim() || null,
      proveedorId: formulario.value.proveedorId,
    };

    if (esEdicion.value) {
      await put(`/productos/${productoEditando.value._id}`, payload);
      notificarOk("Producto actualizado correctamente");
    } else {
      await post("/productos", payload);
      notificarOk("Producto creado exitosamente");
    }

    dialogo.value = false;
    await cargarProductos();
  } catch (e) {
    notificarError(e);
  } finally {
    guardando.value = false;
  }
};

// --- Eliminar Producto ---
const eliminarProducto = async (prod) => {
  const aceptado = await confirmar({
    titulo: "Eliminar Producto",
    mensaje: `¿Estás seguro de eliminar el producto "${prod.nombre}" (SKU: ${prod.sku})? Esta acción no se puede deshacer.`,
    textoOk: "Eliminar",
    color: "negative",
  });

  if (!aceptado) return;

  try {
    await del(`/productos/${prod._id}`);
    notificarOk("Producto eliminado correctamente");
    await cargarProductos();
  } catch (e) {
    notificarError(e);
  }
};

// --- Modal Detalle / Vista Previa ---
const dialogoDetalle = ref(false);
const productoDetalle = ref(null);

const verDetalle = (prod) => {
  productoDetalle.value = prod;
  dialogoDetalle.value = true;
};

// --- Proveedor Rápido ---
const dialogoProveedorRapido = ref(false);

const onProveedorCreado = (nuevoProv) => {
  formulario.value.proveedorId = nuevoProv._id;
};
</script>

<template>
  <q-page>
    <div class="contenedor-app">
      <EncabezadoPagina
        titulo="Productos"
        subtitulo="Consulta, filtrado y administración del inventario de productos"
        icono="inventory_2"
      >
        <template #acciones>
          <q-btn
            v-if="auth.esAdmin"
            unelevated
            no-caps
            color="primary"
            icon="add"
            label="Nuevo Producto"
            @click="abrirCreacion"
          />
        </template>
      </EncabezadoPagina>

      <!-- Alerta si no hay proveedores registrados -->
      <q-banner
        v-if="!hayProveedores && !cargando"
        dense
        class="bg-orange-1 text-orange-9 q-mb-md rounded-borders"
      >
        <template #avatar>
          <q-icon name="warning_amber" />
        </template>
        No hay proveedores registrados en el catálogo. Cada producto debe estar vinculado a un proveedor.
        <template #action>
          <CrearProveedorRapido
            v-if="auth.esAdmin"
            v-model="dialogoProveedorRapido"
            :titulo="'Crear Proveedor Rápido'"
            :subtitulo="'Se creará y seleccionará automáticamente para este producto'"
            @creado="onProveedorCreado"
          />
          <q-btn
            flat
            dense
            no-caps
            label="Ir al Módulo de Proveedores"
            :to="{ name: 'proveedores' }"
          />
        </template>
      </q-banner>

      <!-- Barra de Filtros -->
      <q-card flat class="tarjeta q-pa-md q-mb-md">
        <div class="row q-col-gutter-sm items-center">
          <div class="col-12 col-sm-3">
            <q-select
              v-model="filtroCategoria"
              outlined
              dense
              clearable
              emit-value
              map-options
              label="Filtrar por Categoría"
              :options="opcionesCategoriasSelect"
            >
              <template #prepend>
                <q-icon name="category" size="18px" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-sm-3">
            <q-select
              v-model="filtroProveedor"
              outlined
              dense
              clearable
              emit-value
              map-options
              label="Filtrar por Proveedor"
              :options="opcionesProveedoresSelect"
            >
              <template #prepend>
                <q-icon name="local_shipping" size="18px" />
              </template>
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey-7">
                    No hay proveedores registrados
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-sm-3">
            <q-select
              v-model="filtroDisponible"
              outlined
              dense
              clearable
              emit-value
              map-options
              label="Disponibilidad"
              :options="[
                { label: 'Disponible (Stock > 0)', value: true },
                { label: 'Agotado (Stock = 0)', value: false },
              ]"
            >
              <template #prepend>
                <q-icon name="check_circle" size="18px" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-sm-3 text-right">
            <q-btn
              flat
              dense
              no-caps
              color="grey-7"
              icon="clear_all"
              label="Limpiar Filtros"
              @click="() => { filtroCategoria = null; filtroProveedor = null; filtroDisponible = null; }"
            />
          </div>
        </div>
      </q-card>

      <!-- Error banner -->
      <q-banner v-if="error" dense class="bg-red-1 text-negative q-mb-md rounded-borders">
        <template #avatar>
          <q-icon name="error_outline" />
        </template>
        {{ error }}
        <template #action>
          <q-btn flat dense no-caps label="Reintentar" @click="cargarProductos" />
        </template>
      </q-banner>

      <!-- Tabla de Productos -->
      <TablaDatos
        :filas="productos"
        :columnas="columnas"
        :cargando="cargando"
        :paginacion="paginacion"
        :mostrar-busqueda="false"
        mensaje-vacio="No se encontraron productos con los filtros aplicados"
        @request="onPeticionTabla"
        @update:pagination="actualizarDesdeRequest"
      >
        <!-- Slot SKU con click para ver detalle -->
        <template #body-cell-sku="celda">
          <q-td :props="celda">
            <span
              class="text-weight-bold text-primary cursor-pointer"
              @click="verDetalle(celda.row)"
            >
              {{ celda.row.sku }}
            </span>
          </q-td>
        </template>

        <!-- Slot Categoría -->
        <template #body-cell-categoria="celda">
          <q-td :props="celda">
            <q-chip
              dense
              size="sm"
              color="green-1"
              text-color="green-9"
              class="text-weight-bold text-capitalize"
            >
              {{ celda.row.categoria }}
            </q-chip>
          </q-td>
        </template>

        <!-- Slot Stock -->
        <template #body-cell-stock="celda">
          <q-td :props="celda" class="text-right">
            <span :class="celda.row.stock === 0 ? 'text-negative text-weight-bold' : ''">
              {{ celda.row.stock }} un.
            </span>
          </q-td>
        </template>

        <!-- Slot Disponibilidad -->
        <template #body-cell-disponible="celda">
          <q-td :props="celda" class="text-center">
            <q-badge
              :color="celda.row.disponible ? 'positive' : 'negative'"
              :label="celda.row.disponible ? 'Disponible' : 'Agotado'"
            />
          </q-td>
        </template>

        <!-- Slot Proveedor -->
        <template #body-cell-proveedor="celda">
          <q-td :props="celda">
            {{ mapaProveedores[celda.row.proveedorId] || celda.row.proveedorId || 'N/A' }}
          </q-td>
        </template>

        <!-- Slot Acciones -->
        <template #body-cell-acciones="celda">
          <q-td :props="celda" class="text-right">
            <q-btn
              flat
              dense
              round
              size="sm"
              icon="visibility"
              color="primary"
              class="action-secondary"
              @click="verDetalle(celda.row)"
            >
              <q-tooltip>Ver detalles</q-tooltip>
            </q-btn>

            <template v-if="auth.esAdmin">
              <q-btn
                flat
                dense
                round
                size="sm"
                icon="edit"
                color="teal-8"
                class="action-secondary"
                @click="abrirEdicion(celda.row)"
              >
                <q-tooltip>Editar producto</q-tooltip>
              </q-btn>

              <q-btn
                flat
                dense
                round
                size="sm"
                icon="delete"
                color="negative"
                class="action-secondary"
                @click="eliminarProducto(celda.row)"
              >
                <q-tooltip>Eliminar producto</q-tooltip>
              </q-btn>
            </template>
          </q-td>
        </template>
      </TablaDatos>
    </div>

    <!-- ================= MODAL CREAR / EDITAR PRODUCTO ================= -->
    <q-dialog v-model="dialogo" persistent @show="formularioRef?.resetValidation()">
      <q-card class="dialog-card">
        <q-card-section class="bg-primary text-white row items-center no-wrap q-px-lg q-py-md">
          <q-icon :name="esEdicion ? 'edit' : 'add_box'" size="28px" class="q-mr-md" />
          <div>
            <div class="dialog-title">
              {{ esEdicion ? "Editar Producto" : "Nuevo Producto" }}
            </div>
            <div class="text-caption text-green-2">
              Ingreso de especificaciones y existencias al catálogo
            </div>
          </div>
          <q-space />
          <q-btn v-close-popup flat round dense icon="close" color="white" />
        </q-card-section>

        <!-- Alerta en modal si no hay proveedores -->
        <q-card-section v-if="!hayProveedores" class="q-pb-none">
          <q-banner dense class="bg-orange-1 text-orange-9 rounded-borders">
            <template #avatar>
              <q-icon name="warning" />
            </template>
            Aún no tienes proveedores creados. Haz clic en el botón '+' para crear uno rápido.
          </q-banner>
        </q-card-section>

        <q-form ref="formularioRef" greedy @submit="guardar">
          <q-card-section class="q-gutter-sm">
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="formulario.sku"
                  outlined
                  dense
                  label="SKU / Código Único *"
                  hint="Ej: PROD-10234"
                  :rules="[requerido('El SKU'), minimo(2, 'El SKU')]"
                  lazy-rules
                />
              </div>

              <div class="col-12 col-sm-6">
                <q-input
                  v-model="formulario.nombre"
                  outlined
                  dense
                  label="Nombre del Producto *"
                  :rules="[requerido('El nombre'), minimo(2, 'El nombre')]"
                  lazy-rules
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="formulario.precio"
                  outlined
                  dense
                  type="number"
                  step="0.01"
                  label="Precio Unitario *"
                  :rules="[requerido('El precio'), numeroPositivo('El precio')]"
                  lazy-rules
                />
              </div>

              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="formulario.stock"
                  outlined
                  dense
                  type="number"
                  label="Stock Inicial *"
                  :rules="[requerido('El stock'), enteroPositivo('El stock')]"
                  lazy-rules
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="formulario.categoria"
                  outlined
                  dense
                  emit-value
                  map-options
                  label="Categoría *"
                  :options="opcionesCategoriasSelect"
                  :rules="[seleccionRequerida('una categoría')]"
                  lazy-rules
                >
                  <template #prepend>
                    <q-icon name="category" size="18px" />
                  </template>
                  <template #after>
                    <q-btn
                      v-if="auth.esAdmin"
                      round
                      dense
                      flat
                      color="primary"
                      icon="add"
                      @click="$refs.dialogoCategorias?.abrirCreacion?.()"
                    >
                      <q-tooltip>Crear nueva categoría</q-tooltip>
                    </q-btn>
                  </template>
                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-grey-7 text-caption">
                        No hay categorías creadas. Ve a la sección Categorías para crear una.
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-sm-6">
                <q-select
                  v-model="formulario.proveedorId"
                  outlined
                  dense
                  emit-value
                  map-options
                  label="Proveedor *"
                  :options="opcionesProveedoresSelect"
                  :rules="[seleccionRequerida('un proveedor')]"
                  lazy-rules
                >
                  <template #after>
                    <CrearProveedorRapido
                      v-model="dialogoProveedorRapido"
                      :titulo="'Crear Proveedor Rápido'"
                      :subtitulo="'Se creará y seleccionará automáticamente para este producto'"
                      @creado="onProveedorCreado"
                    />
                  </template>
                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-grey-7 text-caption">
                        No hay proveedores creados. Haz clic en '+' para crear uno rápido.
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </div>

            <q-input
              v-model="formulario.imagenUrl"
              outlined
              dense
              label="URL de Imagen (Opcional)"
              hint="https://ejemplo.com/imagen.jpg"
              :rules="[urlValida()]"
              lazy-rules
            />

            <q-input
              v-model="formulario.descripcion"
              outlined
              dense
              type="textarea"
              rows="2"
              label="Descripción del Producto (Opcional)"
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
              :label="esEdicion ? 'Guardar Cambios' : 'Registrar Producto'"
              :loading="guardando"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- ================= MODAL VISTA PREVIA DETALLE ================= -->
    <q-dialog v-model="dialogoDetalle">
      <q-card v-if="productoDetalle" class="dialog-card">
        <q-card-section class="bg-primary text-white row items-center justify-between q-pa-md">
          <div class="text-h6 text-weight-bold ellipsis">{{ productoDetalle.nombre }}</div>
          <q-btn v-close-popup flat round dense icon="close" color="white" />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div v-if="productoDetalle.imagenUrl" class="text-center q-mb-md">
            <img
              :src="productoDetalle.imagenUrl"
              alt="Imagen producto"
              style="max-height: 180px; max-width: 100%; object-fit: contain; border-radius: 8px"
            />
          </div>

          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <div class="data-label">SKU</div>
              <div class="data-value">{{ productoDetalle.sku }}</div>
            </div>
            <div class="col-6">
              <div class="data-label">Categoría</div>
              <div class="data-value text-capitalize">{{ productoDetalle.categoria }}</div>
            </div>
            <div class="col-6">
              <div class="data-label">Precio</div>
              <div class="data-value">{{ formatMoneda(productoDetalle.precio) }}</div>
            </div>
            <div class="col-6">
              <div class="data-label">Stock Actual</div>
              <div class="data-value">{{ productoDetalle.stock }} unidades</div>
            </div>
            <div class="col-12" v-if="productoDetalle.descripcion">
              <div class="data-label">Descripción</div>
              <div class="data-value text-body2 text-grey-8">{{ productoDetalle.descripcion }}</div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn v-close-popup flat no-caps label="Cerrar" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>