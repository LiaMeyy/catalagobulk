/**
 * @fileoverview /utils/reglas.js
 * Reglas de validación para formularios de Quasar (:rules).
 */
import { validateEmail } from "./validateEmail";
import { esSlugValido } from "./slug";

export const requerido =
  (campo = "Este campo") =>
  (v) =>
    (v !== null && v !== undefined && String(v).trim() !== "") ||
    `${campo} es obligatorio`;

export const esEmail = () => (v) =>
  validateEmail(v) || "El correo electrónico no es válido";

export const minimo =
  (min, campo = "Este campo") =>
  (v) =>
    String(v ?? "").trim().length >= min ||
    `${campo} debe tener al menos ${min} caracteres`;

export const maximo =
  (max, campo = "Este campo") =>
  (v) =>
    String(v ?? "").trim().length <= max ||
    `${campo} no puede superar los ${max} caracteres`;

export const soloNumeros = () => (v) =>
  /^\d+$/.test(String(v ?? "").trim()) || "Solo se permiten dígitos numéricos";

export const numeroPositivo =
  (campo = "El valor") =>
  (v) => {
    const n = Number(v);
    return (!Number.isNaN(n) && n >= 0) || `${campo} debe ser un número mayor o igual a 0`;
  };

export const enteroMayorA =
  (min, campo = "El valor") =>
  (v) => {
    const n = Number(v);
    return (
      (Number.isInteger(n) && n > min) ||
      `${campo} debe ser un número entero mayor a ${min}`
    );
  };

export const enteroPositivo =
  (campo = "El valor") =>
  (v) => {
    const n = Number(v);
    return (
      (Number.isInteger(n) && n >= 0) ||
      `${campo} debe ser un número entero mayor o igual a 0`
    );
  };

export const seleccionRequerida =
  (campo = "Este campo") =>
  (v) =>
    (v !== null && v !== undefined && v !== "") || `Debe seleccionar ${campo}`;

export const igualA =
  (obtenerEsperado, mensaje = "Los valores no coinciden") =>
  (v) =>
    v === obtenerEsperado() || mensaje;

export const slugValido = () => (v) =>
  esSlugValido(String(v ?? "").trim()) ||
  "El slug solo puede contener letras minúsculas, números y guiones (ej: acme-corp)";

export const urlValida = () => (v) => {
  if (!v || String(v).trim() === "") return true; // campo opcional
  return /^https?:\/\/.+/.test(String(v).trim()) || "Debe ser una URL válida (ej: https://ejemplo.com)";
};
