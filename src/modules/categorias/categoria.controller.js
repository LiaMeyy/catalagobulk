class CategoriaController {
  async list(req, res, next) {
    try {
      return res.status(200).json({
        message: 'Listado de categorías',
        data: []
      });
    } catch (error) {
      return next(error);
    }
  }

  async getByslug(req, res, next) {
    try {
      const { slug } = req.params;
      return res.status(200).json({
        message: `Categoría ${slug}`,
        data: {}
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, imagenUrl } = req.body;

      return res.status(200).json({
        message: `Categoría ${id} actualizada`,
        data: { }
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new CategoriaController();
