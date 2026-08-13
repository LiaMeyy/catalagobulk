const { Router } = require('express')
const authController = require('./auth.controller')
const { loginLimiter } = require('../../middlewares/rateLimit')

const router = Router()

// POST /api/auth/register — público
router.post('/register', authController.register)

// POST /api/auth/login — público con rate limit
router.post('/login', loginLimiter, authController.login)

module.exports = router