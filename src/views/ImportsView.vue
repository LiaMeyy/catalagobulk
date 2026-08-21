<script setup>
/**
 * /views/ImportsView.vue
 * Carga Masiva Asíncrona (CSV / JSON) con monitoreo en tiempo real por WebSockets (Socket.io) y registro de errores.
 */
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import EncabezadoPagina from "@/components/Encabezados/EncabezadoPagina.vue";
import TablaDatos from "@/components/Tables/TablaDatos.vue";
import CrearProveedorRapido from "@/components/Modales/CrearProveedorRapido.vue";
import { get, upload } from "@/services/api.service";
import { useGeneralStore } from "@/store/General";
import { useAuthStore } from "@/store/Auth";
import { useNotificar } from "@/composables/useNotificar";
import { useSocket } from "@/composables/useSocket";
import { usePagination } from "@/composables/usePagination";
import { useProveedores } from "@/composables/useProveedores";
import { formatDateTime, formatBytes } from "@/utils/formatDate";
import { seleccionRequerida } from "@/utils/reglas";

const general = useGeneralStore();
const auth = useAuthStore();
const { notificarOk, notificarError, notificarInfo } = useNotificar();
const { socket, conectado, escucharProgresoImport, escucharCompletadoImport } = useSocket();

const {
  paginacion,
  rowsPerPageOpts,
  actualizarDesdeRequest,
  setTotal,
} = usePagination({ pageInicial: 1, rowsPerPageInicial: 10 });

const {
  proveedores,
  cargandoProveedores,
  opcionesProveedoresActivos,
  hayProveedores,
  hayProveedoresActivos,
  mapaProveedores,
  cargarProveedores,
} = useProveedores();

// --- Formulario de Subida ---
const archivoSeleccionado = ref(null);
const proveedorSeleccionado = ref(null);
const subiendo = ref(false);
const progresoSubida = ref(0);
const dragOver = ref(false);

// --- Trabajos Activos en Progreso (Tiempo Real) ---
const trabajosActivos = ref({});
const desuscriptores = ref([]);

// --- Historial de Importaciones ---
const columnas = [
  { name: "archivo", label: "Archivo", field: "archivoNombre", align: "left", sortable: true },
  { name: "proveedor", label: "Proveedor", field: "proveedorId", align: "left" },
  { name: "estado", label: "Estado", field: "estado", align: "center", sortable: true },
  { name: "total", label: "Total", field: "total", align: "right" },
  { name: "exitosos", label: "Exitosos", field: "exitosos", align: "right" },
  { name: "fallidos", label: "Fallidos", field: "fallidos", align: "right" },
  {
    name: "createdAt",
    label: "Fecha",
    field: "createdAt",
    align: "left",
    format: (val) => formatDateTime(val),
  },
  { name: "acciones", label: "Acciones", align: "right" },
];

const historialImports = ref([]);
const cargandoHistorial = ref(false);

// --- Carga Inicial ---
const cargarHistorial = async () => {
  cargandoHistorial.value = true;
  try {
    const params = new URLSearchParams();
    params.set("page", paginacion.value.page);
    params.set("limit", paginacion.value.rowsPerPage);

    const res = await get(`/imports?${params.toString()}`);
    historialImports.value = res.data || [];
    setTotal(res.total || 0);
    general.marcarSincronizacion();
  } catch (e) {
    notificarError(e);
  } finally {
    cargandoHistorial.value = false;
  }
};

// --- Manejo de Drag & Drop y Archivos ---
const onFileDrop = (e) => {
  dragOver.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    validarYAsignarArchivo(files[0]);
  }
};

const onFileChange = (e) => {
  const files = e.target?.files;
  if (files && files.length > 0) {
    validarYAsignarArchivo(files[0]);
  }
};

const validarYAsignarArchivo = (archivo) => {
  const extension = archivo.name.split(".").pop().toLowerCase();
  if (!["csv", "json"].includes(extension)) {
    notificarError("Solo se admiten archivos en formato .csv o .json");
    return;
  }
  archivoSeleccionado.value = archivo;
};

