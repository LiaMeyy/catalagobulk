import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { env } from '../../config/env.js';
import Usuario from '../usuarios/usuario.model.js';

class AuthService {
  static async login({ email, password }) {
    if (!email || !password) {
      throw new Error('Email y password son requeridos');
    }

    // password tiene select:false en el modelo, hay que pedirlo explicito.
    const usuario = await Usuario.findOne({ email: email.toLowerCase() }).select('+password');

    if (!usuario) {
      throw new Error('Credenciales invalidas');
    }

    if (!usuario.activo) {
      throw new Error('Usuario inactivo');
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      throw new Error('Credenciales invalidas');
    }

    const token = jwt.sign(
      {
        sub: usuario._id.toString(),
        email: usuario.email,
        role: usuario.rol, 
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: usuario._id,
        email: usuario.email,
        rol: usuario.rol,
      },
    };
  }
}

export default AuthService;