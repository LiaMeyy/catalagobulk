const mongoose = require('mongoose');

const proveedorSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/},
    password: { type: String, required: true, select: false},
    rol: {type: String, enum:['admin', 'user'], default: 'user'}
  },
  { timestamps: true }
);

module.exports = mongoose.model('Proveedor', proveedorSchema);
