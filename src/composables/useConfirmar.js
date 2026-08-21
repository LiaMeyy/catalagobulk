/**
 * @fileoverview /composables/useConfirmar.js
 * Diálogos de confirmación asíncronos que devuelven una Promesa booleana.
 */
import { useQuasar } from "quasar";

export function useConfirmar() {
  const $q = useQuasar();

  const confirmar = ({
    titulo,
    mensaje,
    textoOk = "Confirmar",
    textoCancel = "Cancelar",
    color = "primary",
  }) =>
    new Promise((resolve) => {
      $q.dialog({
        title: titulo,
        message: mensaje,
        ok: { label: textoOk, color, unelevated: true, noCaps: true },
        cancel: { label: textoCancel, flat: true, color: "grey-8", noCaps: true },
        persistent: true,
      })
        .onOk(() => resolve(true))
        .onCancel(() => resolve(false));
    });

  return { confirmar };
}
