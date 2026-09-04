const { createClient } = require('redis')
const { REDIS_URL, REDIS_HOST, REDIS_PORT } = require('./env')

// Base común: protocolo RESP2 y reconexión con backoff.
const baseOpciones = {
  RESP: 2,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
}

// Si existe REDIS_URL (por ejemplo el que inyecta Render, con TLS rediss://),
// se usa tal cual. Si no, se arma con host y puerto por separado (local/docker).
const redisClient = createClient(
  REDIS_URL
    ? { ...baseOpciones, url: REDIS_URL }
    : {
        ...baseOpciones,
        socket: {
          ...baseOpciones.socket,
          host: REDIS_HOST,
          port: REDIS_PORT,
        },
      }
)

redisClient.on('error', (err) => console.error('✗ Redis error:', err.message))
redisClient.on('connect', () => console.log('✓ Redis conectado'))

async function conectarRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect()
  }
}

module.exports = { redisClient, conectarRedis }