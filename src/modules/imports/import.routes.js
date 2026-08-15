import express from 'express';
import controller from './import.controller.js';

const router = express.Router();

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/process', controller.process);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.put('/:id/status', controller.changeStatus);

export default router;
