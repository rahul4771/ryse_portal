const express = require('express');
const checkAuth = require('../Middleware/checkAuth.middleware');
const adminControllers = require('../Controllers/admin.controllers');
const router = express.Router();

router.get('/:id', adminControllers.impersonateUser);

module.exports = router;
