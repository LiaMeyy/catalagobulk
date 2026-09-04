import express from 'express';
import auth from '../../middlewares/auth.js';
import rol from '../../middlewares/rol.js';
import controller from './categoria.controller.js';

const router = express.Router();

router.get('/', auth, controller.list);
router.get('/:slug', auth, controller.getBySlug);
router.put('/:id', auth, rol('admin'), controller.update);
router.delete('/:id', auth, rol('admin'), controller.remove);
export default router;
