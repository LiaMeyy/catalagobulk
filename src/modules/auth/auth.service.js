import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import Usuario from '../usuarios/usuario.model.js';
import AppError from '../../errors/AppError.js';

class AuthService {
  static async login({ email, password }) {
    if (!email || !password) {
      throw new AppError(400, 'Email y password son requeridos', 'CREDENCIALES_FALTANTES');
    }

    const usuario = await Usuario.findOne({ email }).select('+password');
    if (!usuario) {
      throw new AppError(401, 'Credenciales inválidas', 'CREDENCIALES_INVALIDAS');
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      throw new AppError(401, 'Credenciales inválidas', 'CREDENCIALES_INVALIDAS');
    }

    const token = jwt.sign(
      { sub: usuario._id, rol: usuario.rol },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return { token };
  }
}

export default AuthService;
