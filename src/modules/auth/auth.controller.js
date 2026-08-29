// auth.controller.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Usuario from '../usuarios/usuario.model.js'; // ajustá la ruta si difiere
import { env } from '../../config/env.js';

const SALT_ROUNDS = 10;

class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, rol } = req.body;

      const existente = await Usuario.findOne({ email });
      if (existente) {
        return res.status(409).json({ message: 'El email ya está registrado' });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const nuevoUsuario = await Usuario.create({
        email,
        password: passwordHash,
        rol, // si no viene, el default del schema lo pone en "user"
      });

      return res.status(201).json({
        id: nuevoUsuario._id,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: 'El email ya está registrado' });
      }
      return next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // el password tiene select:false en el schema, así que lo pedimos explícito
      const usuario = await Usuario.findOne({ email }).select('+password');
      if (!usuario) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      const passwordValido = await bcrypt.compare(password, usuario.password);
      if (!passwordValido) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        { sub: usuario._id, role: usuario.rol },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      return res.status(200).json({ token });
    } catch (error) {
      return next(error);
    }
  }
}

export default new AuthController();