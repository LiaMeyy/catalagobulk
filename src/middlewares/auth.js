const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config/env')
const AppError = require('../errors/AppError')

function auth(req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Token no proporcionado', 401, 'TOKEN_REQUERIDO'))
  }

  const token = header.split(' ')[1]

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.usuario = { id: payload.sub, rol: payload.rol }
    next()
  } catch {
    next(new AppError('Token inválido o expirado', 401, 'TOKEN_INVALIDO'))
  }
}

module.exports = auth