// usuario.controller.js
import bcrypt from 'bcrypt';
import Usuario from './usuario.model.js'; // ajustá la ruta si el modelo está en otro lado

const SALT_ROUNDS = 10;

class UsuarioController {
  async list(req, res, next) {
    try {
      const usuarios = await Usuario.find();
      return res.status(200).json({ message: 'Listado de usuarios', data: usuarios });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const usuario = await Usuario.findById(id);
      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      return res.status(200).json({ message: `Usuario ${id}`, data: usuario });
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const data = { ...req.body };
      if (data.password) {
        data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
      }
      const nuevoUsuario = await Usuario.create(data);
      const { password, ...usuarioSinPassword } = nuevoUsuario.toObject();
      return res.status(201).json({ message: 'Usuario creado', data: usuarioSinPassword });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: 'El email ya está registrado' });
      }
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const data = { ...req.body };
      if (data.password) {
        data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
      }
      const usuario = await Usuario.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });
      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      return res.status(200).json({ message: `Usuario ${id} actualizado`, data: usuario });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: 'El email ya está registrado' });
      }
      return next(error);
    }
  }

  async changeStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { activo } = req.body;
      const usuario = await Usuario.findByIdAndUpdate(id, { activo }, { new: true });
      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      return res.status(200).json({
        message: `Estado de usuario ${id} actualizado`,
        data: usuario,
      });
    } catch (error) {
      return next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const { id } = req.params;
      const usuario = await Usuario.findByIdAndDelete(id);
      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
}

export default new UsuarioController();