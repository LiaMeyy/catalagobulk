const Redis = require('ioredis')
const { REDIS_URL, REDIS_HOST, REDIS_PORT } = require('./env')

// BullMQ está construido sobre ioredis y su conexión bloqueante exige
// maxRetriesPerRequest = null. Devuelve UNA conexión nueva por llamada
// (BullMQ recomienda una conexión distinta por Queue/QueueEvents/Worker).
function crearConexionBullMQ() {
  const esTls = (REDIS_URL || '').startsWith('rediss://')

  if (REDIS_URL) {
    return new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      tls: esTls ? {} : undefined,
    })
  }

  return new Redis({
    host: REDIS_HOST,
    port: Number(REDIS_PORT),
    maxRetriesPerRequest: null,
  })
}

module.exports = { crearConexionBullMQ }
