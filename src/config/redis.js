import Redis from 'ioredis';
import { env } from './env.js';

const redis = new Redis(env.REDIS_URL);

redis.on('connect', () => {
  console.log('Redis conectado');
});

redis.on('error', (error) => {
  console.error('Redis error:', error.message);
});

export default redis;
