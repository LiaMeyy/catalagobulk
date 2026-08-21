/**
 * @fileoverview /plugins/quasar.js
 * Configuración de plugins y lenguaje de Quasar.
 */
import { Quasar, Notify, Dialog, Loading } from "quasar";
import "@quasar/extras/material-icons/material-icons.css";
import "quasar/src/css/index.sass";
import lang from "quasar/lang/es";

export function instalarQuasar(app) {
  app.use(Quasar, {
    plugins: { Notify, Dialog, Loading },
    lang,
    config: {
      notify: {
        position: "top-right",
        timeout: 3500,
        actions: [{ icon: "close", color: "white", round: true }],
      },
    },
  });
}
