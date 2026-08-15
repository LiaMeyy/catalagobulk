import express from 'express';
import controller from './import.controller.js';

const router = express.Router();

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', controller.create);

export default router;
