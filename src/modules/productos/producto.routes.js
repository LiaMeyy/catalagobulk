import express from 'express';
import controller from './producto.controller.js';

const router = express.Router();

router.get('/', controller.list);
router.get('/stats', controller.stats)
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
