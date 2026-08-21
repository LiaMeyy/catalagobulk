/**
 * @fileoverview /utils/security.js
 * Módulo de utilidades de seguridad para el frontend:
 * - Decodificación segura de JWT y validación de expiración (exp).
 * - Sanitización de entradas contra XSS (Cross-Site Scripting).
 * - Verificación de URLs seguras y orígenes confiables.
 */

/**
 * Decodifica de forma segura la carga útil (payload) de un token JWT.
 * @param {string} token - Token JWT en formato "header.payload.signature"
 * @returns {Object|null} Payload decodificado o null si el token es inválido.
 */
export function decodificarJWT(token) {
  if (!token || typeof token !== "string") return null;

  const partes = token.split(".");
  if (partes.length !== 3) return null;

  try {
    const base64Url = partes[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Verifica si un token JWT ya expiró según el claim 'exp'.
 * @param {string} token
 * @returns {boolean} true si está expirado o es inválido
 */
export function esTokenExpirado(token) {
  const payload = decodificarJWT(token);
  if (!payload || !payload.exp) return true;

  const tiempoActual = Math.floor(Date.now() / 1000);
  // Margen de seguridad de 5 segundos
  return payload.exp <= tiempoActual + 5;
}

/**
 * Obtiene el tiempo restante de validez del token en segundos.
 * @param {string} token
 * @returns {number} Segundos restantes (0 si expiró)
 */
export function segundosRestantesToken(token) {
  const payload = decodificarJWT(token);
  if (!payload || !payload.exp) return 0;

  const ahora = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - ahora);
}

/**
 * Sanitiza texto simple contra inyección de HTML / scripts XSS.
 * @param {string} input
 * @returns {string}
 */
export function sanitizarTexto(input) {
  if (typeof input !== "string") return input;
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Valida si una URL pertenece al origen permitido o es relativa.
 * Previene que el token de autorización se filtre a dominios no confiables.
 * @param {string} url - URL de la petición
 * @param {string} apiBaseUrl - URL base del backend configurada
 * @returns {boolean}
 */
export function esUrlConfiable(url, apiBaseUrl) {
  if (!url) return false;
  // Rutas relativas son seguras
  if (url.startsWith("/") || !url.startsWith("http")) return true;

  try {
    const urlDestino = new URL(url);
    const urlBase = new URL(apiBaseUrl);
    return urlDestino.origin === urlBase.origin;
  } catch {
    return false;
  }
}
