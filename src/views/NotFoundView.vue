<script setup>
/**
 * /views/NotFoundView.vue
 * Página de error 404 para rutas inexistentes en el router.
 */
</script>

<template>
  <q-page class="flex flex-center">
    <div class="text-center q-pa-xl">
      <q-icon name="travel_explore" size="72px" color="grey-5" />

      <h1 class="text-h4 text-weight-bold q-mt-md q-mb-xs">404</h1>
      <p class="texto-suave q-mb-lg">
        La ruta a la que intentas acceder no existe en el sistema.
      </p>

      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="dashboard"
        label="Volver al Dashboard"
        :to="{ name: 'dashboard' }"
      />
    </div>
  </q-page>
</template>
