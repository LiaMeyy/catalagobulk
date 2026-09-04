import { Worker } from 'bullmq';
import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';
import redis from '../config/redis.js';
import AppError from '../errors/AppError.js';
import ImportService from '../modules/imports/import.service.js';

// Proceso aparte: node src/workers/import.worker.js
// No se importa desde server.js.
const QUEUE_NAME = 'import-bulk';

async function main() {
  await connectDB();
  await redis.ping();

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { importJobId } = job.data;

      if (!importJobId) {
        throw new AppError(400, 'Job sin importJobId', 'JOB_INVALIDO');
      }

      console.log(`[worker] Iniciando job ${job.id} — importJobId ${importJobId}`);

      // procesarImport ya marca el ImportJob como 'failed' (motivoFallo) si el
      // archivo es corrupto/ilegible o el header es inválido; acá solo propagamos
      // para que BullMQ registre el fallo del job. Las filas inválidas de un
      // archivo válido se manejan dentro del service y NO hacen fallar el job.
      await ImportService.procesarImport(importJobId);

      console.log(`[worker] Job ${job.id} finalizado — importJobId ${importJobId}`);
    },
    {
      connection: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
      },
    }
  );

  worker.on('completed', (job) => {
    console.log(`[worker] Job completado: ${job.id}`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[worker] Job fallido: ${job?.id} — ${error.message}`);
  });

  console.log(`[worker] Escuchando la cola "${QUEUE_NAME}"`);
}

main().catch((error) => {
  console.error('[worker] Error al iniciar el worker:', error.message);
  process.exit(1);
});
