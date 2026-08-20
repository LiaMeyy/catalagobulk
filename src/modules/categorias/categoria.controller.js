// categoria.controller.js
import Categoria from './categoria.model.js';

class CategoriaController {
  async list(req, res, next) {
    try {
      const categorias = await Categoria.find();
      return res.status(200).json({ message: 'Listado de categorías', data: categorias });
    } catch (error) {
      return next(error);
    }
  }

  async getBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const categoria = await Categoria.findOne({ slug });
      if (!categoria) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }
      return res.status(200).json({ message: `Categoría ${slug}`, data: categoria });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, imagenUrl } = req.body;

      // el slug NO se edita: es la llave que une con los productos
      const data = { nombre, descripcion, imagenUrl };

      const categoria = await Categoria.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });

      if (!categoria) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }

      return res.status(200).json({ message: `Categoría ${id} actualizada`, data: categoria });
    } catch (error) {
      return next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const { id } = req.params;
      const categoria = await Categoria.findByIdAndDelete(id);
      if (!categoria) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }
      // ojo: borrar la categoría NO borra los productos que la referencian
      // quedarían apuntando a un slug sin metadata (comportamiento esperado según el PDF)
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
}

export default new CategoriaController();