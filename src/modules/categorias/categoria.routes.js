const { Router } = require('express')
const categoriaController = require('./categoria.controller')
const auth = require('../../middlewares/auth')
const rol = require('../../middlewares/rol')

const router = Router()

// GET /api/categorias — autenticado
router.get('/', auth, categoriaController.listar)

// GET /api/categorias/:slug — autenticado
router.get('/:slug', auth, categoriaController.obtenerPorSlug)

// PUT /api/categorias/:id — solo admin
router.put('/:id', auth, rol('admin'), categoriaController.actualizar)

module.exports = router