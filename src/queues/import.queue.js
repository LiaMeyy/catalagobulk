import { Queue } from 'bullmq';
import { env } from '../config/env.js';

const importQueue = new Queue('import-bulk', {
  connection: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
});

export default importQueue;
