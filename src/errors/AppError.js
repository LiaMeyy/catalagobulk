class AppError extends Error {
  constructor(mensaje, statusCode = 500, codigo = 'ERROR_INTERNO') {
    super(mensaje);
    this.name = 'AppError';
    this.mensaje = mensaje;
    this.statusCode = statusCode;
    this.codigo = codigo;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export default AppError;