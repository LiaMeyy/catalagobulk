const mongoose = require('mongoose')

const proveedorSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido (ej: acme-corp)'],
    },
    contactoEmail: {
      type: String,
      default: null,
      match: [/^\S+@\S+\.\S+$/, 'Formato de email inválido'],
    },
    logoUrl: {
      type: String,
      default: null,
      match: [/^https?:\/\/.+/, 'URL de logo inválida'],
    },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Proveedor', proveedorSchema, 'proveedores')