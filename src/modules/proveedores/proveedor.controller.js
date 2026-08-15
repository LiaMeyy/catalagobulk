class ProveedorController {
  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, activo } = req.query;

      return res.status(200).json({
        message: 'Listado de proveedores',
        data: [],
        page: Number(page),
        limit: Number(limit),
        total: 0,
        filters: {
          activo: activo ?? null
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      return res.status(200).json({
        message: `Proveedor ${id}`,
        data: { id }
      });
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { nombre, slug } = req.body;

      if (!nombre || !slug) {
        return res.status(400).json({ message: 'Nombre y slug son obligatorios.' });
      }

      return res.status(201).json({
        message: 'Proveedor creado',
        data: req.body
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      return res.status(200).json({
        message: `Proveedor ${id} actualizado`,
        data: req.body
      });
    } catch (error) {
      return next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
}

export default new ProveedorController();
