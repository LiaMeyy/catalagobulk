const { Router } = require('express')
const productoController = require('./producto.controller')
const auth = require('../../middlewares/auth')
const rol = require('../../middlewares/rol')

const router = Router()

// PÚBLICO — Catálogo e-commerce (sin autenticación)
router.get('/public/stats', productoController.obtenerStatsPublico)
router.get('/public', productoController.listarPublico)

// PRIVADO — Panel admin (autenticado)
router.get('/stats', auth, productoController.obtenerStats)
router.get('/', auth, productoController.listar)
router.get('/:id', auth, productoController.obtenerPorId)

// POST /api/productos — solo admin
router.post('/', auth, rol('admin'), productoController.crear)

// PUT /api/productos/:id — solo admin
router.put('/:id', auth, rol('admin'), productoController.actualizar)

// DELETE /api/productos/:id — solo admin
router.delete('/:id', auth, rol('admin'), productoController.eliminar)

module.exports = router