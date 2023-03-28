const express = require('express');
const checkAuth = require('../Middleware/checkAuth.middleware');
const userControllers = require('../Controllers/users.controllers');
const router = express.Router();

router.get('/', checkAuth, userControllers.getAllUsers);
router.post('/', checkAuth, userControllers.createUser);
router.put('/:id', checkAuth, userControllers.updateUser);
router.get('/:id', checkAuth, userControllers.getUser);
router.delete('/:id', checkAuth, userControllers.deleteUser);

router.post('/quote', checkAuth, userControllers.createQuote);

module.exports = router;
