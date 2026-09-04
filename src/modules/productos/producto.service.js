const productoRepository = require('./producto.repository')
const Proveedor = require('../proveedores/proveedor.model')
const Categoria = require('../categorias/categoria.model')
const AppError = require('../../errors/AppError')

// Normaliza el nombre de categoria igual que el import worker (slug en
// minusculas) para que el mismo concepto no genere categorias distintas.
function normalizarCategoria(valor) {
  return String(valor ?? '').trim().toLowerCase()
}

// Crea la categoria si no existe (misma logica que import.worker.js).
async function asegurarCategoria(valor) {
  const slug = normalizarCategoria(valor)
  if (!slug) return

  await Categoria.bulkWrite([
    {
      updateOne: {
        filter: { slug },
        update: {
          $setOnInsert: {
            slug,
            nombre: slug.charAt(0).toUpperCase() + slug.slice(1),
            descripcion: null,
            imagenUrl: null,
          },
        },
        upsert: true,
      },
    },
  ])
}

async function listar({ page, limit, categoria, proveedor, disponible, search, sortBy, descending }) {
  return productoRepository.findAll({ page, limit, categoria, proveedor, disponible, search, sortBy, descending })
}

async function listarPublico({ page, limit, categoria, proveedor, search, sortBy, descending }) {
  return productoRepository.findAll({ page, limit, categoria, proveedor, disponible: true, search, sortBy, descending })
}

async function obtenerPorId(id) {
  const producto = await productoRepository.findById(id)
  if (!producto) throw new AppError('Producto no encontrado', 404, 'PRODUCTO_NOT_FOUND')
  return producto
}

async function obtenerStats() {
  return productoRepository.stats()
}

async function obtenerStatsPublico() {
  return productoRepository.statsPublico()
}

async function crear(datos) {
  const { sku, proveedorId } = datos

  const skuExiste = await productoRepository.findBySku(sku)
  if (skuExiste) throw new AppError('SKU duplicado', 409, 'SKU_DUPLICADO')

  const proveedor = await Proveedor.findById(proveedorId)
  if (!proveedor) throw new AppError('Proveedor no encontrado', 404, 'PROVEEDOR_NOT_FOUND')

  const categoria = normalizarCategoria(datos.categoria)
  await asegurarCategoria(categoria)

  return productoRepository.crear({ ...datos, categoria })
}

async function actualizar(id, datos) {
  if (datos.sku) {
    const existente = await productoRepository.findBySku(datos.sku)
    if (existente && existente._id.toString() !== id) {
      throw new AppError('SKU duplicado', 409, 'SKU_DUPLICADO')
    }
  }

  if (datos.categoria !== undefined) {
    const categoria = normalizarCategoria(datos.categoria)
    await asegurarCategoria(categoria)
    datos.categoria = categoria
  }

  const producto = await productoRepository.updateById(id, datos)
  if (!producto) throw new AppError('Producto no encontrado', 404, 'PRODUCTO_NOT_FOUND')
  return producto
}

async function eliminar(id) {
  const producto = await productoRepository.deleteById(id)
  if (!producto) throw new AppError('Producto no encontrado', 404, 'PRODUCTO_NOT_FOUND')
}

module.exports = { listar, listarPublico, obtenerPorId, obtenerStats, obtenerStatsPublico, crear, actualizar, eliminar }
