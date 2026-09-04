import ImportService from './import.service.js';

// Capa HTTP: solo valida la petición y delega en el service.
// No importa ni usa Mongoose directamente.
class ImportController {
  async create(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Falta el archivo' });
      }

      const { proveedorId } = req.body;
      if (!proveedorId) {
        return res.status(400).json({ message: 'Falta proveedorId' });
      }

      // Lanza AppError(400) si la extensión no es .csv/.json.
      ImportService.detectarFormato(req.file.originalname);

      const resultado = await ImportService.registrarImport({
        usuarioId: req.user?.sub ?? req.user?.id,
        proveedorId,
        archivoNombre: req.file.originalname,
        archivoRuta: req.file.path,
      });

      return res.status(202).json({
        importJobId: resultado.importJobId,
        estado: resultado.estado,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const importJob = await ImportService.obtenerImport(req.params.id);

      const esDueno = importJob.usuarioId.toString() === String(req.user?.sub ?? req.user?.id);
      const esAdmin = req.user?.rol === 'admin';
      if (!esDueno && !esAdmin) {
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
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

      const { docs, total } = await ImportService.listarImports({ page, limit });

      return res.status(200).json({ data: docs, page, limit, total });
    } catch (error) {
      return next(error);
    }
  }
}

export default new ImportController();
