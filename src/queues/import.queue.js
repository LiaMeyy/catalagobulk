const { Queue } = require('bullmq')
const { crearConexionBullMQ } = require('../config/bullConnection')

const importQueue = new Queue('import', {
  connection: crearConexionBullMQ(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
})

module.exports = { importQueue }