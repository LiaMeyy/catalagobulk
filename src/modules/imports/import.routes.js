import express from 'express';
import auth from '../../middlewares/auth.js';
import rol from '../../middlewares/rol.js';
import upload from '../../middlewares/upload.js';
import controller from './import.controller.js';

const router = express.Router();

router.get('/', auth, rol('admin'), controller.list);
router.get('/:id', auth, controller.getById);
router.post('/', auth, rol('admin'), upload.single('archivo'), controller.create);

export default router;
