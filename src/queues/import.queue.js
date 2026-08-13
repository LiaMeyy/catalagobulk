const { Queue } = require('bullmq')
const { redisClient } = require('../config/redis')

const importQueue = new Queue('import', {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
})

module.exports = { importQueue }