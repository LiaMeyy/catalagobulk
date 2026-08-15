class ProductoController {
  async list(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        categoria,
        proveedor,
        disponible
      } = req.query;

      return res.status(200).json({
        message: 'Listado de productos',
        data: [],
        page: Number(page),
        limit: Number(limit),
        total: 0,
        filters: {
          categoria: categoria || null,
          proveedor: proveedor || null,
          disponible: disponible ?? null
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  async stats(req, res, next) {
    try {
      return res.status(200).json({
        message: 'Estadísticas de productos',
        data: {
          totalProductos: 0,
          precioPromedio: 0,
          porCategoria: []
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
        message: `Producto ${id}`,
        data: { id }
      });
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { sku, nombre, precio, stock, categoria, proveedorId } = req.body;

      if (!sku || !nombre || !precio || stock === undefined || !categoria || !proveedorId) {
        return res.status(400).json({ message: 'Faltan campos requeridos.' });
      }

      return res.status(201).json({
        message: 'Producto creado',
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
        message: `Producto ${id} actualizado`,
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

export default new ProductoController();
