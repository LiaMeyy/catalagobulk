/**
 * @fileoverview /services/api.service.js
 * Funciones reutilizables de comunicación HTTP (get, post, put, del, upload).
 */
import api from "@/plugins/axios";

/**
 * Petición GET
 * @param {string} url - Ej: "/productos?page=1&limit=20"
 * @param {Object} [config]
 * @returns {Promise<any>}
 */
export const get = async (url, config = {}) => {
  const { data } = await api.get(url, config);
  return data;
};

/**
 * Petición POST
 * @param {string} url - Ej: "/productos"
 * @param {Object} datos
 * @param {Object} [config]
 * @returns {Promise<any>}
 */
export const post = async (url, datos, config = {}) => {
  const { data } = await api.post(url, datos, config);
  return data;
};

/**
 * Petición PUT
 * @param {string} url - Ej: "/productos/123"
 * @param {Object} [datos]
 * @param {Object} [config]
 * @returns {Promise<any>}
 */
export const put = async (url, datos = {}, config = {}) => {
  const { data } = await api.put(url, datos, config);
  return data;
};

/**
 * Petición DELETE
 * @param {string} url - Ej: "/productos/123"
 * @param {Object} [config]
 * @returns {Promise<any>}
 */
export const del = async (url, config = {}) => {
  const { data } = await api.delete(url, config);
  return data;
};

/**
 * Subida de archivos multipart/form-data (Carga masiva CSV / JSON)
 * @param {string} url - Ej: "/imports"
 * @param {FormData} formData
 * @param {(progreso: number) => void} [onProgreso]
 * @returns {Promise<any>}
 */
export const upload = async (url, formData, onProgreso) => {
  const { data } = await api.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (onProgreso && progressEvent.total) {
        const porcentaje = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgreso(porcentaje);
      }
    },
  });
  return data;
};
