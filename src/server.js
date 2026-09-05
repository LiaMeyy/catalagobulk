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

    // FIX: aumentar timeouts para permitir subida de archivos grandes
    httpServer.timeout = 600000          // 10 minutos
    httpServer.keepAliveTimeout = 620000 // debe ser mayor que timeout
    httpServer.headersTimeout = 630000   // debe ser mayor que keepAliveTimeout

    inicializarSockets(httpServer)

    httpServer.listen(PORT, () => {
      console.log(`✓ Servidor corriendo en http://localhost:${PORT}`)
      console.log(`  Health: http://localhost:${PORT}/health`)
    })

    await iniciarWorker()
  } catch (err) {
    console.error('Error al arrancar:', err.message)
    process.exit(1)
  }
}

start()