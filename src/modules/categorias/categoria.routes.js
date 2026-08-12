const express = require('express');
const controller = require('./categoria.controller');

const router = express.Router();

router.get('/', controller.list);
router.post('/', controller.create);

module.exports = router;
