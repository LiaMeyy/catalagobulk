class ProveedorController {
  async list(req, res) {
    return res.status(200).json({ message: 'Listado de proveedores' });
  }

  async create(req, res) {
    return res.status(201).json({ message: 'Proveedor creado', data: req.body });
  }
}

module.exports = new ProveedorController();
