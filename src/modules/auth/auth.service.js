const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Usuario = require('./usuario.model')
const AppError = require('../../errors/AppError')
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../config/env')

async function register({ email, password, rol }) {
  const existe = await Usuario.findOne({ email })
  if (existe) throw new AppError('Email ya registrado', 409, 'EMAIL_DUPLICADO')

  const hash = await bcrypt.hash(password, 10)
  const usuario = await Usuario.create({ email, password: hash, rol })

  return { id: usuario._id, email: usuario.email, rol: usuario.rol }
}

async function login({ email, password }) {
  const usuario = await Usuario.findOne({ email }).select('+password')
  if (!usuario) throw new AppError('Credenciales inválidas', 401, 'CREDENCIALES_INVALIDAS')

  const valido = await bcrypt.compare(password, usuario.password)
  if (!valido) throw new AppError('Credenciales inválidas', 401, 'CREDENCIALES_INVALIDAS')

  const token = jwt.sign({ sub: usuario._id, rol: usuario.rol }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })

  return { token }
}

module.exports = { register, login }