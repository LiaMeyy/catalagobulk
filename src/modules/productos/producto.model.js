import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    nombre: {
      type: String,
      required: true,
      minlength: 1,
    },

    precio: {
      type: Number,
      required: true,
      min: 0,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'El stock debe ser un número entero',
      },
    },

    categoria: {
      type: String,
      required: true,
      minlength: 1,
    },

    descripcion: {
      type: String,
      default: null,
    },

    imagenUrl: {
      type: String,
      default: null,
      validate: {
        validator: function (value) {
          if (value === null || value === undefined || value === '') {
            return true;
          }

          try {
            const url = new URL(value);
            return url.protocol === 'http:' || url.protocol === 'https:';
          } catch {
            return false;
          }
        },
        message: 'imagenUrl debe ser una URL HTTP/HTTPS válida',
      },
    },

    proveedorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proveedor',
      required: true,
    },

    disponible: {
      type: Boolean,
      default: function () {
        return this.stock > 0;
      },
    },
  },
  {
    timestamps: true,
  }
);

productoSchema.pre('save', function (next) {
  this.disponible = this.stock > 0;
  next();
});

export default mongoose.model('Producto', productoSchema, 'productos');