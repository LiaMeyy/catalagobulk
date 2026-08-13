const importService = require('./import.service')
const AppError = require('../../errors/AppError')

async function crearImport(req, res, next) {
  try {
    if (!req.file) throw new AppError('Archivo requerido', 400, 'ARCHIVO_REQUERIDO')
    if (!req.body.proveedorId) throw new AppError('proveedorId requerido', 400, 'PROVEEDOR_REQUERIDO')

    const resultado = await importService.crearImport({
      archivo: req.file,
      proveedorId: req.body.proveedorId,
      usuarioId: req.usuario.id,
    })

    res.status(202).json(resultado)
  } catch (err) {
    next(err)
  }
}

async function obtenerPorId(req, res, next) {
  try {
    const importJob = await importService.obtenerPorId(req.params.id, req.usuario)
    res.status(200).json(importJob)
  } catch (err) {
    next(err)
  }
}

async function listar(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query
    const resultado = await importService.listar({
      page: Number(page),
      limit: Math.min(Number(limit), 100),
    })
    res.status(200).json(resultado)
  } catch (err) {
    next(err)
  }
}

module.exports = { crearImport, obtenerPorId, listar }