class AuthController {
  async login(req, res, next) {
    try {
      return res.status(200).json({
        message: 'Login exitoso',
        data: req.body,
      });
    } catch (error) {
      return next(error);
    }
  }

  async register(req, res, next) {
    try {
      return res.status(201).json({
        message: 'Usuario registrado',
        data: req.body,
      });
    } catch (error) {
      return next(error);
    }
  }

  async me(req, res, next) {
    try {
      return res.status(200).json({
        message: 'Perfil del usuario',
        data: {
          id: req.user?.id || 1,
          name: 'Usuario actual',
        },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new AuthController();
