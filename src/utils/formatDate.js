/**
 * @fileoverview /utils/formatDate.js
 * Formateo de fechas y números para CatálogoBulk.
 */

/**
 * Convierte una fecha ISO en formato dd/mm/aaaa.
 * @param {string|Date} fecha
 * @returns {string}
 */
export function formatDate(fecha) {
  if (!fecha) return "-";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Convierte una fecha ISO en formato dd/mm/aaaa, hh:mm:ss.
 * @param {string|Date} fecha
 * @returns {string}
 */
export function formatDateTime(fecha) {
  if (!fecha) return "-";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Formatea precio en moneda colombiana o estándar ($ 123,450.00).
 * @param {number|string} valor
 * @returns {string}
 */
export function formatMoneda(valor) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return "$ 0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 2,
  }).format(Number(valor));
}

/**
 * Formatea bytes en formato legible (KB, MB, GB).
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
