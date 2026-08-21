<script setup>
/**
 * @fileoverview /components/Modales/CrearProveedorRapido.vue
 * Modal reutilizable para crear un proveedor rápidamente desde cualquier vista.
 */
import { ref, watch } from "vue";
import { generarSlug } from "@/utils/slug";
import { useProveedores } from "@/composables/useProveedores";
import { useNotificar } from "@/composables/useNotificar";
import { requerido, minimo, slugValido, esEmail } from "@/utils/reglas";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  titulo: {
    type: String,
    default: "Crear Proveedor Rápido",
  },
  subtitulo: {
    type: String,
    default: "Se creará y seleccionará automáticamente",
  },
});

const emit = defineEmits(["creado", "update:modelValue"]);

const { crearProveedorRapido, cargarProveedores } = useProveedores();
const { notificarOk, notificarError } = useNotificar();

const formularioRef = ref(null);
const guardando = ref(false);

const formulario = ref({
  nombre: "",
  slug: "",
  contactoEmail: "",
});

// Sincronizar con modelValue prop
const dialogoAbierto = ref(props.modelValue);

watch(
  () => props.modelValue,
  (val) => {
    dialogoAbierto.value = val;
  }
);

watch(
  dialogoAbierto,
  (val) => {
    emit("update:modelValue", val);
  }
);

watch(
  dialogoAbierto,
  (abierto) => {
    if (abierto) {
      formulario.value = { nombre: "", slug: "", contactoEmail: "" };
      formularioRef.value?.resetValidation();
    }
  }
);

const generarSlugAuto = () => {
  if (formulario.value.nombre && !formulario.value.slug) {
    formulario.value.slug = generarSlug(formulario.value.nombre);
  }
};

const guardar = async () => {
  if (!formularioRef.value?.validate()) return;

  guardando.value = true;
  try {
    const nuevo = await crearProveedorRapido(formulario.value);
    notificarOk(`Proveedor "${nuevo.nombre}" creado con éxito.`);
    emit("creado", nuevo);
    dialogoAbierto.value = false;
  } catch (e) {
    notificarError(e);
  } finally {
    guardando.value = false;
  }
};
</script>

<template>
  <q-dialog v-model="dialogoAbierto" persistent @show="formularioRef?.resetValidation()">
    <q-card class="dialog-card">
      <q-card-section class="bg-primary text-white row items-center no-wrap q-px-lg q-py-md">
        <q-icon name="add_business" size="26px" class="q-mr-md" />
        <div>
          <div class="dialog-title">{{ titulo }}</div>
          <div class="text-caption text-green-2">{{ subtitulo }}</div>
        </div>
        <q-space />
        <q-btn v-close-popup flat round dense icon="close" color="white" />
      </q-card-section>

      <q-form ref="formularioRef" greedy @submit="guardar">
        <q-card-section class="q-gutter-sm">
          <q-input
            v-model="formulario.nombre"
            outlined
            dense
            label="Nombre del Proveedor *"
            hint="Ej: Acme Corp"
            :rules="[requerido('El nombre'), minimo(2, 'El nombre')]"
            lazy-rules
            @blur="generarSlugAuto"
          />

          <q-input
            v-model="formulario.slug"
            outlined
            dense
            label="Slug *"
            hint="Ej: acme-corp (identificador único para importaciones)"
            :rules="[requerido('El slug'), slugValido()]"
            lazy-rules
          />

          <q-input
            v-model="formulario.contactoEmail"
            outlined
            dense
            type="email"
            label="Email de Contacto (Opcional)"
            hint="Ej: ventas@proveedor.com"
            :rules="[formulario.contactoEmail ? esEmail() : () => true]"
            lazy-rules
          />
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn v-close-popup flat no-caps label="Cancelar" color="dark" class="btn-cancel" />
          <q-btn
            unelevated
            no-caps
            type="submit"
            color="primary"
            class="btn-ok"
            label="Guardar Proveedor"
            :loading="guardando"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>