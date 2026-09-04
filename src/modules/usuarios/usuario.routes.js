import express from 'express';
import auth from '../../middlewares/auth.js';
import rol from '../../middlewares/rol.js';
import controller from './usuario.controller.js';

const router = express.Router();

router.get('/', auth, rol('admin'), controller.list);
router.get('/:id', auth, rol('admin'), controller.getById);
router.post('/', auth, rol('admin'), controller.create);
router.put('/:id', auth, rol('admin'), controller.update);
router.put('/:id/status', auth, rol('admin'), controller.changeStatus);
router.delete('/:id', auth, rol('admin'), controller.remove);

export default router;