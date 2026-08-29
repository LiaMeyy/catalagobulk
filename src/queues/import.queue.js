import { Queue } from 'bullmq';
import { conexionRedis } from '../config/redis.js';

export const NOMBRE_COLA_IMPORTS = 'imports';

export const colaImports = new Queue(NOMBRE_COLA_IMPORTS, {
  connection: conexionRedis,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { age: 60 * 60 * 24 * 7 }, 
    removeOnFail: { age: 60 * 60 * 24 * 7 },
  },
});

export async function encolarImport(importJobId) {
  const job = await colaImports.add('procesar-import', { importJobId });
  return job.id;
}