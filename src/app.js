const express = require('express')
const mongoose = require('mongoose')
const { redisClient } = require('./config/redis')
const errorHandler = require('./middlewares/errorHandler')
const { swaggerUi, swaggerDocument } = require('./config/swagger')

// Rutas
const authRoutes = require('./modules/auth/auth.routes')
const productoRoutes = require('./modules/productos/producto.routes')
const proveedorRoutes = require('./modules/proveedores/proveedor.routes')
const categoriaRoutes = require('./modules/categorias/categoria.routes')
const importRoutes = require('./modules/imports/import.routes')

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', async (req, res) => {
  const estado = { status: 'ok', mongo: 'down', redis: 'down' }

  if (mongoose.connection.readyState === 1) {
    estado.mongo = 'up'
  }

  try {
    if (redisClient.isOpen && redisClient.isReady) {
      const pong = await redisClient.ping()
      if (pong === 'PONG') {
        estado.redis = 'up'
      }
    }
  } catch (err) {
    estado.redis = 'down'
  }

  const todoOk = estado.mongo === 'up' && estado.redis === 'up'
  res.status(todoOk ? 200 : 503).json(estado)
})

// Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// Rutas API
app.use('/api/auth', authRoutes)
app.use('/api/productos', productoRoutes)
app.use('/api/proveedores', proveedorRoutes)
app.use('/api/categorias', categoriaRoutes)
app.use('/api/imports', importRoutes)

// Manejador de errores (último middleware)
app.use(errorHandler)

module.exports = app