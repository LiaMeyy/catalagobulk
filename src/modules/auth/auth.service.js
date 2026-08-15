import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

class AuthService {
  static async login({ email, password }) {
    if (!email || !password) {
      throw new Error('Email y password son requeridos');
    }

    const token = jwt.sign({ email, role: 'admin' }, env.JWT_SECRET, {
      expiresIn: '8h',
    });

    return {
      token,
      user: { email, role: 'admin' },
    };
  }
}

export default AuthService;
