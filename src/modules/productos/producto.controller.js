const productoService = require('./producto.service')

async function listar(req, res, next) {
  try {
    const { page = 1, limit = 20, categoria, proveedor, disponible, search, sortBy, descending } = req.query
    const resultado = await productoService.listar({
      page: Number(page),
      limit: Math.min(Number(limit), 100),
      categoria,
      proveedor,
      disponible,
      search,
      sortBy,
      descending,
    })
    res.status(200).json(resultado)
  } catch (err) {
    next(err)
  }
}

async function obtenerPorId(req, res, next) {
  try {
    const producto = await productoService.obtenerPorId(req.params.id)
    res.status(200).json(producto)
  } catch (err) {
    next(err)
  }
}

async function obtenerStats(req, res, next) {
  try {
    const stats = await productoService.obtenerStats()
    res.status(200).json(stats)
  } catch (err) {
    next(err)
  }
}

async function crear(req, res, next) {
  try {
    const producto = await productoService.crear(req.body)
    res.status(201).json(producto)
  } catch (err) {
    next(err)
  }
}

async function actualizar(req, res, next) {
  try {
    const producto = await productoService.actualizar(req.params.id, req.body)
    res.status(200).json(producto)
  } catch (err) {
    next(err)
  }
}

async function eliminar(req, res, next) {
  try {
    await productoService.eliminar(req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

module.exports = { listar, obtenerPorId, obtenerStats, crear, actualizar, eliminar }
