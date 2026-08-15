class CategoriaController {
  async list(req, res, next) {
    try {
      return res.status(200).json({ message: 'Listado de categorías', data: [] });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      return res.status(200).json({ message: `Categoría ${id}`, data: { id } });
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      return res.status(201).json({ message: 'Categoría creada', data: req.body });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      return res.status(200).json({ message: `Categoría ${id} actualizada`, data: req.body });
    } catch (error) {
      return next(error);
    }
  }

  async changeStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { activo } = req.body;
      return res.status(200).json({
        message: `Estado de categoría ${id} actualizado`,
        data: { id, activo },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new CategoriaController();
