const Producto = require('./producto.model')
const Proveedor = require('../proveedores/proveedor.model')

async function findAll({
  page = 1,
  limit = 20,
  categoria,
  proveedor,
  disponible,
  search,
  sortBy = 'nombre',
  descending = 'false',
}) {
  const filtro = {}

  if (categoria) filtro.categoria = categoria
  if (search) filtro.nombre = { $regex: search, $options: 'i' }

  if (proveedor) {
    // puede ser slug o id
    if (proveedor.match(/^[0-9a-fA-F]{24}$/)) {
      filtro.proveedorId = proveedor
    } else {
      const prov = await Proveedor.findOne({ slug: proveedor })
      if (!prov) return { data: [], page, limit, total: 0 }
      if (prov) filtro.proveedorId = prov._id
    }
  }

  if (disponible !== undefined) filtro.disponible = disponible === 'true'

  const skip = (page - 1) * limit
  const camposOrdenables = new Set(['nombre', 'precio', 'stock', 'createdAt'])
  const campoOrden = camposOrdenables.has(sortBy) ? sortBy : 'nombre'
  const orden = descending === true || descending === 'true' ? -1 : 1

  const [data, total] = await Promise.all([
    Producto.find(filtro).sort({ [campoOrden]: orden }).skip(skip).limit(limit),
    Producto.countDocuments(filtro),
  ])

  return { data, page, limit, total }
}

async function findById(id) {
  return Producto.findById(id)
}

async function findBySku(sku) {
  return Producto.findOne({ sku })
}

async function crear(datos) {
  return Producto.create(datos)
}

async function updateById(id, datos) {
  return Producto.findByIdAndUpdate(id, datos, { new: true, runValidators: true })
}

async function deleteById(id) {
  return Producto.findByIdAndDelete(id)
}

async function stats() {
  const [totalProductos, precioPromedio, porCategoria] = await Promise.all([
    Producto.countDocuments(),
    Producto.aggregate([{ $group: { _id: null, avg: { $avg: '$precio' } } }]),
    Producto.aggregate([
      { $group: { _id: '$categoria', count: { $sum: 1 } } },
      { $project: { _id: 0, categoria: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]),
  ])

  return {
    totalProductos,
    precioPromedio: precioPromedio[0] ? Math.round(precioPromedio[0].avg * 100) / 100 : 0,
    porCategoria,
  }
}

async function statsPublico() {
  const [totalProductos, precioPromedio, porCategoria] = await Promise.all([
    Producto.countDocuments({ disponible: true }),
    Producto.aggregate([
      { $match: { disponible: true } },
      { $group: { _id: null, avg: { $avg: '$precio' } } }
    ]),
    Producto.aggregate([
      { $match: { disponible: true } },
      { $group: { _id: '$categoria', count: { $sum: 1 } } },
      { $project: { _id: 0, categoria: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]),
  ])

  return {
    totalProductos,
    precioPromedio: precioPromedio[0] ? Math.round(precioPromedio[0].avg * 100) / 100 : 0,
    porCategoria,
  }
}

async function countByProveedor(proveedorId) {
  return Producto.countDocuments({ proveedorId })
}

module.exports = { findAll, findById, findBySku, crear, updateById, deleteById, stats, statsPublico, countByProveedor }
