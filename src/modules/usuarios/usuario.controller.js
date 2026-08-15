class UsuarioController {
  async list(req, res, next) {
    try {
      return res.status(200).json({ message: 'Listado de usuarios', data: [] });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      return res.status(200).json({ message: `Usuario ${id}`, data: { id } });
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      return res.status(201).json({ message: 'Usuario creado', data: req.body });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      return res.status(200).json({ message: `Usuario ${id} actualizado`, data: req.body });
    } catch (error) {
      return next(error);
    }
  }

  async changeStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { activo } = req.body;
      return res.status(200).json({
        message: `Estado de usuario ${id} actualizado`,
        data: { id, activo },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new UsuarioController();