// --- Iniciar Importación Masiva ---
const iniciarImportacion = async () => {
  if (!auth.esAdmin) {
    notificarError("Solo los administradores pueden lanzar procesos de importación.");
    return;
  }
  if (!archivoSeleccionado.value) {
    notificarError("Por favor selecciona un archivo CSV o JSON.");
    return;
  }
  if (!proveedorSeleccionado.value) {
    notificarError("Debes seleccionar un proveedor para asociar los productos.");
    return;
  }

  subiendo.value = true;
  progresoSubida.value = 0;

  try {
    const formData = new FormData();
    formData.append("archivo", archivoSeleccionado.value);
    formData.append("proveedorId", proveedorSeleccionado.value);

    const respuesta = await upload("/imports", formData, (porcentaje) => {
      progresoSubida.value = porcentaje;
    });

    notificarOk(`Importación encolada (ID: ${respuesta.importJobId}). Procesando en segundo plano...`);

    const jobId = respuesta.importJobId;

    // Registramos en el panel de trabajos activos
    trabajosActivos.value[jobId] = {
      importJobId: jobId,
      archivoNombre: archivoSeleccionado.value.name,
      estado: "processing",
      procesados: 0,
      total: 0,
      porcentaje: 0,
      fallidos: 0,
      exitosos: 0,
    };

    // Suscripción WebSocket a eventos de este trabajo
    const desubProgreso = escucharProgresoImport(jobId, (data) => {
      if (trabajosActivos.value[jobId]) {
        const total = data.total || 1;
        const procesados = data.procesados || 0;
        const pct = Math.min(100, Math.round((procesados / total) * 100));

        trabajosActivos.value[jobId] = {
          ...trabajosActivos.value[jobId],
          ...data,
          porcentaje: pct,
        };
      }
    });

    const desubCompletado = escucharCompletadoImport(jobId, (resFinal) => {
      if (trabajosActivos.value[jobId]) {
        trabajosActivos.value[jobId].estado = "completed";
        trabajosActivos.value[jobId].porcentaje = 100;
        trabajosActivos.value[jobId].exitosos = resFinal.exitosos;
        trabajosActivos.value[jobId].fallidos = resFinal.fallidos;
      }
      notificarOk(`Importación completada: ${resFinal.exitosos || 0} exitosos, ${resFinal.fallidos || 0} con error.`);
      cargarHistorial();
    });

    if (desubProgreso) desuscriptores.value.push(desubProgreso);
    if (desubCompletado) desuscriptores.value.push(desubCompletado);

    // Limpiamos formulario
    archivoSeleccionado.value = null;
    await cargarHistorial();
  } catch (e) {
    notificarError(e);
  } finally {
    subiendo.value = false;
  }
};

// --- Modal Detalle de Errores de Importación ---
const dialogoDetalle = ref(false);
const cargandoDetalle = ref(false);
const jobDetalle = ref(null);

const verDetalleErrores = async (job) => {
  dialogoDetalle.value = true;
  cargandoDetalle.value = true;
  try {
    const data = await get(`/imports/${job._id || job.importJobId}`);
    jobDetalle.value = data;
  } catch (e) {
    notificarError(e);
  } finally {
    cargandoDetalle.value = false;
  }
};

// --- Proveedor Rápido ---
const dialogoProveedorRapido = ref(false);

const onProveedorCreado = (nuevoProv) => {
  proveedorSeleccionado.value = nuevoProv._id;
};

watch(() => opcionesProveedoresActivos.value.length, () => {
  if (opcionesProveedoresActivos.value.length > 0 && !proveedorSeleccionado.value) {
    proveedorSeleccionado.value = opcionesProveedoresActivos.value[0].value;
  }
});

onMounted(async () => {
  await Promise.all([cargarProveedores(), cargarHistorial()]);
});

onUnmounted(() => {
  for (const fn of desuscriptores.value) {
    if (typeof fn === "function") fn();
  }
});
</script>

