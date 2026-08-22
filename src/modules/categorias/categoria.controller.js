const categoriaService = require('./categoria.service')

async function listar(req, res, next) {
  try {
    const categorias = await categoriaService.listar()
    res.status(200).json(categorias)
  } catch (err) {
    next(err)
  }
}

async function obtenerPorSlug(req, res, next) {
  try {
    const categoria = await categoriaService.obtenerPorSlug(req.params.slug)
    res.status(200).json(categoria)
  } catch (err) {
    next(err)
  }
}

async function actualizar(req, res, next) {
  try {
    const categoria = await categoriaService.actualizar(req.params.id, req.body)
    res.status(200).json(categoria)
  } catch (err) {
    next(err)
  }
}

async function eliminar(req, res, next) {
  try {
    await categoriaService.eliminar(req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

module.exports = { listar, obtenerPorSlug, actualizar, eliminar }
