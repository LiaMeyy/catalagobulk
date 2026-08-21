import { describe, it, expect } from "vitest";
import {
  decodificarJWT,
  esTokenExpirado,
  segundosRestantesToken,
  sanitizarTexto,
  esUrlConfiable,
} from "@/utils/security";

describe("Seguridad del Frontend: Módulo security.js", () => {
  // Helper para generar token JWT falso de prueba
  function generarTokenPrueba(payload) {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = btoa(JSON.stringify(payload));
    const sig = "fake_signature";
    return `${header}.${body}.${sig}`;
  }

  describe("1. Decodificación de JWT (decodificarJWT)", () => {
    it("debe decodificar correctamente un token válido", () => {
      const token = generarTokenPrueba({ sub: "user-123", rol: "admin", email: "admin@test.com" });
      const payload = decodificarJWT(token);

      expect(payload).not.toBeNull();
      expect(payload.sub).toBe("user-123");
      expect(payload.rol).toBe("admin");
      expect(payload.email).toBe("admin@test.com");
    });

    it("debe retornar null ante tokens vacíos o no válidos", () => {
      expect(decodificarJWT("")).toBeNull();
      expect(decodificarJWT(null)).toBeNull();
      expect(decodificarJWT("token_invalido_sin_puntos")).toBeNull();
    });
  });

  describe("2. Expiración de Token JWT (esTokenExpirado)", () => {
    it("debe retornar false si el token no ha expirado", () => {
      const expFuturo = Math.floor(Date.now() / 1000) + 3600; // 1 hora en el futuro
      const token = generarTokenPrueba({ exp: expFuturo, rol: "user" });

      expect(esTokenExpirado(token)).toBe(false);
      expect(segundosRestantesToken(token)).toBeGreaterThan(3500);
    });

    it("debe retornar true si el token ya expiró", () => {
      const expPasado = Math.floor(Date.now() / 1000) - 60; // 1 minuto en el pasado
      const token = generarTokenPrueba({ exp: expPasado, rol: "user" });

      expect(esTokenExpirado(token)).toBe(true);
      expect(segundosRestantesToken(token)).toBe(0);
    });

    it("debe retornar true si el token no tiene claim 'exp'", () => {
      const token = generarTokenPrueba({ sub: "sin_exp" });
      expect(esTokenExpirado(token)).toBe(true);
    });
  });

  describe("3. Sanitización de Entradas contra XSS (sanitizarTexto)", () => {
    it("debe sanitizar etiquetas script y caracteres HTML peligrosos", () => {
      const entradaPeligrosa = '<script>alert("XSS")</script>';
      const sanitizado = sanitizarTexto(entradaPeligrosa);

      expect(sanitizado).not.toContain("<script>");
      expect(sanitizado).toContain("&lt;script&gt;");
      expect(sanitizado).toContain("&quot;XSS&quot;");
    });

    it("debe respetar valores no string", () => {
      expect(sanitizarTexto(12345)).toBe(12345);
      expect(sanitizarTexto(null)).toBeNull();
    });
  });

  describe("4. Validación de Origen Seguro (esUrlConfiable)", () => {
    const apiBase = "http://localhost:3000/api";

    it("debe permitir rutas relativas", () => {
      expect(esUrlConfiable("/productos", apiBase)).toBe(true);
      expect(esUrlConfiable("/auth/login", apiBase)).toBe(true);
    });

    it("debe permitir URLs del mismo origen", () => {
      expect(esUrlConfiable("http://localhost:3000/api/productos", apiBase)).toBe(true);
    });

    it("debe bloquear URLs externas de orígenes diferentes", () => {
      expect(esUrlConfiable("https://sitio-malicioso.com/api/steal", apiBase)).toBe(false);
      expect(esUrlConfiable("http://localhost:4000/api", apiBase)).toBe(false);
    });
  });
});
