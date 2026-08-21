/**
 * @fileoverview /store/General.js
 * Store global de interfaz y estado del sistema (salud del backend, socket, sincronización).
 */
import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { get } from "@/services/api.service";

export const useGeneralStore = defineStore("general", () => {
  // --- State ---
  const titulo = ref(import.meta.env.VITE_APP_TITULO || "CatálogoBulk");
  const menuAbierto = ref(false);
  const ultimaSincronizacion = ref(null);
  const saludServidor = ref({ status: "desconocido", mongo: "down", redis: "down" });
  const verificandoSalud = ref(false);

  // Cache para estadísticas de productos
  const statsCache = ref(null);
  let statsCacheTimestamp = 0;
  const STATS_CACHE_TTL = 2 * 60 * 1000; // 2 minutos

  // --- Getters ---
  const urlApi = computed(() => import.meta.env.VITE_API_URL || "http://localhost:3000/api");
  const urlSocket = computed(() => import.meta.env.VITE_SOCKET_URL || "http://localhost:3000");
  const backendOnline = computed(
    () => saludServidor.value.status === "ok" && saludServidor.value.mongo === "up"
  );

  // --- Actions ---
  function alternarMenu() {
    menuAbierto.value = !menuAbierto.value;
  }

  function marcarSincronizacion() {
    ultimaSincronizacion.value = new Date();
  }

  function statsCacheValido() {
    return statsCache.value && Date.now() - statsCacheTimestamp < STATS_CACHE_TTL;
  }

  /**
   * Obtiene estadísticas del catálogo con caché
   * @param {boolean} forzar - Forzar recarga ignorando caché
   */
  async function obtenerStats(forzar = false) {
    if (!forzar && statsCacheValido()) {
      return statsCache.value;
    }

    try {
      const data = await get("/productos/stats");
      statsCache.value = data;
      statsCacheTimestamp = Date.now();
      return data;
    } catch (e) {
      console.error("Error al obtener stats:", e);
      return null;
    }
  }

  function invalidarStatsCache() {
    statsCache.value = null;
    statsCacheTimestamp = 0;
  }

  /**
   * Consulta el endpoint GET /health para verificar el estado de Node, Mongo y Redis
   */
  async function verificarSalud() {
    verificandoSalud.value = true;
    try {
      // /health está en la raíz del backend, fuera del prefijo /api.
      const apiOrigin = urlApi.value.replace(/\/api\/?$/, "");
      const response = await fetch(`${apiOrigin}/health`);
      if (!response.ok) throw new Error("Health check failed");
      const data = await response.json();
      saludServidor.value = data;
    } catch {
      saludServidor.value = { status: "error", mongo: "down", redis: "down" };
    } finally {
      verificandoSalud.value = false;
    }
  }

  return {
    titulo,
    menuAbierto,
    ultimaSincronizacion,
    saludServidor,
    verificandoSalud,
    urlApi,
    urlSocket,
    backendOnline,
    alternarMenu,
    marcarSincronizacion,
    verificarSalud,
    obtenerStats,
    invalidarStatsCache,
  };
});