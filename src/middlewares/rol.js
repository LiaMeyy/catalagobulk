const AppError = require('../errors/AppError')

function rol(...roles) {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return next(new AppError('Acceso denegado', 403, 'SIN_PERMISO'))
    }
    next()
  }
}

module.exports = rol