import Queue from 'bull';
import { env } from '../config/env.js';

const importQueue = new Queue('import-bulk', {
  redis: env.REDIS_URL,
});

export default importQueue;
