const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true },
    nombre: { type: String, required: true },
    precio: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Producto', productoSchema);
