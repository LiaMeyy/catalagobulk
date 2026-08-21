/**
 * @fileoverview /composables/useProveedores.js
 * Composable para gestión cacheada de proveedores y categorías.
 */
import { ref, computed } from "vue";
import { get, post } from "@/services/api.service";
import { useNotificar } from "@/composables/useNotificar";

const proveedoresCache = ref([]);
const categoriasCache = ref([]);
const proveedoresLoading = ref(false);
const categoriasLoading = ref(false);
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function cacheValido() {
  return Date.now() - cacheTimestamp < CACHE_TTL && proveedoresCache.value.length > 0;
}

export function useProveedores() {
  const { notificarError } = useNotificar();

  const mapaProveedores = computed(() => {
    const mapa = {};
    for (const p of proveedoresCache.value) {
      mapa[p._id] = p.nombre;
    }
    return mapa;
  });

  const opcionesProveedoresSelect = computed(() =>
    proveedoresCache.value.map((p) => ({ label: p.nombre, value: p._id }))
  );

  const opcionesProveedoresActivos = computed(() =>
    proveedoresCache.value
      .filter((p) => p.activo)
      .map((p) => ({ label: p.nombre, value: p._id }))
  );

  const hayProveedores = computed(() => opcionesProveedoresSelect.value.length > 0);

  const hayProveedoresActivos = computed(() => opcionesProveedoresActivos.value.length > 0);

  const opcionesCategoriasSelect = computed(() =>
    categoriasCache.value.map((c) => ({
      label: c.nombre,
      value: c.slug || c.nombre.toLowerCase(),
    }))
  );

  async function cargarProveedores(forzar = false) {
    if (!forzar && cacheValido()) return proveedoresCache.value;

    proveedoresLoading.value = true;
    try {
      const res = await get("/proveedores?limit=200");
      proveedoresCache.value = res.data || [];
      cacheTimestamp = Date.now();
      return proveedoresCache.value;
    } catch (e) {
      notificarError(e);
      return [];
    } finally {
      proveedoresLoading.value = false;
    }
  }

  async function cargarCategorias(forzar = false) {
    if (!forzar && categoriasCache.value.length > 0) return categoriasCache.value;

    categoriasLoading.value = true;
    try {
      const res = await get("/categorias");
      categoriasCache.value = res || [];
      return categoriasCache.value;
    } catch (e) {
      notificarError(e);
      return [];
    } finally {
      categoriasLoading.value = false;
    }
  }

  async function cargarTodo(forzar = false) {
    await Promise.all([cargarProveedores(forzar), cargarCategorias(forzar)]);
  }

  function invalidarCache() {
    proveedoresCache.value = [];
    categoriasCache.value = [];
    cacheTimestamp = 0;
  }

  async function crearProveedorRapido(datos) {
    const nuevo = await post("/proveedores", {
      nombre: datos.nombre.trim(),
      slug: datos.slug.trim().toLowerCase(),
      contactoEmail: datos.contactoEmail?.trim() || null,
      activo: true,
    });
    invalidarCache();
    await cargarProveedores(true);
    return nuevo;
  }

  return {
    proveedores: proveedoresCache,
    categorias: categoriasCache,
    cargandoProveedores: proveedoresLoading,
    cargandoCategorias: categoriasLoading,
    mapaProveedores,
    opcionesProveedoresSelect,
    opcionesProveedoresActivos,
    opcionesCategoriasSelect,
    hayProveedores,
    hayProveedoresActivos,
    cargarProveedores,
    cargarCategorias,
    cargarTodo,
    invalidarCache,
    crearProveedorRapido,
  };
}