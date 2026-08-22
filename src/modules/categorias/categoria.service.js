const categoriaRepository = require('./categoria.repository')
const AppError = require('../../errors/AppError')

async function listar() {
  return categoriaRepository.findAll()
}

async function obtenerPorSlug(slug) {
  const categoria = await categoriaRepository.findBySlug(slug)
  if (!categoria) throw new AppError('Categoría no encontrada', 404, 'CATEGORIA_NOT_FOUND')
  return categoria
}

async function actualizar(id, datos) {
  const { nombre, descripcion, imagenUrl } = datos
  const categoria = await categoriaRepository.updateById(id, { nombre, descripcion, imagenUrl })
  if (!categoria) throw new AppError('Categoría no encontrada', 404, 'CATEGORIA_NOT_FOUND')
  return categoria
}

async function eliminar(id) {
  const categoria = await categoriaRepository.deleteById(id)
  if (!categoria) throw new AppError('Categoría no encontrada', 404, 'CATEGORIA_NOT_FOUND')
}

module.exports = { listar, obtenerPorSlug, actualizar, eliminar }
