const importQueue = require('../queues/import.queue');

importQueue.process(async (job) => {
  console.log('Procesando job:', job.data);
  return { ok: true, processed: job.data };
});

module.exports = importQueue;
