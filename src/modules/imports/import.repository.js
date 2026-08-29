import ImportJob from '../../modules/imports/importJob.model.js';
import Producto from '../../modules/productos/producto.model.js';
import Categoria from '../../modules/categorias/categoria.model.js';

// --- ImportJob ---------------------------------------------------------------

export async function crearImportJob(datos) {
  return ImportJob.create(datos);
}

export async function obtenerImportJobPorId(id) {
  return ImportJob.findById(id);
}

export async function listarImportJobs({ page, limit }) {
  const salto = (page - 1) * limit;

  const [data, total] = await Promise.all([
    ImportJob.find().sort({ createdAt: -1 }).skip(salto).limit(limit),
    ImportJob.countDocuments(),
  ]);

  return { data, total };
}

export async function actualizarImportJob(id, cambios) {
  return ImportJob.findByIdAndUpdate(id, cambios, { new: true });
}

export async function marcarJobProcesando(id, { total, bullJobId }) {
  return ImportJob.findByIdAndUpdate(
    id,
    {
      estado: 'processing',
      total,
      bullJobId,
      startedAt: new Date(),
    },
    { new: true }
  );
}

export async function marcarJobCompletado(id, { exitosos, fallidos, procesados }) {
  return ImportJob.findByIdAndUpdate(
    id,
    {
      estado: 'completed',
      exitosos,
      fallidos,
      procesados,
      finishedAt: new Date(),
    },
    { new: true }
  );
}

export async function marcarJobFallido(id, motivoFallo) {
  return ImportJob.findByIdAndUpdate(
    id,
    {
      estado: 'failed',
      motivoFallo,
      finishedAt: new Date(),
    },
    { new: true }
  );
}

/**
 * Actualiza el progreso (procesados/exitosos/fallidos) y agrega errores
 * respetando el cap configurado (IMPORT_ERRORS_CAP). Se llama al final
 * de cada lote, no fila por fila.
 */
export async function registrarProgresoLote(id, { procesados, exitosos, fallidos, erroresNuevos, cap }) {
  const job = await ImportJob.findById(id).select('errores');
  if (!job) return null;

  const espacioDisponible = Math.max(cap - job.errores.length, 0);
  const erroresAAgregar = erroresNuevos.slice(0, espacioDisponible);

  return ImportJob.findByIdAndUpdate(
    id,
    {
      $set: { procesados, exitosos, fallidos },
      $push: erroresAAgregar.length > 0 ? { errores: { $each: erroresAAgregar } } : undefined,
    },
    { new: true }
  );
}

// --- Productos -----------------------------------------------------------------

/**
 * Devuelve un Set con los SKUs (ya en mayusculas) que existen en la base,
 * para poder detectar duplicados sin una consulta por fila.
 */
export async function obtenerSkusExistentes() {
  const skus = await Producto.distinct('sku');
  return new Set(skus.map((s) => String(s).toUpperCase()));
}

/**
 * Inserta un lote de productos ya normalizados. Usa insertMany con
 * ordered:false para que un duplicado no tumbe el resto del lote.
 * Devuelve { insertados, erroresPorSku } donde erroresPorSku es un
 * Map<sku, motivo> con los que fallaron (ej. condicion de carrera de sku).
 */
export async function insertarLoteProductos(lote) {
  if (lote.length === 0) {
    return { insertados: 0, erroresPorSku: new Map() };
  }

  try {
    const resultado = await Producto.insertMany(lote, { ordered: false });
    return { insertados: resultado.length, erroresPorSku: new Map() };
  } catch (error) {
    // insertMany con ordered:false lanza pero igual inserta los validos.
    // error.insertedDocs / error.writeErrors vienen del driver de Mongo.
    const erroresPorSku = new Map();
    const writeErrors = error.writeErrors || [];

    for (const writeError of writeErrors) {
      const doc = writeError.err?.op || writeError.getOperation?.();
      const sku = doc?.sku || 'desconocido';
      erroresPorSku.set(sku, 'sku duplicado');
    }

    const insertados = lote.length - writeErrors.length;
    return { insertados: Math.max(insertados, 0), erroresPorSku };
  }
}

// --- Categorias ------------------------------------------------------------------

function capitalizarSlug(slug) {
  if (!slug) return slug;
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

/**
 * Crea (upsert) las categorias que no existan todavia. No pisa la
 * metadata de una categoria ya existente (nombre/descripcion/imagen
 * pueden haber sido editadas a mano por el admin).
 */
export async function upsertCategoriasFaltantes(slugsUnicos) {
  const operaciones = slugsUnicos.map((slug) => ({
    updateOne: {
      filter: { slug },
      update: {
        $setOnInsert: {
          slug,
          nombre: capitalizarSlug(slug),
          descripcion: null,
          imagenUrl: null,
        },
      },
      upsert: true,
    },
  }));

  if (operaciones.length === 0) return;

  await Categoria.bulkWrite(operaciones, { ordered: false });
}