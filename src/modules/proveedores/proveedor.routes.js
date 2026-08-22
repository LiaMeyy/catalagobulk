const { Router } = require('express')
const proveedorController = require('./proveedor.controller')
const auth = require('../../middlewares/auth')
const rol = require('../../middlewares/rol')

const router = Router()

// GET /api/proveedores — autenticado
router.get('/', auth, proveedorController.listar)

// GET /api/proveedores/:id — autenticado
router.get('/:id', auth, proveedorController.obtenerPorId)

// POST /api/proveedores — solo admin
router.post('/', auth, rol('admin'), proveedorController.crear)

// PUT /api/proveedores/:id — solo admin
router.put('/:id', auth, rol('admin'), proveedorController.actualizar)

// DELETE /api/proveedores/:id — solo admin
router.delete('/:id', auth, rol('admin'), proveedorController.eliminar)

module.exports = router
