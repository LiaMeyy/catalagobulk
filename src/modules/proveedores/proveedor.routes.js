const { Router } = require('express')
const proveedorController = require('./proveedor.controller')
const auth = require('../../middlewares/auth')
const rol = require('../../middlewares/rol')

const router = Router()

// GET /api/proveedores — PÚBLICO (filtros del catálogo)
router.get('/', proveedorController.listar)

// GET /api/proveedores/:id — PÚBLICO
router.get('/:id', proveedorController.obtenerPorId)

// POST /api/proveedores — solo admin
router.post('/', auth, rol('admin'), proveedorController.crear)

// PUT /api/proveedores/:id — solo admin
router.put('/:id', auth, rol('admin'), proveedorController.actualizar)

// DELETE /api/proveedores/:id — solo admin
router.delete('/:id', auth, rol('admin'), proveedorController.eliminar)

module.exports = router