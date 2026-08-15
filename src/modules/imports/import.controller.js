class ImportController {
  async list(req, res, next) {
    try {
      return res.status(200).json({ message: 'Listado de import jobs', data: [] });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      return res.status(200).json({ message: `Importación ${id}`, data: {} });
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { proveedorId } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: 'Se requiere un archivo CSV o JSON.' });
      }

      if (!proveedorId) {
        return res.status(400).json({ message: 'Falta proveedorId.' });
      }

      const extension = file.originalname.split('.').pop()?.toLowerCase();
      const allowed = ['csv', 'json'];

      if (!allowed.includes(extension)) {
        return res.status(400).json({ message: 'Extensión de archivo inválida.' });
      }

      return res.status(202).json({
        message: 'Importación encolada',
        data: {}
      });
    } catch (error) {
      return next(error);
    }
  }

  async process(req, res, next) {
    try {
      return res.status(200).json({ message: 'Importación iniciada', data: req.body });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      return res.status(200).json({ message: `Importación ${id} actualizada`, data: req.body });
    } catch (error) {
      return next(error);
    }
  }

  async changeStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { activo } = req.body;
      return res.status(200).json({
        message: `Estado de importación ${id} actualizado`,
        data: { id, activo },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new ImportController();
