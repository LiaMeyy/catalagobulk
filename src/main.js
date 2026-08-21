/**
 * main.js — Punto de entrada de la aplicación Frontend CatálogoBulk.
 */
import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

import App from "./App.vue";
import { router } from "./router";
import { instalarQuasar } from "./plugins/quasar";

import "./styles/main.scss";

const app = createApp(App);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(router);
instalarQuasar(app);

app.mount("#app");
