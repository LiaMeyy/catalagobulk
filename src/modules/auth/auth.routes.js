const express = require('express');
const controller = require('./auth.controller');

const router = express.Router();

router.post('/login', controller.login);
router.post('/register', controller.register);
router.get('/me', controller.me);

module.exports = router;
