const { Router } = require('express')
const usuarioController = require('./usuario.controller')
const auth = require('../../middlewares/auth')
const rol = require('../../middlewares/rol')

const router = Router()

router.use(auth, rol('admin'))

router.get('/', usuarioController.listar)
router.get('/:id', usuarioController.obtenerPorId)
router.post('/', usuarioController.crear)
router.put('/:id', usuarioController.actualizar)
router.delete('/:id', usuarioController.eliminar)

module.exports = router
