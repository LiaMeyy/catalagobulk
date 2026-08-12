const express = require('express');
const controller = require('./import.controller');

const router = express.Router();

router.post('/import', controller.process);

module.exports = router;
