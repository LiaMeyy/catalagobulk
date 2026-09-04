import express from 'express';
import auth from '../../middlewares/auth.js';
import rol from '../../middlewares/rol.js';
import controller from './proveedor.controller.js';

const router = express.Router();

router.get('/', auth, controller.list);
router.get('/:id', auth, controller.getById);
router.post('/', auth, rol('admin'), controller.create);
router.put('/:id', auth, rol('admin'), controller.update);
router.delete('/:id', auth, rol('admin'), controller.remove);

export default router;
