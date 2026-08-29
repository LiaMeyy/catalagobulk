// Este archivo se ejecuta como proceso aparte:
//   node src/workers/import.worker.js
// No se importa dentro de app.js / server.js.

import mongoose from 'mongoose';
import { Worker } from 'bullmq';

import { env } from '../config/env.js';
import { conexionRedis } from '../config/redis.js';
import { NOMBRE_COLA_IMPORTS } from '../queues/import.queue.js';
import { procesarImport } from '../modules/imports/import.service.js';
import { marcarJobFallido } from '../modules/imports/import.repository.js';

async function conectarMongo() {
  await mongoose.connect(env.DB_URI);
  console.log('[worker] conectado a MongoDB');
}

async function iniciar() {
  await conectarMongo();

  const worker = new Worker(
    NOMBRE_COLA_IMPORTS,
    async (job) => {
      const { importJobId } = job.data;
      console.log(`[worker] procesando import ${importJobId} (bull job ${job.id})`);

      try {
        const resultado = await procesarImport(importJobId, {
          onProgreso: async ({ procesados, total }) => {
            // Punto de extension: cuando exista src/sockets/index.js,
            // aca se emite el progreso por Socket.io, ej:
            //   io.to(`import:${importJobId}`).emit('import:progreso', {...})
            await job.updateProgress(total ? Math.round((procesados / total) * 100) : 0);
          },
        });

        console.log(`[worker] import ${importJobId} completado`, {
          exitosos: resultado.exitosos,
          fallidos: resultado.fallidos,
        });

        return { estado: 'completed' };
      } catch (error) {
        console.error(`[worker] import ${importJobId} fallo:`, error.message);
        // Si procesarImport ya marco el job como failed, esto es redundante
        // pero inofensivo (idempotente por _id).
        await marcarJobFallido(importJobId, error.message).catch(() => {});
        throw error;
      }
    },
    {
      connection: conexionRedis,
      concurrency: 2,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[worker] bull job ${job.id} completado`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[worker] bull job ${job?.id} fallo definitivamente:`, error.message);
  });

  const apagar = async () => {
    console.log('[worker] apagando...');
    await worker.close();
    await mongoose.connection.close();
    process.exit(0);
  };

  process.on('SIGINT', apagar);
  process.on('SIGTERM', apagar);
}

iniciar().catch((error) => {
  console.error('[worker] error fatal al iniciar:', error);
  process.exit(1);
});