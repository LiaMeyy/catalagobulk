const mongoose = require('mongoose')

const productoSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, index: true },
    nombre: { type: String, required: true, minlength: 1 },
    precio: { type: Number, required: true, min: 0 },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      set: (v) => Math.trunc(v),
    },
    categoria: { type: String, required: true, minlength: 1, index: true },
    descripcion: { type: String, default: null },
    imagenUrl: {
      type: String,
      default: null,
      validate: {
        validator: (v) => v === null || /^https?:\/\/.+/.test(v),
        message: 'URL de imagen inválida',
      },
    },
    proveedorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proveedor',
      required: true,
      index: true,
    },
    disponible: { type: Boolean, default: false },
  },
  { timestamps: true }
)

productoSchema.pre('save', function () {
  this.disponible = this.stock > 0
})

productoSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate()
  if (update && update.stock !== undefined) {
    update.disponible = update.stock > 0
  }
})

module.exports = mongoose.model('Producto', productoSchema, 'productos')
