class CategoriaController {
  async list(req, res) {
    return res.status(200).json({ message: 'Listado de categorías' });
  }

  async create(req, res) {
    return res.status(201).json({ message: 'Categoría creada', data: req.body });
  }
}

module.exports = new CategoriaController();
