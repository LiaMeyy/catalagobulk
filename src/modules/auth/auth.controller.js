const authService = require('./auth.service')

async function register(req, res, next) {
  try {
    const resultado = await authService.register(req.body)
    res.status(201).json(resultado)
  } catch (err) {
    next(err)
  }
}

async function login(req, res, next) {
  try {
    const resultado = await authService.login(req.body)
    res.status(200).json(resultado)
  } catch (err) {
    next(err)
  }
}

module.exports = { register, login }