/**
 * @fileoverview /store/Auth.js
 * Store de autenticación y permisos con Pinia, validación de integridad JWT y persistencia.
 */
import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { decodificarJWT, esTokenExpirado, segundosRestantesToken } from "@/utils/security";

export const useAuthStore = defineStore(
  "auth",
  () => {
    // --- State ---
    const token = ref(null);
    const usuario = ref(null); // { id, email, rol }

    // --- Getters ---
    /**
     * Comprueba si hay una sesión activa y el token aún no ha expirado
     */
    const estaAutenticado = computed(() => {
      if (!token.value) return false;
      return !esTokenExpirado(token.value);
    });

    /**
     * Verifica si el usuario actual tiene rol de Administrador
     */
    const esAdmin = computed(() => {
      if (!estaAutenticado.value) return false;
      return usuario.value?.rol === "admin";
    });

    const rolUsuario = computed(() => usuario.value?.rol || "user");
    const nombreUsuario = computed(() => usuario.value?.email || "Usuario");

    const tokenExpirado = computed(() => {
      if (!token.value) return true;
      return esTokenExpirado(token.value);
    });

    const tiempoRestanteSegundos = computed(() => {
      if (!token.value) return 0;
      return segundosRestantesToken(token.value);
    });

    // --- Actions ---
    /**
     * Guarda la sesión recibida tras un login exitoso.
     * @param {{ token: string, email?: string }} datos
     */
    function guardarSesion({ token: nuevoToken, email = "" }) {
      if (!nuevoToken) return;

      const payload = decodificarJWT(nuevoToken);
      if (!payload) {
        throw new Error("El token recibido tiene un formato inválido");
      }

      token.value = nuevoToken;
      usuario.value = {
        id: payload.sub || null,
        rol: payload.rol || "user",
        email: email || payload.email || "usuario@catalogobulk.com",
      };
    }

    /**
     * Actualiza datos parciales del usuario (ej: email o rol)
     */
    function actualizarUsuario(datos) {
      if (usuario.value) {
        usuario.value = { ...usuario.value, ...datos };
      }
    }

    /**
     * Cierra la sesión activa y limpia todo el estado
     */
    function cerrarSesion() {
      token.value = null;
      usuario.value = null;
    }

    return {
      token,
      usuario,
      estaAutenticado,
      esAdmin,
      rolUsuario,
      nombreUsuario,
      tokenExpirado,
      tiempoRestanteSegundos,
      guardarSesion,
      actualizarUsuario,
      cerrarSesion,
    };
  },
  {
    persist: true,
  }
);
