class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, rol } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email y password son obligatorios.' });
      }

      const userRol = rol || 'user';

      return res.status(201).json({
        message: 'Usuario registrado',
        data: {
          id: 'generated-id',
          email,
          rol: userRol
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email y password son obligatorios.' });
      }

      return res.status(200).json({
        message: 'Login exitoso',
        data: {
          token: 'jwt-token-placeholder'
        }
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new AuthController();
