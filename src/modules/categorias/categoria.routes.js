const { Router } = require('express')
const categoriaController = require('./categoria.controller')
const auth = require('../../middlewares/auth')
const rol = require('../../middlewares/rol')

const router = Router()

// GET /api/categorias — PÚBLICO (filtros del catálogo)
router.get('/', categoriaController.listar)

// GET /api/categorias/:slug — PÚBLICO
router.get('/:slug', categoriaController.obtenerPorSlug)

// PUT /api/categorias/:id — solo admin
router.put('/:id', auth, rol('admin'), categoriaController.actualizar)

// DELETE /api/categorias/:id — solo admin
router.delete('/:id', auth, rol('admin'), categoriaController.eliminar)

module.exports = router