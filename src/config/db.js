const mongoose = require('mongoose')
const { MONGO_URI } = require('./env')

async function conectarDB(maxRetries = 5, delayMs = 2000) {
  let retries = 0
  while (retries < maxRetries) {
    try {
      await mongoose.connect(MONGO_URI)
      console.log('✓ MongoDB conectado')
      return
    } catch (err) {
      retries++
      console.error(`✗ Error conectando a MongoDB (intento ${retries}/${maxRetries}):`, err.message)
      if (retries >= maxRetries) {
        process.exit(1)
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}

module.exports = { conectarDB }