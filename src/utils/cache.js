const { redisClient } = require('../config/redis')
const { CACHE_TTL_SECONDS } = require('../config/env')

async function obtenerCache(clave) {
  if (!redisClient.isReady) return null

  try {
    const valor = await redisClient.get(clave)
    return valor ? JSON.parse(valor) : null
  } catch (err) {
    console.error('[cache] lectura fallida:', err.message)
    return null
  }
}

async function guardarCache(clave, valor, ttl = CACHE_TTL_SECONDS) {
  if (!redisClient.isReady) return

  try {
    await redisClient.set(clave, JSON.stringify(valor), { EX: ttl })
  } catch (err) {
    console.error('[cache] escritura fallida:', err.message)
  }
}

async function recordarCache(clave, cargar, ttl = CACHE_TTL_SECONDS) {
  const guardado = await obtenerCache(clave)
  if (guardado !== null) return guardado

  const valor = await cargar()
  await guardarCache(clave, valor, ttl)
  return valor
}

async function invalidarProductos() {
  if (!redisClient.isReady) return

  try {
    const claves = await redisClient.keys('catalogo:productos:*')
    if (claves.length > 0) await redisClient.del(claves)
  } catch (err) {
    console.error('[cache] invalidacion fallida:', err.message)
  }
}

module.exports = { recordarCache, invalidarProductos }
