class AppError extends Error {
  constructor(mensaje, statusCode, codigo) {
    super(mensaje)
    this.statusCode = statusCode
    this.codigo = codigo
    this.esOperacional = true
    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = AppError