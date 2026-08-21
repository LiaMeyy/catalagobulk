/**
 * @fileoverview /plugins/axios.js
 * Instancia central de Axios con interceptores de seguridad, protección de token y normalización de respuestas.
 */
import axios from "axios";
import { router } from "@/router";
import { useAuthStore } from "@/store/Auth";
import { esUrlConfiable } from "@/utils/security";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

/**
 * INTERCEPTOR DE PETICION:
 * 1. Comprueba que el destino sea seguro (evita filtración de tokens a dominios externos).
 * 2. Verifica si el token ha expirado localmente antes de enviar la petición.
 * 3. Inyecta el encabezado Authorization: Bearer <token>.
 */
api.interceptors.request.use((config) => {
  const auth = useAuthStore();

  if (auth.token) {
    // Si el token ya expiró en el cliente, cerramos sesión de inmediato sin hacer llamadas innecesarias
    if (auth.tokenExpirado) {
      auth.cerrarSesion();
      if (router.currentRoute.value.name !== "login") {
        router.push({ name: "login" });
      }
      return Promise.reject({
        status: 401,
        codigo: "TOKEN_EXPIRADO",
        mensaje: "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
        errores: [],
      });
    }

    // Solo adjuntamos token si la URL pertenece a nuestro backend
    const urlDestino = config.url || "";
    if (esUrlConfiable(urlDestino, baseURL)) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    }
  }

  return config;
});

/**
 * Normaliza errores de validación de Mongoose a array de strings.
 * @param {string} mensaje - Mensaje de error de Mongoose
 * @returns {string[]}
 */
function normalizarErroresValidacion(mensaje) {
  if (!mensaje) return [];
  // Mongoose ValidationError: "Path `field` is required., Path `field2` must be at least..."
  return mensaje
    .split(",")
    .map((m) => m.trim())
    .filter((m) => m.length > 0);
}

/**
 * INTERCEPTOR DE RESPUESTA:
 * Normaliza y captura de forma unificada los códigos de error HTTP del backend Express.
 */
api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const data = error.response?.data;
    const status = error.response?.status ?? 0;

    let errores = [];
    let codigo = "";
    let mensaje = "";

    if (data?.error) {
      // Formato estándar del backend: { error: { codigo, mensaje } }
      codigo = data.error.codigo || "";
      mensaje = data.error.mensaje || "";

      // Si es error de validación de Mongoose, convertimos el mensaje a array
      if (codigo === "ERROR_VALIDACION" && typeof mensaje === "string") {
        errores = normalizarErroresValidacion(mensaje);
      } else if (Array.isArray(data.error.errors)) {
        // Backend ya envía array de errores
        errores = data.error.errors;
      }
    } else if (Array.isArray(data?.errors)) {
      // Formato alternativo: { errors: [...] }
      errores = data.errors;
      mensaje = data.msg || data.message || "Error de validación";
      codigo = data.codigo || "ERROR_VALIDACION";
    } else {
      // Fallback a detección por status code
      mensaje = mensajeSegunFallo(error);
    }

    const errorNormalizado = {
      status,
      codigo,
      mensaje: mensaje || "Ocurrió un error en la solicitud",
      errores,
    };

    // 401: Token inválido, revocado o expirado en el servidor
    if (status === 401) {
      const auth = useAuthStore();
      auth.cerrarSesion();
      if (router.currentRoute.value.name !== "login") {
        router.push({ name: "login" });
      }
    }

    return Promise.reject(errorNormalizado);
  }
);

function mensajeSegunFallo(error) {
  if (error.code === "ECONNABORTED") {
    return "El servidor tardó demasiado en responder (Tiempo de espera agotado).";
  }
  if (!error.response) {
    return "No hay conexión con el servidor backend. Verifica que la API esté corriendo en el puerto 3000.";
  }
  const status = error.response.status;
  if (status === 403) {
    return "Acceso denegado: Tu rol de usuario no tiene permisos suficientes para ejecutar esta acción.";
  }
  if (status === 404) {
    return "El recurso solicitado no fue encontrado en el servidor.";
  }
  if (status === 409) {
    return "Conflicto de integridad: El registro ya existe o se encuentra vinculado a otros datos.";
  }
  if (status === 429) {
    return "Has superado el límite de intentos permitidos (Rate Limit). Por favor espera un momento antes de volver a intentar.";
  }
  if (status >= 500) {
    return "Error interno del servidor backend. Por favor revisa los logs del sistema.";
  }
  return "Ocurrió un error inesperado al procesar la solicitud.";
}

export default api;
