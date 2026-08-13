require('dotenv').config()
require('./config/env')

const http = require('http')
const app = require('./app')
const { conectarDB } = require('./config/db')
const { conectarRedis } = require('./config/redis')
const { inicializarSockets } = require('./sockets/index')
const { PORT } = require('./config/env')

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
  } catch (err) {
    console.error('Error al arrancar:', err.message)
    process.exit(1)
  }
}

start()