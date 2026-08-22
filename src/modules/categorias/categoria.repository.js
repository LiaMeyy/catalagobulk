const Categoria = require('./categoria.model')

async function findAll() {
  return Categoria.find().sort({ slug: 1 })
}

async function findBySlug(slug) {
  return Categoria.findOne({ slug })
}

async function findById(id) {
  return Categoria.findById(id)
}

async function crear(datos) {
  return Categoria.create(datos)
}

async function updateById(id, datos) {
  return Categoria.findByIdAndUpdate(id, datos, { new: true, runValidators: true })
}

async function deleteById(id) {
  return Categoria.findByIdAndDelete(id)
}

async function upsertBySlug(slug) {
  const nombre = slug.charAt(0).toUpperCase() + slug.slice(1)
  return Categoria.findOneAndUpdate(
    { slug },
    { $setOnInsert: { slug, nombre, descripcion: null, imagenUrl: null } },
    { upsert: true, new: true }
  )
}

module.exports = { findAll, findBySlug, findById, crear, updateById, deleteById, upsertBySlug }
