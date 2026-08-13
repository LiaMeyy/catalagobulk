const rateLimit = require('express-rate-limit')

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { error: { codigo: 'RATE_LIMIT', mensaje: 'Demasiados intentos. Intenta en 15 minutos.' } },
  standardHeaders: true,
  legacyHeaders: false,
})

const importLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5,
  message: { error: { codigo: 'RATE_LIMIT', mensaje: 'Demasiadas importaciones. Intenta en 1 minuto.' } },
  standardHeaders: true,
  legacyHeaders: false,
})

module.exports = { loginLimiter, importLimiter }