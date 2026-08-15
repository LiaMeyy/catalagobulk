const express = require('express');
const controller = require('./producto.controller');

const router = express.Router();

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.put('/:id/status', controller.changeStatus);

module.exports = router;
