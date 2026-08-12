const mongoose = require('mongoose');

const proveedorSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    email: { type: String },
    telefono: { type: String },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Proveedor', proveedorSchema);
