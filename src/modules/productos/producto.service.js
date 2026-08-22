const productoRepository = require('./producto.repository')
const Proveedor = require('../proveedores/proveedor.model')
const AppError = require('../../errors/AppError')

async function listar({ page, limit, categoria, proveedor, disponible, search, sortBy, descending }) {
  return productoRepository.findAll({ page, limit, categoria, proveedor, disponible, search, sortBy, descending })
}

async function obtenerPorId(id) {
  const producto = await productoRepository.findById(id)
  if (!producto) throw new AppError('Producto no encontrado', 404, 'PRODUCTO_NOT_FOUND')
  return producto
}

async function obtenerStats() {
  return productoRepository.stats()
}

async function crear(datos) {
  const { sku, proveedorId } = datos

  const skuExiste = await productoRepository.findBySku(sku)
  if (skuExiste) throw new AppError('SKU duplicado', 409, 'SKU_DUPLICADO')

  const proveedor = await Proveedor.findById(proveedorId)
  if (!proveedor) throw new AppError('Proveedor no encontrado', 404, 'PROVEEDOR_NOT_FOUND')

  return productoRepository.crear(datos)
}

async function actualizar(id, datos) {
  if (datos.sku) {
    const existente = await productoRepository.findBySku(datos.sku)
    if (existente && existente._id.toString() !== id) {
      throw new AppError('SKU duplicado', 409, 'SKU_DUPLICADO')
    }
  }

  const producto = await productoRepository.updateById(id, datos)
  if (!producto) throw new AppError('Producto no encontrado', 404, 'PRODUCTO_NOT_FOUND')
  return producto
}

async function eliminar(id) {
  const producto = await productoRepository.deleteById(id)
  if (!producto) throw new AppError('Producto no encontrado', 404, 'PRODUCTO_NOT_FOUND')
}

module.exports = { listar, obtenerPorId, obtenerStats, crear, actualizar, eliminar }
