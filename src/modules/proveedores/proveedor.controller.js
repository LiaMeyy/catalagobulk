class ProveedorController {
  async list(req, res, next) {
    try {
      return res.status(200).json({ message: 'Listado de proveedores', data: [] });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      return res.status(200).json({ message: `Proveedor ${id}`, data: { id } });
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      return res.status(201).json({ message: 'Proveedor creado', data: req.body });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      return res.status(200).json({ message: `Proveedor ${id} actualizado`, data: req.body });
    } catch (error) {
      return next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      return res.status(204).send()
    } catch (error) {
      return next(error);
    }
  }
}

export default new ProveedorController();
