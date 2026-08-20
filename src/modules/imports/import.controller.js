// import.controller.js
import path from 'path';
import ImportJob from './importJob.model.js';
import Proveedor from '../proveedores/proveedor.model.js';
import importQueue from '../../queues/import.queue.js'; // asume que ya tenés la cola de BullMQ armada

class ImportController {
  async create(req, res, next) {
    try {
      const { proveedorId } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: 'Falta el archivo' });
      }

      if (!proveedorId) {
        return res.status(400).json({ message: 'Falta proveedorId' });
      }

      const extension = path.extname(req.file.originalname).toLowerCase();
      if (extension !== '.csv' && extension !== '.json') {
        return res.status(400).json({ message: 'Extensión de archivo inválida (solo .csv o .json)' });
      }

      const proveedor = await Proveedor.findById(proveedorId);
      if (!proveedor) {
        return res.status(404).json({ message: 'proveedorId no existe' });
      }

      if (!proveedor.activo) {
        return res.status(409).json({ message: 'El proveedor está inactivo, no puede recibir importaciones' });
      }

      const importJob = await ImportJob.create({
        usuarioId: req.usuario.id, // viene del middleware de auth (req.usuario = { id, rol })
        proveedorId,
        archivoNombre: req.file.originalname,
        archivoRuta: req.file.path,
        estado: 'pending',
      });

      // encola el job para que el worker lo procese en segundo plano
      const job = await importQueue.add('procesar-import', {
        importJobId: importJob._id.toString(),
      });

      importJob.bullJobId = job.id;
      await importJob.save();

      return res.status(202).json({
        importJobId: importJob._id,
        estado: importJob.estado,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const importJob = await ImportJob.findById(id);

      if (!importJob) {
        return res.status(404).json({ message: 'Import job no encontrado' });
      }

      // solo el dueño del import o un admin puede consultarlo
      const esDueño = importJob.usuarioId.toString() === req.usuario.id;
      const esAdmin = req.usuario.rol === 'admin';
      if (!esDueño && !esAdmin) {
        return res.status(403).json({ message: 'No tenés permiso para ver este import' });
      }

      const porcentaje = importJob.total
        ? Math.round((importJob.procesados / importJob.total) * 100)
        : 0;

      return res.status(200).json({
        importJobId: importJob._id,
        proveedorId: importJob.proveedorId,
        estado: importJob.estado,
        total: importJob.total,
        procesados: importJob.procesados,
        exitosos: importJob.exitosos,
        fallidos: importJob.fallidos,
        porcentaje,
        errores: importJob.errores,
        startedAt: importJob.startedAt,
        finishedAt: importJob.finishedAt,
      });
    } catch (error) {
      return next(error);
    }
  }

  async list(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);

      const [importJobs, total] = await Promise.all([
        ImportJob.find()
          .skip((page - 1) * limit)
          .limit(limit)
          .sort({ createdAt: -1 }),
        ImportJob.countDocuments(),
      ]);

      return res.status(200).json({ data: importJobs, page, limit, total });
    } catch (error) {
      return next(error);
    }
  }
}

export default new ImportController();