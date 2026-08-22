const importRepository = require('./import.repository')
const Proveedor = require('../proveedores/proveedor.model')
const { importQueue } = require('../../queues/import.queue')
const AppError = require('../../errors/AppError')

async function crearImport({ archivo, proveedorId, usuarioId }) {
  // Validar proveedor
  const proveedor = await Proveedor.findById(proveedorId)
  if (!proveedor) throw new AppError('Proveedor no encontrado', 404, 'PROVEEDOR_NOT_FOUND')
  if (!proveedor.activo) throw new AppError('Proveedor inactivo', 409, 'PROVEEDOR_INACTIVO')

  // Crear ImportJob en pending
  const importJob = await importRepository.crear({
    usuarioId,
    proveedorId,
    archivoNombre: archivo.originalname,
    archivoRuta: archivo.path,
    estado: 'pending',
  })

  // Encolar en BullMQ
  const bullJob = await importQueue.add('procesar-import', {
    importJobId: importJob._id.toString(),
    archivoRuta: archivo.path,
    proveedorId: proveedorId.toString(),
  })

  // Guardar bullJobId para trazabilidad
  await importRepository.updateById(importJob._id, { bullJobId: bullJob.id })

  return { importJobId: importJob._id, estado: importJob.estado }
}

async function obtenerPorId(id, usuario) {
  const importJob = await importRepository.findById(id)
  if (!importJob) throw new AppError('Import no encontrado', 404, 'IMPORT_NOT_FOUND')

  // Solo el dueño o admin puede verlo
  if (usuario.rol !== 'admin' && importJob.usuarioId.toString() !== usuario.id) {
    throw new AppError('Acceso denegado', 403, 'SIN_PERMISO')
  }

  const porcentaje = importJob.total
    ? Math.round((importJob.procesados / importJob.total) * 100)
    : 0

  return {
    importJobId: importJob._id,
    proveedorId: importJob.proveedorId,
    estado: importJob.estado,
    total: importJob.total,
    procesados: importJob.procesados,
    exitosos: importJob.exitosos,
    fallidos: importJob.fallidos,
    porcentaje,
    errores: importJob.errores,
    startedAt: importJob.startedAt,
    finishedAt: importJob.finishedAt,
  }
}

async function listar({ page, limit }) {
  return importRepository.findAll({ page, limit })
}

module.exports = { crearImport, obtenerPorId, listar }