import { describe, it, expect } from "vitest";
import {
  requerido,
  esEmail,
  minimo,
  maximo,
  soloNumeros,
  numeroPositivo,
  enteroPositivo,
  slugValido,
  urlValida,
  seleccionRequerida,
} from "@/utils/reglas";

describe("Validaciones de Formularios: reglas.js", () => {
  describe("requerido", () => {
    const regla = requerido("El campo");
    it("debe validar valores no vacíos", () => {
      expect(regla("Texto válido")).toBe(true);
      expect(regla(123)).toBe(true);
    });
    it("debe fallar ante valores vacíos o nulos", () => {
      expect(typeof regla("")).toBe("string");
      expect(typeof regla("   ")).toBe("string");
      expect(typeof regla(null)).toBe("string");
      expect(typeof regla(undefined)).toBe("string");
    });
  });

  describe("esEmail", () => {
    const regla = esEmail();
    it("debe aceptar correos válidos", () => {
      expect(regla("usuario@sena.edu.co")).toBe(true);
      expect(regla("admin@catalogobulk.com")).toBe(true);
      expect(regla("test.user+tag@domain.co")).toBe(true);
    });
    it("debe rechazar correos inválidos", () => {
      expect(typeof regla("invalido")).toBe("string");
      expect(typeof regla("usuario@")).toBe("string");
      expect(typeof regla("@dominio.com")).toBe("string");
      expect(typeof regla("usuario@dominio")).toBe("string");
    });
  });

  describe("slugValido", () => {
    const regla = slugValido();
    it("debe aceptar slugs en minúsculas y con guiones", () => {
      expect(regla("acme-corp")).toBe(true);
      expect(regla("proveedor-123")).toBe(true);
      expect(regla("distribuciones-norte-sur")).toBe(true);
    });
    it("debe rechazar mayúsculas, espacios y caracteres especiales", () => {
      expect(typeof regla("Acme-Corp")).toBe("string");
      expect(typeof regla("acme corp")).toBe("string");
      expect(typeof regla("acme_corp")).toBe("string");
      expect(typeof regla("acme-corp!")).toBe("string");
    });
  });

  describe("numeroPositivo y enteroPositivo", () => {
    const reglaNum = numeroPositivo("El precio");
    const reglaInt = enteroPositivo("El stock");

    it("debe validar números positivos y decimales", () => {
      expect(reglaNum(0)).toBe(true);
      expect(reglaNum(19.99)).toBe(true);
      expect(reglaNum("50.5")).toBe(true);
    });

    it("debe rechazar números negativos o NaN", () => {
      expect(typeof reglaNum(-5)).toBe("string");
      expect(typeof reglaNum("abc")).toBe("string");
    });

    it("debe exigir enteros en enteroPositivo", () => {
      expect(reglaInt(10)).toBe(true);
      expect(reglaInt(0)).toBe(true);
      expect(typeof reglaInt(10.5)).toBe("string");
      expect(typeof reglaInt(-1)).toBe("string");
    });
  });

  describe("urlValida", () => {
    const regla = urlValida();
    it("debe aceptar URLs http y https válidas", () => {
      expect(regla("https://ejemplo.com/logo.png")).toBe(true);
      expect(regla("http://cdn.demo.org/img.jpg")).toBe(true);
      expect(regla("")).toBe(true); // Opcional
    });
    it("debe rechazar URLs sin protocolo válido", () => {
      expect(typeof regla("url-invalida")).toBe("string");
      expect(typeof regla("ftp://servidor.com")).toBe("string");
    });
  });
});
