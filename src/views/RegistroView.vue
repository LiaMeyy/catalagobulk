<script setup>
/**
 * /views/RegistroView.vue
 * Creación y registro administrativo de nuevas cuentas de usuario para el sistema CatálogoBulk.
 */
import { ref } from "vue";
import EncabezadoPagina from "@/components/Encabezados/EncabezadoPagina.vue";
import { post } from "@/services/api.service";
import { useAuthStore } from "@/store/Auth";
import { useNotificar } from "@/composables/useNotificar";
import { requerido, esEmail, minimo, igualA } from "@/utils/reglas";

const auth = useAuthStore();
const { notificarOk, notificarError } = useNotificar();

const formularioRef = ref(null);
const enviando = ref(false);
const verPassword = ref(false);

const formularioVacio = () => ({
  email: "",
  password: "",
  confirmacion: "",
  rol: "user",
});

const formulario = ref(formularioVacio());

const pasos = [
  "El frontend valida formato de correo, fortaleza de contraseña e igualdad.",
  "POST /api/auth/register se envía con el rol elegido ('admin' o 'user').",
  "El backend verifica que el correo no esté duplicado (código 11000 de Mongo).",
  "La contraseña se encripta con bcrypt antes de persistir.",
  "El nuevo usuario queda habilitado para iniciar sesión inmediatamente.",
];

const registrar = async () => {
  enviando.value = true;
  try {
    const respuesta = await post("/auth/register", {
      email: formulario.value.email.trim(),
      password: formulario.value.password,
      rol: formulario.value.rol,
    });

    notificarOk(`Usuario ${respuesta.email} creado exitosamente con rol ${respuesta.rol}.`);

    formulario.value = formularioVacio();
    formularioRef.value?.resetValidation();
  } catch (e) {
    notificarError(e);
  } finally {
    enviando.value = false;
  }
};
</script>

<template>
  <q-page>
    <div class="contenedor-app">
      <EncabezadoPagina
        titulo="Registrar Nuevo Usuario"
        subtitulo="Crea cuentas de acceso con permisos de lectura o administración"
        icono="person_add"
      />

      <div class="row q-col-gutter-lg">
        <!-- Formulario -->
        <div class="col-12 col-md-7">
          <q-card flat class="tarjeta">
            <q-form ref="formularioRef" greedy @submit="registrar">
              <q-card-section class="q-gutter-md">
                <q-input
                  v-model="formulario.email"
                  outlined
                  dense
                  type="email"
                  label="Correo Electrónico *"
                  hint="Será el identificador único para iniciar sesión"
                  autocomplete="off"
                  :rules="[requerido('El correo'), esEmail()]"
                  lazy-rules
                >
                  <template #prepend>
                    <q-icon name="mail" color="primary" />
                  </template>
                </q-input>

                <q-input
                  v-model="formulario.password"
                  outlined
                  dense
                  label="Contraseña *"
                  hint="Mínimo 6 caracteres"
                  autocomplete="new-password"
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

                <q-input
                  v-model="formulario.confirmacion"
                  outlined
                  dense
                  type="password"
                  label="Confirmar Contraseña *"
                  autocomplete="new-password"
                  :rules="[
                    requerido('La confirmación'),
                    igualA(() => formulario.password, 'Las contraseñas no coinciden'),
                  ]"
                  lazy-rules
                >
                  <template #prepend>
                    <q-icon name="lock_reset" color="primary" />
                  </template>
                </q-input>

                <q-select
                  v-model="formulario.rol"
                  outlined
                  dense
                  label="Rol / Nivel de Acceso *"
                  :options="[
                    { label: 'Usuario Estándar (Lectura de catálogo)', value: 'user' },
                    { label: 'Administrador (Cargas masivas, CRUDs, usuarios)', value: 'admin' },
                  ]"
                  emit-value
                  map-options
                >
                  <template #prepend>
                    <q-icon name="admin_panel_settings" color="primary" />
                  </template>
                </q-select>
              </q-card-section>

              <q-card-actions align="right" class="q-px-md q-pb-md">
                <q-btn
                  flat
                  no-caps
                  color="grey-8"
                  label="Ir al Dashboard"
                  :to="{ name: 'dashboard' }"
                />
                <q-btn
                  unelevated
                  no-caps
                  type="submit"
                  color="primary"
                  label="Crear Usuario"
                  :loading="enviando"
                />
              </q-card-actions>
            </q-form>
          </q-card>
        </div>

        <!-- Tarjeta Informativa Lateral -->
        <div class="col-12 col-md-5">
          <div class="section-box full-height">
            <div class="section-box__title">
              <q-icon name="shield" size="18px" class="q-mr-sm" />
              Seguridad y Control de Roles
            </div>

            <div class="q-pa-md">
              <q-list dense>
                <q-item v-for="paso in pasos" :key="paso" class="q-px-none">
                  <q-item-section avatar class="q-pr-sm" style="min-width: 26px">
                    <q-icon name="chevron_right" color="primary" size="18px" />
                  </q-item-section>
                  <q-item-section class="text-body2 text-grey-8">{{ paso }}</q-item-section>
                </q-item>
              </q-list>

              <q-banner dense class="bg-blue-1 text-blue-9 q-mt-md rounded-borders">
                <template #avatar>
                  <q-icon name="info" />
                </template>
                Sesión activa: <strong>{{ auth.nombreUsuario }}</strong> ({{ auth.rolUsuario.toUpperCase() }}).
              </q-banner>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>
