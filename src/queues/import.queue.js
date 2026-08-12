const Queue = require('bull');
const { env } = require('../config/env');

const importQueue = new Queue('import-bulk', {
  redis: env.REDIS_URL,
});

module.exports = importQueue;
