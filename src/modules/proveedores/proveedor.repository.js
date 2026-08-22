const Proveedor = require('./proveedor.model')

async function findAll({ page = 1, limit = 20, activo }) {
  const filtro = {}
  if (activo !== undefined) filtro.activo = activo === 'true'

  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    Proveedor.find(filtro).skip(skip).limit(limit),
    Proveedor.countDocuments(filtro),
  ])

  return { data, page, limit, total }
}

async function findById(id) {
  return Proveedor.findById(id)
}

async function findByNombreOSlug({ nombre, slug }) {
  return Proveedor.findOne({ $or: [{ nombre }, { slug }] })
}

async function findDuplicadoParaUpdate(id, { nombre, slug }) {
  const condiciones = []
  if (nombre) condiciones.push({ nombre })
  if (slug) condiciones.push({ slug })
  if (condiciones.length === 0) return null

  return Proveedor.findOne({
    _id: { $ne: id },
    $or: condiciones,
  })
}

async function crear(datos) {
  return Proveedor.create(datos)
}

async function updateById(id, datos) {
  return Proveedor.findByIdAndUpdate(id, datos, { new: true, runValidators: true })
}

async function deleteById(id) {
  return Proveedor.findByIdAndDelete(id)
}

module.exports = {
  findAll,
  findById,
  findByNombreOSlug,
  findDuplicadoParaUpdate,
  crear,
  updateById,
  deleteById,
}
