<script setup>
/**
 * /components/Cards/TarjetaMetrica.vue
 * Tarjeta de estadística para el dashboard.
 */
defineProps({
  titulo: {
    type: String,
    required: true,
  },
  valor: {
    type: [String, Number],
    required: true,
  },
  subtitulo: {
    type: String,
    default: "",
  },
  icono: {
    type: String,
    default: "analytics",
  },
  color: {
    type: String,
    default: "primary",
  },
  cargando: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <q-card flat class="tarjeta q-pa-md tarjeta-hover tarjeta-metrica">
    <div class="row items-start justify-between no-wrap">
      <div class="col">
        <div class="text-caption text-weight-bold text-uppercase text-grey-7 letter-spacing">
          {{ titulo }}
        </div>
        <div v-if="cargando" class="q-py-sm">
          <q-spinner-dots :color="color" size="28px" />
        </div>
        <div v-else class="text-h4 text-weight-bold q-mt-xs q-mb-xs texto-valor">
          {{ valor }}
        </div>
        <div v-if="subtitulo" class="text-caption text-grey-6">
          {{ subtitulo }}
        </div>
      </div>

      <q-avatar
        size="56px"
        :color="`${color}-1`"
        :text-color="color"
        class="rounded-borders q-ml-md icono-metrica"
      >
        <q-icon :name="icono" size="30px" />
      </q-avatar>
    </div>
  </q-card>
</template>

<style scoped lang="scss">
.tarjeta-metrica {
  min-height: 110px;
  transition: all $transition-normal;
  border-left: 4px solid var(--color_button);

  &.tarjeta-hover:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
    border-left-width: 6px;
  }

  .icono-metrica {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .texto-valor {
    color: $texto-principal;
  }
}
</style>
