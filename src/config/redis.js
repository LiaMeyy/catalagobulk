import Redis from 'ioredis';
import { env } from './env.js';

export const conexionRedis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

conexionRedis.on('error', (error) => {
  console.error('[redis] error de conexion:', error.message);
});

conexionRedis.on('connect', () => {
  console.log('[redis] conectado');
});