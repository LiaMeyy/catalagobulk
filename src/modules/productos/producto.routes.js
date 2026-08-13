const { Router } = require('express')
const productoController = require('./producto.controller')
const auth = require('../../middlewares/auth')
const rol = require('../../middlewares/rol')

const router = Router()

// GET /api/productos/stats — autenticado (antes de /:id para no colisionar)
router.get('/stats', auth, productoController.obtenerStats)

// GET /api/productos — autenticado
router.get('/', auth, productoController.listar)

// GET /api/productos/:id — autenticado
router.get('/:id', auth, productoController.obtenerPorId)

// POST /api/productos — solo admin
router.post('/', auth, rol('admin'), productoController.crear)

// PUT /api/productos/:id — solo admin
router.put('/:id', auth, rol('admin'), productoController.actualizar)

// DELETE /api/productos/:id — solo admin
router.delete('/:id', auth, rol('admin'), productoController.eliminar)

module.exports = router