require('dotenv').config()
require('./config/env')

const http = require('http')
const app = require('./app')
const { conectarDB } = require('./config/db')
const { conectarRedis } = require('./config/redis')
const { inicializarSockets } = require('./sockets/index')
const { PORT } = require('./config/env')
const { start: iniciarWorker } = require('./workers/import.worker')

async function start() {
  try {
    await conectarDB()
    await conectarRedis()

    const httpServer = http.createServer(app)
    inicializarSockets(httpServer)

    httpServer.listen(PORT, () => {
      console.log(`✓ Servidor corriendo en http://localhost:${PORT}`)
      console.log(`  Health: http://localhost:${PORT}/health`)
    })

    // Worker de BullMQ (cola asíncrona) en el mismo proceso, porque en el
    // free tier de Render no hay Background Workers sin pagar.
    await iniciarWorker()
  } catch (err) {
    console.error('Error al arrancar:', err.message)
    process.exit(1)
  }
}

start()