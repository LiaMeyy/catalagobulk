import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime, formatMoneda, formatBytes } from "@/utils/formatDate";

describe("Utilidades de Formato: formatDate.js", () => {
  describe("formatDate", () => {
    it("debe formatear fechas ISO válidas", () => {
      const fecha = "2026-08-20T10:00:00.000Z";
      const formateada = formatDate(fecha);
      expect(formateada).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it("debe retornar '-' ante valores nulos o inválidos", () => {
      expect(formatDate(null)).toBe("-");
      expect(formatDate("fecha-invalida")).toBe("-");
    });
  });

  describe("formatMoneda", () => {
    it("debe formatear números a moneda con símbolo $", () => {
      const resultado = formatMoneda(15000);
      expect(resultado).toContain("$");
      expect(resultado).toMatch(/15/);
    });

    it("debe retornar '$ 0' ante valores nulos o no numéricos", () => {
      expect(formatMoneda(null)).toBe("$ 0");
      expect(formatMoneda("abc")).toBe("$ 0");
    });
  });

  describe("formatBytes", () => {
    it("debe convertir tamaños a unidades legibles", () => {
      expect(formatBytes(0)).toBe("0 Bytes");
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1048576)).toBe("1 MB");
      expect(formatBytes(5242880)).toBe("5 MB");
    });
  });
});
