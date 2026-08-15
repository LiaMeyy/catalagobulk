import express from 'express';
import controller from './categoria.controller.js';

const router = express.Router();

router.get('/', controller.list);
router.get('/:slug', controller.getByslug);
router.put('/:id', controller.update);
export default router;
