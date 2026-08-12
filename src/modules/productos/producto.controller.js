class ProductoController {
  async list(req, res) {
    return res.status(200).json({ message: 'Listado de productos' });
  }

  async create(req, res) {
    return res.status(201).json({ message: 'Producto creado', data: req.body });
  }
}

module.exports = new ProductoController();
