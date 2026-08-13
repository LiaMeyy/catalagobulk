const { Router } = require('express')
const importController = require('./import.controller')
const auth = require('../../middlewares/auth')
const rol = require('../../middlewares/rol')
const upload = require('../../middlewares/upload')
const { importLimiter } = require('../../middlewares/rateLimit')

const router = Router()

// POST /api/imports — solo admin, multipart, rate limit
router.post(
  '/',
  auth,
  rol('admin'),
  importLimiter,
  upload.single('archivo'),
  importController.crearImport
)

// GET /api/imports — solo admin
router.get('/', auth, rol('admin'), importController.listar)

// GET /api/imports/:id — autenticado (dueño o admin)
router.get('/:id', auth, importController.obtenerPorId)

module.exports = router