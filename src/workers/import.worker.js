import { Worker } from 'bullmq';
import { env } from '../config/env.js';

// Proceso separado: node src/workers/import.worker.js
const worker = new Worker(
  'import-bulk',
  async (job) => {
    // TODO: parsear + validar + normalizar + bulk insert (BATCH_SIZE)
    // TODO: actualizar ImportJob (total/procesados/exitosos/fallidos/errores)
    // TODO: upsert de categorías/proveedor y relay de progreso vía QueueEvents
    console.log('Procesando job:', job.id);
  },
  {
    connection: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
    },
  }
);

worker.on('completed', (job) => {
  console.log('Job completado:', job.id);
});

worker.on('failed', (job, error) => {
  console.error('Job fallido:', job?.id, error.message);
});

export default worker;
