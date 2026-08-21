<script setup>
/**
 * /components/Encabezados/EncabezadoPagina.vue
 * Componente reutilizable para el encabezado estándar de cada pantalla.
 */
defineProps({
  titulo: {
    type: String,
    required: true,
  },
  subtitulo: {
    type: String,
    default: "",
  },
  icono: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <header class="encabezado-pagina">
    <div class="row items-center justify-between q-col-gutter-md">
      <!-- Bloque izquierdo: identidad y título -->
      <div class="col-12 col-sm">
        <div class="row items-center no-wrap">
          <q-avatar
            v-if="icono"
            square
            size="48px"
            color="primary"
            text-color="white"
            class="q-mr-md encabezado-pagina__icono shadow-2"
          >
            <q-icon :name="icono" size="28px" />
          </q-avatar>

          <div>
            <h1 class="titulo-vista style-text">{{ titulo }}</h1>
            <p v-if="subtitulo" class="encabezado-pagina__subtitulo">
              {{ subtitulo }}
            </p>
          </div>
        </div>
      </div>

      <!-- Bloque derecho: Slot de acciones de la vista -->
      <div class="col-12 col-sm-auto">
        <slot name="acciones" />
      </div>
    </div>

    <!-- Línea divisoria con gradiente -->
    <hr class="linea-titulo" />
  </header>
</template>

<style scoped lang="scss">
.encabezado-pagina {
  margin-bottom: $spacing-lg;
  padding-bottom: $spacing-sm;

  &__icono {
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(21, 128, 61, 0.3);
  }

  &__subtitulo {
    font-size: 14px;
    color: $texto-secundario;
    margin: 4px 0 0;
    font-weight: 400;
  }
}

// Animación de entrada
.encabezado-pagina {
  animation: fadeIn 300ms ease forwards;
}
</style>
