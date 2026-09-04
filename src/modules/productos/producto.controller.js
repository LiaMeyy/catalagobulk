// producto.controller.js
import mongoose from 'mongoose';
import Producto from './producto.model.js';
import Proveedor from '../proveedores/proveedor.model.js'; // ajustá la ruta si difiere

class ProductoController {
  async list(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const filtro = { activo: true };

      if (req.query.activo !== undefined) {
        filtro.activo = req.query.activo === 'true';
      }

      if (req.query.categoria) {
        filtro.categoria = req.query.categoria;
      }

      if (req.query.disponible !== undefined) {
        filtro.disponible = req.query.disponible === 'true';
      }

      if (req.query.proveedor) {
        // puede venir como id o como slug
        if (mongoose.Types.ObjectId.isValid(req.query.proveedor)) {
          filtro.proveedorId = req.query.proveedor;
        } else {
          const proveedor = await Proveedor.findOne({ slug: req.query.proveedor });
          filtro.proveedorId = proveedor ? proveedor._id : null; // si no existe, que devuelva vacío, no todo
        }
      }

      const [productos, total] = await Promise.all([
        Producto.find(filtro)
          .skip((page - 1) * limit)
          .limit(limit),
        Producto.countDocuments(filtro),
      ]);

      return res.status(200).json({
        data: productos,
        page,
        limit,
        total,
      });
    } catch (error) {
      return next(error);
    }
  }

  async stats(req, res, next) {
    try {
      const [totales] = await Producto.aggregate([
        {
          $group: {
            _id: null,
            totalProductos: { $sum: 1 },
            precioPromedio: { $avg: '$precio' },
          },
        },
      ]);

      const porCategoriaRaw = await Producto.aggregate([
        { $group: { _id: '$categoria', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      const porCategoria = porCategoriaRaw.map((item) => ({
        categoria: item._id,
        count: item.count,
      }));

      return res.status(200).json({
        totalProductos: totales?.totalProductos || 0,
        precioPromedio: totales ? Math.round(totales.precioPromedio * 100) / 100 : 0,
        porCategoria,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const producto = await Producto.findById(id);
      if (!producto) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }
      return res.status(200).json({ message: `Producto ${id}`, data: producto });
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { proveedorId, stock } = req.body;

      const proveedor = await Proveedor.findById(proveedorId);
      if (!proveedor) {
        return res.status(404).json({ message: 'proveedorId no existe' });
      }

      const nuevoProducto = await Producto.create({
        ...req.body,
        disponible: stock > 0, // derivado, no se confía en lo que mande el cliente
      });

      return res.status(201).json({ message: 'Producto creado', data: nuevoProducto });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: 'sku duplicado' });
      }
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const data = { ...req.body };

      // si viene stock en el update, recalculamos disponible
      if (data.stock !== undefined) {
        data.disponible = data.stock > 0;
      }

      const producto = await Producto.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });

      if (!producto) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      return res.status(200).json({ message: `Producto ${id} actualizado`, data: producto });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: 'sku duplicado' });
      }
      return next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const { id } = req.params;
      const producto = await Producto.findByIdAndUpdate(
        id,
        { activo: false },
        { new: true, runValidators: true }
      );
      if (!producto) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }
      return res.status(200).json({ message: `Producto ${id} desactivado`, data: producto });
    } catch (error) {
      return next(error);
    }
  }
}

export default new ProductoController();