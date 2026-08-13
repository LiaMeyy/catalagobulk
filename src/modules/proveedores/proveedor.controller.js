const proveedorService = require('./proveedor.service')

async function listar(req, res, next) {
  try {
    const { page = 1, limit = 20, activo } = req.query
    const resultado = await proveedorService.listar({
      page: Number(page),
      limit: Math.min(Number(limit), 100),
      activo,
    })
    res.status(200).json(resultado)
  } catch (err) {
    next(err)
  }
}

async function obtenerPorId(req, res, next) {
  try {
    const proveedor = await proveedorService.obtenerPorId(req.params.id)
    res.status(200).json(proveedor)
  } catch (err) {
    next(err)
  }
}

async function crear(req, res, next) {
  try {
    const proveedor = await proveedorService.crear(req.body)
    res.status(201).json(proveedor)
  } catch (err) {
    next(err)
  }
}

async function actualizar(req, res, next) {
  try {
    const proveedor = await proveedorService.actualizar(req.params.id, req.body)
    res.status(200).json(proveedor)
  } catch (err) {
    next(err)
  }
}

async function eliminar(req, res, next) {
  try {
    await proveedorService.eliminar(req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar }