import mongoose from 'mongoose';

const errorItemSchema = new mongoose.Schema(
  {
    fila: { type: Number, required: true },
    sku: { type: String, default: null },
    motivo: { type: String, required: true },
  },
  { _id: false }
);

const importJobSchema = new mongoose.Schema(
  {
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    proveedorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proveedor', required: true },
    archivoNombre: { type: String, required: true },
    archivoRuta: { type: String, required: true },
    estado: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    total: { type: Number, default: null },
    procesados: { type: Number, default: 0 },
    exitosos: { type: Number, default: 0 },
    fallidos: { type: Number, default: 0 },
    errores: { type: [errorItemSchema], default: [] },
    advertencias: { type: [errorItemSchema], default: [] },
    bullJobId: { type: String, default: null },
    motivoFallo: { type: String, default: null },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('ImportJob', importJobSchema, 'import_jobs');