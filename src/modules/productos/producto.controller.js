class ProductoController {
  async list(req, res, next) {
    try {
      return res.status(200).json({ message: 'Listado de productos', data: [] });
    } catch (error) {
      return next(error);
    }
  }

  async stats(req, res, next) {
    try {
      return res.status(200).json({message: `Características de los productos`, data: []})
    } catch (error) {
      return next(error)
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      return res.status(200).json({ message: `Producto ${id}`, data: { id } });
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      return res.status(201).json({ message: 'Producto creado', data: req.body });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      return res.status(200).json({ message: `Producto ${id} actualizado`, data: req.body });
    } catch (error) {
      return next(error);
    }
  }

  async delete(req, res, next){
    try {
      const {id} = req.params;
      return res.status(204).send()
    } catch (error) {
      return next(error)
    }
  }
}

export default new ProductoController();
