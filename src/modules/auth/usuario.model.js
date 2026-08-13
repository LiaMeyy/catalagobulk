const mongoose = require('mongoose')

const usuarioSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Formato de email inválido'],
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    rol: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
  },
  { timestamps: true }
)

usuarioSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password
    return ret
  },
})

module.exports = mongoose.model('Usuario', usuarioSchema, 'usuarios')