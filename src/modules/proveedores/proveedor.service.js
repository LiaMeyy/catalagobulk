const proveedorRepository = require('./proveedor.repository')
const productoRepository = require('../productos/producto.repository')
const AppError = require('../../errors/AppError')

async function listar({ page, limit, activo }) {
  return proveedorRepository.findAll({ page, limit, activo })
}

async function obtenerPorId(id) {
  const proveedor = await proveedorRepository.findById(id)
  if (!proveedor) throw new AppError('Proveedor no encontrado', 404, 'PROVEEDOR_NOT_FOUND')
  return proveedor
}

async function crear(datos) {
  const existente = await proveedorRepository.findByNombreOSlug({
    nombre: datos.nombre,
    slug: datos.slug,
  })
  if (existente) throw new AppError('Nombre o slug duplicado', 409, 'PROVEEDOR_DUPLICADO')

  return proveedorRepository.crear(datos)
}

async function actualizar(id, datos) {
  const duplicado = await proveedorRepository.findDuplicadoParaUpdate(id, {
    nombre: datos.nombre,
    slug: datos.slug,
  })
  if (duplicado) throw new AppError('Nombre o slug duplicado', 409, 'PROVEEDOR_DUPLICADO')

  const proveedor = await proveedorRepository.updateById(id, datos)
  if (!proveedor) throw new AppError('Proveedor no encontrado', 404, 'PROVEEDOR_NOT_FOUND')
  return proveedor
}

async function eliminar(id) {
  const count = await productoRepository.countByProveedor(id)
  if (count > 0) {
    throw new AppError(
      'No se puede eliminar un proveedor con productos asociados. Use activo: false.',
      409,
      'PROVEEDOR_CON_PRODUCTOS'
    )
  }

  const proveedor = await proveedorRepository.deleteById(id)
  if (!proveedor) throw new AppError('Proveedor no encontrado', 404, 'PROVEEDOR_NOT_FOUND')
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar }
