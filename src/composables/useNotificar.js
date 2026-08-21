/**
 * @fileoverview /composables/useNotificar.js
 * Notificaciones estandarizadas con Quasar Notify.
 */
import { useQuasar } from "quasar";

export function useNotificar() {
  const $q = useQuasar();

  const notificarOk = (mensaje) => {
    $q.notify({
      type: "positive",
      message: mensaje || "Operación realizada con éxito",
      icon: "check_circle",
    });
  };

  const notificarError = (error) => {
    if (typeof error === "string") {
      $q.notify({
        type: "negative",
        message: error,
        icon: "error",
      });
      return;
    }

    const detalle = error?.errores?.length
      ? error.errores.join(" · ")
      : error?.codigo
      ? `Código: ${error.codigo}`
      : "";

    $q.notify({
      type: "negative",
      icon: "error",
      message: error?.mensaje || "Ocurrió un error en la solicitud",
      caption: detalle,
      timeout: detalle ? 6000 : 4000,
    });
  };

  const notificarInfo = (mensaje, caption = "") => {
    $q.notify({
      type: "info",
      message: mensaje,
      caption,
      icon: "info",
    });
  };

  const notificarAdvertencia = (mensaje, caption = "") => {
    $q.notify({
      type: "warning",
      message: mensaje,
      caption,
      icon: "warning",
    });
  };

  return { notificarOk, notificarError, notificarInfo, notificarAdvertencia };
}
