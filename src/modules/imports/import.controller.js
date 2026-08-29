import fs from 'fs';
import AppError from '../../errors/AppError.js';
import { crearImport, obtenerImport, listarImports, procesarImport } from './import.service.js';

function calcularPorcentaje(job) {
  if (!job.total) return 0;
  return Math.round((job.procesados / job.total) * 100);
}

function serializarJob(job) {
  return {
    importJobId: job._id,
    proveedorId: job.proveedorId,
    estado: job.estado,
    total: job.total,
    procesados: job.procesados,
    exitosos: job.exitosos,
    fallidos: job.fallidos,
    porcentaje: calcularPorcentaje(job),
    errores: job.errores,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
  };
}

export async function subirImport(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError('Falta el archivo (campo "archivo")', 400, 'ARCHIVO_REQUERIDO');
    }

    const { proveedorId } = req.body;
    if (!proveedorId) {
      // Limpiamos el archivo que Multer ya guardo, no sirve de nada.
      fs.unlink(req.file.path, () => {});
      throw new AppError('Falta proveedorId', 400, 'PROVEEDOR_ID_REQUERIDO');
    }

    const job = await crearImport({
      usuarioId: req.user.sub,
      proveedorId,
      archivoNombre: req.file.originalname,
      archivoRuta: req.file.path,
    });

    // Sin Redis/BullMQ todavia: procesamos en segundo plano dentro del
    // mismo proceso Node, sin bloquear la respuesta. `procesarImport` no
    // se espera (no `await`) para que el POST responda de inmediato.
    // Cuando agregues Redis, esto se reemplaza por encolarImport(job._id)
    // y un worker aparte (ver queues/import.queue.js y workers/import.worker.js,
    // ya estan escritos y listos para cuando quieras dar el salto).
    procesarImport(job._id.toString()).catch((error) => {
      console.error(`[import ${job._id}] fallo procesando en segundo plano:`, error.message);
    });

    res.status(202).json({ importJobId: job._id, estado: 'pending' });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    next(error);
  }
}

export async function obtenerEstadoImport(req, res, next) {
  try {
    const job = await obtenerImport(req.params.id);

    const esDueño = job.usuarioId.toString() === req.user.sub;
    if (!esDueño && req.user.role !== 'admin') {
      throw new AppError('No autorizado para ver este import', 403, 'NO_AUTORIZADO');
    }

    res.json(serializarJob(job));
  } catch (error) {
    next(error);
  }
}

export async function listarImportsController(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { data, total } = await listarImports({ page, limit });

    res.json({
      data: data.map(serializarJob),
      page: Number(page),
      limit: Number(limit),
      total,
    });
  } catch (error) {
    next(error);
  }
}