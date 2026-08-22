const { createClient } = require('redis')
const { REDIS_HOST, REDIS_PORT } = require('./env')

const redisClient = createClient({
  RESP: 2,
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
})

redisClient.on('error', (err) => console.error('✗ Redis error:', err.message))
redisClient.on('connect', () => console.log('✓ Redis conectado'))

async function conectarRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect()
  }
}

module.exports = { redisClient, conectarRedis }