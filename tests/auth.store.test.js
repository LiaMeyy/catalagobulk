import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAuthStore } from "@/store/Auth";

describe("Store de Autenticación: Auth.js", () => {
  function generarToken(payload) {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.signature`;
  }

  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("debe inicializarse en estado no autenticado", () => {
    const auth = useAuthStore();
    expect(auth.token).toBeNull();
    expect(auth.usuario).toBeNull();
    expect(auth.estaAutenticado).toBe(false);
    expect(auth.esAdmin).toBe(false);
    expect(auth.nombreUsuario).toBe("Usuario");
  });

  it("debe guardar sesión correctamente para un usuario admin", () => {
    const auth = useAuthStore();
    const token = generarToken({
      sub: "admin-id-123",
      rol: "admin",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    auth.guardarSesion({ token, email: "admin@test.com" });

    expect(auth.estaAutenticado).toBe(true);
    expect(auth.esAdmin).toBe(true);
    expect(auth.rolUsuario).toBe("admin");
    expect(auth.usuario.id).toBe("admin-id-123");
    expect(auth.nombreUsuario).toBe("admin@test.com");
  });

  it("debe guardar sesión para un usuario estándar (no admin)", () => {
    const auth = useAuthStore();
    const token = generarToken({
      sub: "user-id-456",
      rol: "user",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    auth.guardarSesion({ token, email: "user@test.com" });

    expect(auth.estaAutenticado).toBe(true);
    expect(auth.esAdmin).toBe(false);
    expect(auth.rolUsuario).toBe("user");
  });

  it("debe marcar estaAutenticado como false si el token está expirado", () => {
    const auth = useAuthStore();
    const tokenExpirado = generarToken({
      sub: "user-id-789",
      rol: "admin",
      exp: Math.floor(Date.now() / 1000) - 100, // expirado
    });

    auth.guardarSesion({ token: tokenExpirado, email: "expirado@test.com" });

    expect(auth.estaAutenticado).toBe(false);
    expect(auth.esAdmin).toBe(false);
    expect(auth.tokenExpirado).toBe(true);
  });

  it("debe limpiar todo el estado al cerrar sesión", () => {
    const auth = useAuthStore();
    const token = generarToken({
      sub: "user-id-123",
      rol: "admin",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    auth.guardarSesion({ token, email: "admin@test.com" });
    expect(auth.estaAutenticado).toBe(true);

    auth.cerrarSesion();
    expect(auth.token).toBeNull();
    expect(auth.usuario).toBeNull();
    expect(auth.estaAutenticado).toBe(false);
  });
});
