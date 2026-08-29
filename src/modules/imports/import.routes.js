import { Router } from 'express';

import auth from '../../middlewares/auth.js';
import rol from '../../middlewares/rol.js';
import upload from '../../middlewares/upload.js';

import {
  subirImport,
  obtenerEstadoImport,
  listarImportsController,
} from './import.controller.js';

const router = Router();


router.post('/', auth, rol(['admin']), upload.single('archivo'), subirImport);


router.get('/:id', auth, obtenerEstadoImport);


router.get('/', auth, rol(['admin']), listarImportsController);

export default router;