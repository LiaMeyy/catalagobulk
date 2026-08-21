/**
 * @fileoverview /utils/slug.js
 * Generación y validación de slugs para identificadores URL-friendly.
 */

/**
 * Genera un slug a partir de un texto.
 * @param {string} texto
 * @returns {string}
 */
export function generarSlug(texto) {
  if (!texto || typeof texto !== "string") return "";
  return texto
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Valida que un string sea un slug válido (solo minúsculas, números, guiones).
 * @param {string} slug
 * @returns {boolean}
 */
export function esSlugValido(slug) {
  if (!slug || typeof slug !== "string") return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/**
 * Regla de validación para Quasar q-input.
 * @param {string} [mensaje="El slug no es válido"]
 * @returns {Function}
 */
export function slugValido(mensaje = "El slug no es válido (solo minúsculas, números y guiones)") {
  return (valor) => {
    if (!valor) return true;
    return esSlugValido(valor) || mensaje;
  };
}