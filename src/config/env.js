require('dotenv').config()

const REQUIRED_VARS = [
  'PORT',
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'MAX_FILE_SIZE_MB',
  'BATCH_SIZE',
  'CACHE_TTL_SECONDS',
  'IMPORT_ERRORS_CAP',
]

// Si ya vienes de Render con REDIS_URL, no hace falta host/puerto por separado.
if (!process.env.REDIS_URL) {
  REQUIRED_VARS.push('REDIS_HOST', 'REDIS_PORT')
}

for (const variable of REQUIRED_VARS) {
  if (!process.env[variable]) {
    console.error(`[env] Variable de entorno faltante: ${variable}`)
    process.exit(1)
  }
}

module.exports = {
  PORT: Number(process.env.PORT),
  MONGO_URI: process.env.MONGO_URI,
  REDIS_URL: process.env.REDIS_URL || null,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: Number(process.env.REDIS_PORT),
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  MAX_FILE_SIZE_MB: Number(process.env.MAX_FILE_SIZE_MB),
  BATCH_SIZE: Number(process.env.BATCH_SIZE),
  CACHE_TTL_SECONDS: Number(process.env.CACHE_TTL_SECONDS),
  IMPORT_ERRORS_CAP: Number(process.env.IMPORT_ERRORS_CAP),
}