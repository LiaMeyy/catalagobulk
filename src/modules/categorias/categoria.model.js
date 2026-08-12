const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    descripcion: { type: String },
    activa: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Categoria', categoriaSchema);
