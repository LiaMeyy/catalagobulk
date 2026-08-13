function errorHandler(err, req, res, next) {
  // Manejo de error de clave duplicada de MongoDB (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'recurso'
    return res.status(409).json({
      error: {
        codigo: `${field.toUpperCase()}_DUPLICADO`,
        mensaje: `El campo ${field} ya existe y debe ser único`,
      },
    })
  }

  // Manejo de errores de validación de Mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        codigo: 'ERROR_VALIDACION',
        mensaje: err.message,
      },
    })
  }

  const statusCode = err.statusCode || 500
  const codigo = err.codigo || 'ERROR_INTERNO'
  const mensaje = err.esOperacional ? err.message : 'Error interno del servidor'

  if (!err.esOperacional) {
    console.error('[ERROR]', err)
  }

  res.status(statusCode).json({ error: { codigo, mensaje } })
}

module.exports = errorHandler