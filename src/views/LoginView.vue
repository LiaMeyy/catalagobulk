<script setup>
/**
 * /views/LoginView.vue
 * Pantalla de inicio de sesión y acceso al sistema CatálogoBulk.
 */
import { ref } from "vue";
import { useRouter } from "vue-router";

import { post } from "@/services/api.service";
import { useAuthStore } from "@/store/Auth";
import { useGeneralStore } from "@/store/General";
import { useNotificar } from "@/composables/useNotificar";
import { requerido, esEmail, minimo } from "@/utils/reglas";
import logo from "@/assets/logo.svg";

const router = useRouter();
const auth = useAuthStore();
const general = useGeneralStore();
const { notificarOk, notificarError } = useNotificar();

const tab = ref("login");
const formularioLogin = ref({ email: "", password: "" });
const formularioRegister = ref({ email: "", password: "", rol: "user" });

const verPassword = ref(false);
const enviando = ref(false);

const iniciarSesion = async () => {
  enviando.value = true;
  try {
    const respuesta = await post("/auth/login", {
      email: formularioLogin.value.email.trim(),
      password: formularioLogin.value.password,
    });

    auth.guardarSesion({
      token: respuesta.token,
      email: formularioLogin.value.email.trim(),
    });

    notificarOk(`Bienvenido a CatálogoBulk (${auth.rolUsuario.toUpperCase()})`);
    router.push({ name: "dashboard" });
  } catch (e) {
    notificarError(e);
  } finally {
    enviando.value = false;
  }
};

const registrarse = async () => {
  enviando.value = true;
  try {
    const respuesta = await post("/auth/register", {
      email: formularioRegister.value.email.trim(),
      password: formularioRegister.value.password,
      rol: formularioRegister.value.rol,
    });

    notificarOk(`Usuario ${respuesta.email} registrado exitosamente con rol ${respuesta.rol}.`);

    // Iniciamos sesión automáticamente
    formularioLogin.value.email = formularioRegister.value.email;
    formularioLogin.value.password = formularioRegister.value.password;
    tab.value = "login";
    await iniciarSesion();
  } catch (e) {
    notificarError(e);
  } finally {
    enviando.value = false;
  }
};

const llenarDemo = (email, pass) => {
  formularioLogin.value.email = email;
  formularioLogin.value.password = pass;
};
</script>

<template>
  <div class="window-height flex flex-center q-pa-md bg-grey-1">
    <div class="columna-login">
      <q-card flat class="tarjeta shadow-2">
        <q-card-section class="text-center q-pb-none q-pt-lg">
          <img :src="logo" alt="Logo" width="64" height="64" class="q-mb-xs" />
          <div class="text-h5 text-weight-bold text-green-9">
            {{ general.titulo }}
          </div>
          <p class="texto-suave text-body2 q-mt-xs">
            Ingesta Masiva y Gestión Centralizada de Catálogos
          </p>
        </q-card-section>

        <q-tabs
          v-model="tab"
          dense
          class="text-grey-7"
          active-color="primary"
          indicator-color="primary"
          align="justify"
        >
          <q-tab name="login" label="Iniciar Sesión" icon="login" no-caps />
          <q-tab name="registro" label="Crear Cuenta" icon="person_add" no-caps />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <!-- Panel Iniciar Sesión -->
          <q-tab-panel name="login" class="q-pa-md">
            <q-form greedy @submit="iniciarSesion">
              <div class="q-gutter-md">
                <q-input
                  v-model="formularioLogin.email"
                  outlined
                  dense
                  type="email"
                  label="Correo Electrónico *"
                  autocomplete="email"
                  autofocus
                  :rules="[requerido('El correo'), esEmail()]"
                  lazy-rules
                >
                  <template #prepend>
                    <q-icon name="mail" color="primary" />
                  </template>
                </q-input>

                <q-input
                  v-model="formularioLogin.password"
                  outlined
                  dense
                  label="Contraseña *"
                  autocomplete="current-password"
                  :type="verPassword ? 'text' : 'password'"
                  :rules="[requerido('La contraseña'), minimo(6, 'La contraseña')]"
                  lazy-rules
                >
                  <template #prepend>
                    <q-icon name="lock" color="primary" />
                  </template>
                  <template #append>
                    <q-icon
                      :name="verPassword ? 'visibility_off' : 'visibility'"
                      class="cursor-pointer"
                      @click="verPassword = !verPassword"
                    />
                  </template>
                </q-input>
              </div>

              <div class="q-mt-lg">
                <q-btn
                  unelevated
                  no-caps
                  type="submit"
                  color="primary"
                  class="full-width"
                  size="md"
                  label="Entrar a CatálogoBulk"
                  :loading="enviando"
                />
              </div>
            </q-form>
          </q-tab-panel>

          <!-- Panel Registro Rápido -->
          <q-tab-panel name="registro" class="q-pa-md">
            <q-form greedy @submit="registrarse">
              <div class="q-gutter-md">
                <q-input
                  v-model="formularioRegister.email"
                  outlined
                  dense
                  type="email"
                  label="Correo Electrónico *"
                  :rules="[requerido('El correo'), esEmail()]"
                  lazy-rules
                >
                  <template #prepend>
                    <q-icon name="mail" color="primary" />
                  </template>
                </q-input>

                <q-input
                  v-model="formularioRegister.password"
                  outlined
                  dense
                  label="Contraseña *"
                  :type="verPassword ? 'text' : 'password'"
                  :rules="[requerido('La contraseña'), minimo(6, 'La contraseña')]"
                  lazy-rules
                >
                  <template #prepend>
                    <q-icon name="lock" color="primary" />
                  </template>
                  <template #append>
                    <q-icon
                      :name="verPassword ? 'visibility_off' : 'visibility'"
                      class="cursor-pointer"
                      @click="verPassword = !verPassword"
                    />
                  </template>
                </q-input>

                <q-select
                  v-model="formularioRegister.rol"
                  outlined
                  dense
                  label="Rol de Usuario *"
                  :options="[
                    { label: 'Administrador (Control total)', value: 'admin' },
                    { label: 'Usuario Estándar (Lectura)', value: 'user' },
                  ]"
                  emit-value
                  map-options
                >
                  <template #prepend>
                    <q-icon name="admin_panel_settings" color="primary" />
                  </template>
                </q-select>
              </div>

              <div class="q-mt-lg">
                <q-btn
                  unelevated
                  no-caps
                  type="submit"
                  color="primary"
                  class="full-width"
                  size="md"
                  label="Registrar y Acceder"
                  :loading="enviando"
                />
              </div>
            </q-form>
          </q-tab-panel>
        </q-tab-panels>

        <q-separator />

        <!-- Cuentas sugeridas / info -->
        <q-card-section class="bg-grey-1 text-caption text-grey-8 q-pa-sm">
          <div class="row items-center justify-between">
            <div>
              <q-icon name="info" size="14px" class="q-mr-xs text-primary" />
              <strong>Tip:</strong> Puedes registrar un usuario <em>admin</em> para tener acceso completo.
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- URL del backend -->
      <p class="text-center text-caption texto-suave q-mt-md q-mb-none">
        <q-icon name="dns" size="14px" class="q-mr-xs" />API Conectada: {{ general.urlApi }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.columna-login {
  width: 440px;
  max-width: 94vw;
}
</style>
