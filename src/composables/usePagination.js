/**
 * @fileoverview /composables/usePagination.js
 * Composable reutilizable para manejo de paginación con Quasar QTable.
 */
import { ref, computed } from "vue";

export function usePagination(opciones = {}) {
  const {
    pageInicial = 1,
    rowsPerPageInicial = 20,
    rowsPerPageOptions = [10, 15, 20, 25, 50, 100, 0],
  } = opciones;

  const paginacion = ref({
    page: pageInicial,
    rowsPerPage: rowsPerPageInicial,
    rowsNumber: 0,
    sortBy: "",
    descending: false,
  });

  const rowsPerPageOpts = computed(() => rowsPerPageOptions);

  function actualizarDesdeRequest(requestProp) {
    if (!requestProp?.pagination) return;
    paginacion.value.page = requestProp.pagination.page;
    paginacion.value.rowsPerPage = requestProp.pagination.rowsPerPage;
    paginacion.value.sortBy = requestProp.pagination.sortBy || "";
    paginacion.value.descending = requestProp.pagination.descending || false;
  }

  function actualizarDesdeValor(val) {
    if (!val) return;
    paginacion.value.page = val.page ?? paginacion.value.page;
    paginacion.value.rowsPerPage = val.rowsPerPage ?? paginacion.value.rowsPerPage;
    paginacion.value.rowsNumber = val.rowsNumber ?? paginacion.value.rowsNumber;
    paginacion.value.sortBy = val.sortBy ?? paginacion.value.sortBy;
    paginacion.value.descending = val.descending ?? paginacion.value.descending;
  }

  function resetear(page = 1) {
    paginacion.value.page = page;
    paginacion.value.rowsNumber = 0;
  }

  function setTotal(total) {
    paginacion.value.rowsNumber = total;
  }

  function setPage(page) {
    paginacion.value.page = page;
  }

  function setRowsPerPage(rows) {
    paginacion.value.rowsPerPage = rows;
    paginacion.value.page = 1;
  }

  const paramsPaginacion = computed(() => {
    const params = new URLSearchParams();
    params.set("page", paginacion.value.page);
    params.set("limit", paginacion.value.rowsPerPage);
    if (paginacion.value.sortBy) {
      params.set("sortBy", paginacion.value.sortBy);
      params.set("descending", String(paginacion.value.descending));
    }
    return params.toString();
  });

  return {
    paginacion,
    rowsPerPageOpts,
    actualizarDesdeRequest,
    actualizarDesdeValor,
    resetear,
    setTotal,
    setPage,
    setRowsPerPage,
    paramsPaginacion,
  };
}