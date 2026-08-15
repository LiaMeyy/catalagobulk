import mongoose from 'mongoose';

const proveedorSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      unique: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },

    contactoEmail: {
      type: String,
      default: null,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,  
    },

    logoUrl: {
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
        message: 'logoUrl debe ser una URL HTTP o HTTPS válida',
      },
    },

    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Proveedor', proveedorSchema, 'proveedores');