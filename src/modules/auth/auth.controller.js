const AuthService = require('./auth.service');

class AuthController {
  async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AuthController();
