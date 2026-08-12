const jwt = require('jsonwebtoken');
const { env } = require('../../config/env');

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

module.exports = AuthService;
