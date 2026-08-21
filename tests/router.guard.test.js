import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAuthStore } from "@/store/Auth";
import { protegerRutas } from "@/router/index";

// Mock de Quasar Notify
vi.mock("quasar", () => ({
  Notify: {
    create: vi.fn(),
  },
  Quasar: {
    install: vi.fn(),
  },
}));

describe("Guardián de Rutas RBAC: protegerRutas", () => {
  function generarToken(payload) {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.signature`;
  }

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("debe permitir acceso a rutas públicas sin autenticación", () => {
    const rutaPublica = { meta: { requiereAuth: false } };
    const resultado = protegerRutas(rutaPublica);

    expect(resultado).toBe(true);
  });

  it("debe bloquear y redirigir al login si la ruta requiere auth y no hay sesión", () => {
    const rutaPrivada = { meta: { requiereAuth: true } };
    const resultado = protegerRutas(rutaPrivada);

    expect(resultado).toEqual({ name: "login" });
  });

  it("debe permitir acceso a rutas privadas si el usuario está autenticado", () => {
    const auth = useAuthStore();
    const token = generarToken({
      sub: "user-123",
      rol: "user",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    auth.guardarSesion({ token, email: "user@test.com" });

    const rutaPrivada = { meta: { requiereAuth: true } };
    const resultado = protegerRutas(rutaPrivada);

    expect(resultado).toBe(true);
  });

  it("debe bloquear a usuarios normales que intenten entrar a rutas requiereAdmin", () => {
    const auth = useAuthStore();
    const token = generarToken({
      sub: "user-123",
      rol: "user",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    auth.guardarSesion({ token, email: "user@test.com" });

    const rutaAdmin = { meta: { requiereAuth: true, requiereAdmin: true } };
    const resultado = protegerRutas(rutaAdmin);

    expect(resultado).toEqual({ name: "dashboard" });
  });

  it("debe permitir a un usuario admin acceder a rutas requiereAdmin", () => {
    const auth = useAuthStore();
    const token = generarToken({
      sub: "admin-123",
      rol: "admin",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    auth.guardarSesion({ token, email: "admin@test.com" });

    const rutaAdmin = { meta: { requiereAuth: true, requiereAdmin: true } };
    const resultado = protegerRutas(rutaAdmin);

    expect(resultado).toBe(true);
  });

  it("debe redirigir al dashboard si un usuario autenticado intenta abrir el login", () => {
    const auth = useAuthStore();
    const token = generarToken({
      sub: "user-123",
      rol: "user",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    auth.guardarSesion({ token, email: "user@test.com" });

    const rutaLogin = { meta: { soloInvitados: true } };
    const resultado = protegerRutas(rutaLogin);

    expect(resultado).toEqual({ name: "dashboard" });
  });
});
