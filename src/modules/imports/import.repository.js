import { env } from '../../config/env.js';
import ImportJob from './importJob.model.js';
import Producto from '../productos/producto.model.js';
import Categoria from '../categorias/categoria.model.js';
import proveedorRepository from '../proveedores/proveedor.repository.js';

// Único lugar del módulo imports que toca Mongoose/los modelos.
// No conoce req/res.
class ImportRepository {
  async create(data) {
    return ImportJob.create(data);
  }

  async findById(id) {
    return ImportJob.findById(id);
  }

  async findAll({ page = 1, limit = 20 }) {
    const [docs, total] = await Promise.all([
      ImportJob.find()
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      ImportJob.countDocuments(),
    ]);
    return { docs, total };
  }

  async findProveedorById(id) {
    return proveedorRepository.findById(id);
  }

  async setBullJobId(id, bullJobId) {
    return ImportJob.updateOne({ _id: id }, { $set: { bullJobId } });
  }

  async marcarProcesando(id, total) {
    return ImportJob.updateOne(
      { _id: id },
      { $set: { estado: 'processing', startedAt: new Date(), total } }
    );
  }

  // Incrementa contadores y agrega errores/advertencias respetando el cap (IMPORT_ERRORS_CAP).
  async actualizarProgreso(id, { procesados, exitosos, fallidos, errores, advertencias }) {
    const update = { $inc: { procesados, exitosos, fallidos } };
    if (errores && errores.length) {
      update.$push = {
        errores: { $each: errores, $slice: -env.IMPORT_ERRORS_CAP },
      };
    }
    if (advertencias && advertencias.length) {
      update.$push = update.$push || {};
      update.$push.advertencias = {
        $each: advertencias,
        $slice: -env.IMPORT_ERRORS_CAP,
      };
    }
    return ImportJob.updateOne({ _id: id }, update);
  }

  async marcarCompletado(id, { procesados, exitosos, fallidos }) {
    return ImportJob.updateOne(
      { _id: id },
      {
        $set: {
          estado: 'completed',
          finishedAt: new Date(),
          procesados,
          exitosos,
          fallidos,
        },
      }
    );
  }

  async marcarFallido(id, motivo) {
    return ImportJob.updateOne(
      { _id: id },
      { $set: { estado: 'failed', motivoFallo: motivo, finishedAt: new Date() } }
    );
  }

  // SKUs ya existentes en la BD (para detectar duplicados antes de insertar).
  async findSkusExistentes(skus) {
    const docs = await Producto.find({ sku: { $in: skus } }).select({ sku: 1 });
    return docs.map((doc) => doc.sku);
  }

  // Inserción por lote. ordered:false para que un duplicado no tire el resto del lote.
  async insertarLoteProductos(docs) {
    return Producto.insertMany(docs, { ordered: false });
  }

  // Upsert de categorías nuevas (una operación bulk para todos los slugs únicos).
  async upsertCategorias(entradas) {
    if (!entradas.length) return [];
    const ops = entradas.map(({ slug, nombre }) => ({
      updateOne: {
        filter: { slug },
        update: { $setOnInsert: { slug, nombre } },
        upsert: true,
      },
    }));
    return Categoria.bulkWrite(ops, { ordered: false });
  }
}

export default new ImportRepository();
