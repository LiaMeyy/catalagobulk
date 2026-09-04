import express from 'express';
import auth from '../../middlewares/auth.js';
import rol from '../../middlewares/rol.js';
import controller from './producto.controller.js';

const router = express.Router();

router.get('/', controller.list);
router.get('/stats', controller.stats);
router.get('/:id', controller.getById);
router.post('/', auth, rol('admin'), controller.create);
router.put('/:id', auth, rol('admin'), controller.update);
router.delete('/:id', auth, rol('admin'), controller.remove);

export default router;
