import importQueue from '../queues/import.queue.js';

importQueue.process(async (job) => {
  console.log('Procesando job:', job.data);
  return { ok: true, processed: job.data };
});

export default importQueue;
