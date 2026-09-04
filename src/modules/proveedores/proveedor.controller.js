// proveedor.controller.js
import Proveedor from './proveedor.model.js'; // ajustá la ruta si el modelo está en otro lado

class ProveedorController {
  async list(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filtro = { activo: true };

      if (req.query.activo !== undefined) {
        filtro.activo = req.query.activo === 'true';
      }

      const [proveedores, total] = await Promise.all([
        Proveedor.find(filtro)
          .skip((page - 1) * limit)
          .limit(limit),
        Proveedor.countDocuments(filtro),
      ]);

      return res.status(200).json({
        data: proveedores,
        page,
        limit,
        total,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const proveedor = await Proveedor.findById(id);
      if (!proveedor) {
        return res.status(404).json({ message: 'Proveedor no encontrado' });
      }
      return res.status(200).json({ message: `Proveedor ${id}`, data: proveedor });
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const nuevoProveedor = await Proveedor.create(req.body);
      return res.status(201).json({ message: 'Proveedor creado', data: nuevoProveedor });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: 'Nombre o slug ya registrado' });
      }
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const proveedor = await Proveedor.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!proveedor) {
        return res.status(404).json({ message: 'Proveedor no encontrado' });
      }
      return res.status(200).json({ message: `Proveedor ${id} actualizado`, data: proveedor });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: 'Nombre o slug ya registrado' });
      }
      return next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const { id } = req.params;
      const proveedor = await Proveedor.findByIdAndUpdate(
        id,
        { activo: false },
        { new: true, runValidators: true }
      );
      if (!proveedor) {
        return res.status(404).json({ message: 'Proveedor no encontrado' });
      }
      return res.status(200).json({ message: `Proveedor ${id} desactivado`, data: proveedor });
    } catch (error) {
      return next(error);
    }
  }
}

export default new ProveedorController();