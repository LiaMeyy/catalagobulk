const productoRepository = require('./producto.repository')
const Proveedor = require('../proveedores/proveedor.model')
const Categoria = require('../categorias/categoria.model')
const AppError = require('../../errors/AppError')
const { recordarCache, invalidarProductos } = require('../../utils/cache')

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
  const parametros = { page, limit, categoria, proveedor, disponible, search, sortBy, descending }
  const clave = `catalogo:productos:list:${JSON.stringify(parametros)}`
  return recordarCache(clave, () => productoRepository.findAll(parametros))
}

async function listarPublico({ page, limit, categoria, proveedor, search, sortBy, descending }) {
  const parametros = { page, limit, categoria, proveedor, disponible: true, search, sortBy, descending }
  const clave = `catalogo:productos:public:${JSON.stringify(parametros)}`
  return recordarCache(clave, () => productoRepository.findAll(parametros))
}

async function obtenerPorId(id) {
  const producto = await productoRepository.findById(id)
  if (!producto) throw new AppError('Producto no encontrado', 404, 'PRODUCTO_NOT_FOUND')
  return producto
}

async function obtenerStats() {
  return recordarCache('catalogo:productos:stats', () => productoRepository.stats())
}

async function obtenerStatsPublico() {
  return recordarCache('catalogo:productos:stats:public', () => productoRepository.statsPublico())
}

async function crear(datos) {
  const { sku, proveedorId } = datos

  const skuExiste = await productoRepository.findBySku(sku)
  if (skuExiste) throw new AppError('SKU duplicado', 409, 'SKU_DUPLICADO')

  const proveedor = await Proveedor.findById(proveedorId)
  if (!proveedor) throw new AppError('Proveedor no encontrado', 404, 'PROVEEDOR_NOT_FOUND')

  const categoria = normalizarCategoria(datos.categoria)
  await asegurarCategoria(categoria)

  const producto = await productoRepository.crear({ ...datos, categoria })
  await invalidarProductos()
  return producto
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
  await invalidarProductos()
  return producto
}

async function eliminar(id) {
  const producto = await productoRepository.deleteById(id)
  if (!producto) throw new AppError('Producto no encontrado', 404, 'PRODUCTO_NOT_FOUND')
  await invalidarProductos()
}

module.exports = { listar, listarPublico, obtenerPorId, obtenerStats, obtenerStatsPublico, crear, actualizar, eliminar }
