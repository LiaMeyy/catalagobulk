import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    password: { type: String, required: true, select: false },
    rol: { type: String, enum: ['admin', 'user'], default: 'user' },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Usuario', usuarioSchema, 'usuarios');
