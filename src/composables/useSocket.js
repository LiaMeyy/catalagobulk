/**
 * @fileoverview /composables/useSocket.js
 * Conexión reactiva de Socket.io para escuchar progreso y eventos de importación masiva en tiempo real.
 */
import { onBeforeUnmount, ref } from "vue";
import { io } from "socket.io-client";

let socketInstance = null;

export function useSocket() {
  const conectado = ref(false);
  const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

  if (!socketInstance) {
    socketInstance = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
  }

  socketInstance.on("connect", () => {
    conectado.value = true;
  });

  socketInstance.on("disconnect", () => {
    conectado.value = false;
  });

  /**
   * Escucha el progreso de un trabajo de importación específico
   * @param {string} importJobId
   * @param {(data: any) => void} callback
   */
  const escucharProgresoImport = (importJobId, callback) => {
    if (!socketInstance || !importJobId) return;
    const evento = `import:${importJobId}:progress`;
    socketInstance.on(evento, callback);

    return () => socketInstance.off(evento, callback);
  };

  /**
   * Escucha la finalización de un trabajo de importación específico
   * @param {string} importJobId
   * @param {(data: any) => void} callback
   */
  const escucharCompletadoImport = (importJobId, callback) => {
    if (!socketInstance || !importJobId) return;
    const evento = `import:${importJobId}:completed`;
    socketInstance.on(evento, callback);

    return () => socketInstance.off(evento, callback);
  };

  /**
   * Escucha fallos en un trabajo
   * @param {string} jobId
   * @param {(data: any) => void} callback
   */
  const escucharFalloImport = (jobId, callback) => {
    if (!socketInstance || !jobId) return;
    const evento = `import:${jobId}:failed`;
    socketInstance.on(evento, callback);

    return () => socketInstance.off(evento, callback);
  };

  return {
    socket: socketInstance,
    conectado,
    escucharProgresoImport,
    escucharCompletadoImport,
    escucharFalloImport,
  };
}
