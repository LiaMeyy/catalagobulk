const bcrypt = require('bcrypt')
const Usuario = require('../auth/usuario.model')
const AppError = require('../../errors/AppError')

async function listar({ page, limit }) {
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    Usuario.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
    Usuario.countDocuments(),
  ])

  return { data, page, limit, total }
}

async function obtenerPorId(id) {
  const usuario = await Usuario.findById(id)
  if (!usuario) throw new AppError('Usuario no encontrado', 404, 'USUARIO_NOT_FOUND')
  return usuario
}

async function crear({ email, password, rol = 'user', activo = true }) {
  const existe = await Usuario.findOne({ email })
  if (existe) throw new AppError('Email ya registrado', 409, 'EMAIL_DUPLICADO')
  if (!password || password.length < 6) {
    throw new AppError('La contraseña debe tener mínimo 6 caracteres', 400, 'PASSWORD_INVALIDA')
  }

  const hash = await bcrypt.hash(password, 10)
  return Usuario.create({ email, password: hash, rol, activo })
}

async function actualizar(id, datos) {
  const update = {
    rol: datos.rol,
    activo: datos.activo,
  }

  if (datos.password) {
    if (datos.password.length < 6) {
      throw new AppError('La contraseña debe tener mínimo 6 caracteres', 400, 'PASSWORD_INVALIDA')
    }
    update.password = await bcrypt.hash(datos.password, 10)
  }

  Object.keys(update).forEach((key) => update[key] === undefined && delete update[key])

  const usuario = await Usuario.findByIdAndUpdate(id, update, { new: true, runValidators: true })
  if (!usuario) throw new AppError('Usuario no encontrado', 404, 'USUARIO_NOT_FOUND')
  return usuario
}

async function eliminar(id) {
  const usuario = await Usuario.findByIdAndDelete(id)
  if (!usuario) throw new AppError('Usuario no encontrado', 404, 'USUARIO_NOT_FOUND')
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar }
