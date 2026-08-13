const mongoose = require('mongoose')

const categoriaSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true },
    nombre: { type: String, required: true },
    descripcion: { type: String, default: null },
    imagenUrl: {
      type: String,
      default: null,
      match: [/^https?:\/\/.+/, 'URL de imagen inválida'],
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Categoria', categoriaSchema, 'categorias')