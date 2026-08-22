const usuarioService = require('./usuario.service')

async function listar(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query
    const resultado = await usuarioService.listar({
      page: Number(page),
      limit: Math.min(Number(limit), 100),
    })
    res.status(200).json(resultado)
  } catch (err) {
    next(err)
  }
}

async function obtenerPorId(req, res, next) {
  try {
    const usuario = await usuarioService.obtenerPorId(req.params.id)
    res.status(200).json(usuario)
  } catch (err) {
    next(err)
  }
}

async function crear(req, res, next) {
  try {
    const usuario = await usuarioService.crear(req.body)
    res.status(201).json(usuario)
  } catch (err) {
    next(err)
  }
}

async function actualizar(req, res, next) {
  try {
    const usuario = await usuarioService.actualizar(req.params.id, req.body)
    res.status(200).json(usuario)
  } catch (err) {
    next(err)
  }
}

async function eliminar(req, res, next) {
  try {
    await usuarioService.eliminar(req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar }
