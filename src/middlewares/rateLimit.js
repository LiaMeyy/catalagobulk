const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Demasiadas peticiones, intenta nuevamente más tarde.',
  },
});

module.exports = limiter;