<template>
  <q-page>
    <div class="contenedor-app">
      <EncabezadoPagina
        titulo="Carga Masiva de Catálogos"
        subtitulo="Ingesta asíncrona de archivos CSV y JSON con trazabilidad y progreso en tiempo real"
        icono="cloud_upload"
      >
      </EncabezadoPagina>

      <!-- Alerta si no hay proveedores registrados -->
      <q-banner
        v-if="!hayProveedoresActivos"
        dense
        class="bg-orange-1 text-orange-9 q-mb-lg rounded-borders"
      >
        <template #avatar>
          <q-icon name="warning_amber" />
        </template>
        No hay proveedores activos registrados. Para poder importar catálogos masivos, primero debes registrar al menos un proveedor.
        <template #action>
          <CrearProveedorRapido
            v-if="auth.esAdmin"
            v-model="dialogoProveedorRapido"
            :titulo="'Crear Proveedor Rápido'"
            :subtitulo="'Se creará y seleccionará automáticamente para la importación'"
            @creado="onProveedorCreado"
          />
          <q-btn
            flat
            dense
            no-caps
            label="Ir a Proveedores"
            :to="{ name: 'proveedores' }"
          />
        </template>
      </q-banner>

      <!-- Panel Superior: Zona de Carga y Selección -->
      <div class="row q-col-gutter-lg q-mb-xl">
        <!-- Formulario de Subida -->
        <div class="col-12 col-md-7">
          <q-card flat class="tarjeta full-height">
            <q-card-section>
              <div class="text-subtitle1 text-weight-bold q-mb-sm row items-center">
                <q-icon name="upload_file" color="primary" class="q-mr-xs" />
                Nueva Importación de Catálogo
              </div>

              <!-- Selector de Proveedor -->
              <div class="q-mb-md">
                <q-select
                  v-model="proveedorSeleccionado"
                  outlined
                  dense
                  emit-value
                  map-options
                  label="Asignar al Proveedor *"
                  :options="opcionesProveedoresActivos"
                  :rules="[seleccionRequerida('un proveedor')]"
                >
                  <template #prepend>
                    <q-icon name="local_shipping" color="primary" />
                  </template>
                  <template #after>
                    <CrearProveedorRapido
                      v-model="dialogoProveedorRapido"
                      :titulo="'Crear Proveedor Rápido'"
                      :subtitulo="'Se creará y seleccionará automáticamente para la importación'"
                      @creado="onProveedorCreado"
                    />
                  </template>
                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-grey-7 text-caption">
                        No hay proveedores activos disponibles.
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>

              <!-- Dropzone -->
              <div
                class="dropzone-import q-mb-md"
                :class="{ dragover: dragOver }"
                @dragover.prevent="dragOver = true"
                @dragleave.prevent="dragOver = false"
                @drop.prevent="onFileDrop"
                @click="$refs.fileInput.click()"
              >
                <input
                  ref="fileInput"
                  type="file"
                  accept=".csv, .json"
                  style="display: none"
                  @change="onFileChange"
                />

                <div v-if="archivoSeleccionado" class="column items-center">
                  <q-icon name="insert_drive_file" size="48px" color="primary" />
                  <div class="text-weight-bold text-dark q-mt-xs">
                    {{ archivoSeleccionado.name }}
                  </div>
                  <div class="text-caption text-grey-7">
                    Tamaño: {{ formatBytes(archivoSeleccionado.size) }}
                  </div>
                  <q-btn
                    flat
                    dense
                    no-caps
                    size="sm"
                    color="negative"
                    icon="cancel"
                    label="Cambiar archivo"
                    class="q-mt-sm"
                    @click.stop="archivoSeleccionado = null"
                  />
                </div>

                <div v-else class="column items-center text-grey-7">
                  <q-icon name="cloud_upload" size="54px" color="primary" />
                  <div class="text-weight-bold text-subtitle2 q-mt-xs">
                    Arrastra aquí tu archivo CSV o JSON
                  </div>
                  <div class="text-caption">
                    o haz clic para explorar tus archivos locales
                  </div>
                </div>
              </div>

              <!-- Barra de progreso de subida HTTP -->
              <div v-if="subiendo" class="q-mb-md">
                <div class="row justify-between text-caption text-grey-8 q-mb-xs">
                  <span>Enviando archivo al servidor...</span>
                  <strong>{{ progresoSubida }}%</strong>
                </div>
                <q-linear-progress :value="progresoSubida / 100" color="primary" rounded />
              </div>

              <q-btn
                unelevated
                no-caps
                color="primary"
                icon="send"
                label="Procesar e Iniciar Ingesta Masiva"
                class="full-width"
                size="md"
                :disable="!archivoSeleccionado || !proveedorSeleccionado || !auth.esAdmin"
                :loading="subiendo"
                @click="iniciarImportacion"
              />

              <div v-if="!auth.esAdmin" class="text-caption text-negative q-mt-xs text-center">
                * Solo los administradores pueden ejecutar cargas masivas.
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Panel de Estado en Vivo (WebSocket / BullMQ) -->
        <div class="col-12 col-md-5">
          <div class="section-box full-height">
            <div class="section-box__title justify-between">
              <div class="row items-center">
                <q-icon name="speed" size="18px" class="q-mr-sm" />
                <span>Monitor en Vivo (WebSockets)</span>
              </div>
              <q-badge
                :color="conectado ? 'positive' : 'grey-6'"
                :label="conectado ? 'Online' : 'Conectando...'"
              />
            </div>

            <div class="q-pa-md">
              <div v-if="Object.keys(trabajosActivos).length > 0" class="q-gutter-y-md">
                <q-card
                  v-for="job in Object.values(trabajosActivos)"
                  :key="job.importJobId"
                  flat
                  bordered
                  class="q-pa-sm bg-grey-1"
                >
                  <div class="row items-center justify-between no-wrap q-mb-xs">
                    <div class="text-weight-bold ellipsis text-caption">
                      {{ job.archivoNombre || job.importJobId }}
                    </div>
                    <q-badge
                      :color="job.estado === 'completed' ? 'positive' : 'primary'"
                      :label="job.estado.toUpperCase()"
                    />
                  </div>

                  <q-linear-progress
                    stripe
                    rounded
                    size="12px"
                    :value="(job.porcentaje || 0) / 100"
                    :color="job.estado === 'completed' ? 'positive' : 'primary'"
                    class="q-my-xs"
                  />

                  <div class="row justify-between text-caption text-grey-8">
                    <span>Procesados: {{ job.procesados || 0 }} / {{ job.total || '?' }}</span>
                    <span><strong>{{ job.porcentaje || 0 }}%</strong></span>
                  </div>

                  <div class="row justify-between text-caption q-mt-xs">
                    <span class="text-positive">✓ Exitosos: {{ job.exitosos || 0 }}</span>
                    <span class="text-negative">✗ Fallidos: {{ job.fallidos || 0 }}</span>
                  </div>
                </q-card>
              </div>

              <div v-else class="text-center q-py-lg text-grey-6">
                <q-icon name="sync" size="44px" class="q-mb-xs" />
                <div class="text-body2">No hay trabajos procesándose actualmente</div>
                <div class="text-caption text-grey-5">
                  Los trabajos iniciados mostrarán su barra de progreso y métricas aquí en tiempo real.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Historial de Importaciones -->
      <div class="text-subtitle1 text-weight-bold q-mb-sm row items-center">
        <q-icon name="history" color="primary" class="q-mr-xs" />
        Historial de Archivos Procesados
      </div>

      <TablaDatos
        :filas="historialImports"
        :columnas="columnas"
        :cargando="cargandoHistorial"
        :paginacion="paginacion"
        mensaje-vacio="No se han registrado importaciones masivas aún."
        @request="actualizarDesdeRequest"
        @update:pagination="actualizarDesdeRequest"
      >
        <!-- Slot Proveedor -->
        <template #body-cell-proveedor="celda">
          <q-td :props="celda">
            {{ mapaProveedores[celda.row.proveedorId] || celda.row.proveedorId }}
          </q-td>
        </template>

        <!-- Slot Estado -->
        <template #body-cell-estado="celda">
          <q-td :props="celda" class="text-center">
            <q-badge
              :color="
                celda.row.estado === 'completed'
                  ? 'positive'
                  : celda.row.estado === 'processing'
                  ? 'primary'
                  : celda.row.estado === 'failed'
                  ? 'negative'
                  : 'warning'
              "
              :label="celda.row.estado.toUpperCase()"
            />
          </q-td>
        </template>

        <!-- Slot Exitosos -->
        <template #body-cell-exitosos="celda">
          <q-td :props="celda" class="text-right text-positive text-weight-bold">
            {{ celda.row.exitosos ?? '-' }}
          </q-td>
        </template>

        <!-- Slot Fallidos -->
        <template #body-cell-fallidos="celda">
          <q-td :props="celda" class="text-right text-negative text-weight-bold">
            {{ celda.row.fallidos ?? '-' }}
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
              icon="search"
              color="primary"
              class="action-secondary"
              @click="verDetalleErrores(celda.row)"
            >
              <q-tooltip>Ver informe detallado / errores</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </TablaDatos>
    </div>

    <!-- ================= MODAL INFORME DETALLADO DE IMPORTACIÓN ================= -->
    <q-dialog v-model="dialogoDetalle">
      <q-card class="dialog-card-lg">
        <q-card-section class="bg-primary text-white row items-center justify-between q-pa-md">
          <div class="text-h6 text-weight-bold">
            Detalle de Importación: {{ jobDetalle?.archivoNombre || 'Cargando...' }}
          </div>
          <q-btn v-close-popup flat round dense icon="close" color="white" />
        </q-card-section>

        <q-card-section v-if="cargandoDetalle" class="text-center q-pa-xl">
          <q-spinner-dots size="48px" color="primary" />
        </q-card-section>

        <q-card-section v-else-if="jobDetalle" class="q-pa-md">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-sm-3">
              <div class="data-label">Estado</div>
              <div class="data-value">
                <q-badge
                  :color="jobDetalle.estado === 'completed' ? 'positive' : 'primary'"
                  :label="jobDetalle.estado"
                />
              </div>
            </div>
            <div class="col-12 col-sm-3">
              <div class="data-label">Total Filas</div>
              <div class="data-value">{{ jobDetalle.total ?? jobDetalle.procesados ?? 0 }}</div>
            </div>
            <div class="col-12 col-sm-3">
              <div class="data-label">Exitosos</div>
              <div class="data-value text-positive text-weight-bold">{{ jobDetalle.exitosos || 0 }}</div>
            </div>
            <div class="col-12 col-sm-3">
              <div class="data-label">Fallidos</div>
              <div class="data-value text-negative text-weight-bold">{{ jobDetalle.fallidos || 0 }}</div>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <!-- Lista de Errores -->
          <div class="text-subtitle2 text-weight-bold q-mb-sm">
            Registro de Filas con Error / Inconsistencias ({{ jobDetalle.errores?.length || 0 }})
          </div>

          <div v-if="jobDetalle.errores?.length" style="max-height: 280px; overflow-y: auto">
            <q-markup-table flat dense bordered separator="cell">
              <thead class="bg-grey-2">
                <tr>
                  <th class="text-left" style="width: 80px">Fila</th>
                  <th class="text-left" style="width: 140px">SKU</th>
                  <th class="text-left">Motivo del Fallo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(err, idx) in jobDetalle.errores" :key="idx">
                  <td class="text-left">#{{ err.fila }}</td>
                  <td class="text-left font-mono">{{ err.sku || 'N/A' }}</td>
                  <td class="text-left text-negative">{{ err.motivo }}</td>
                </tr>
              </tbody>
            </q-markup-table>
          </div>

          <div v-else class="text-center q-py-md text-positive bg-green-1 rounded-borders">
            <q-icon name="check_circle" size="24px" class="q-mr-xs" />
            No se presentaron errores en el procesamiento de este archivo.
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md bg-grey-1">
          <q-btn v-close-popup flat no-caps label="Cerrar" color="dark" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped lang="scss">
.font-mono {
  font-family: monospace;
}
</style>