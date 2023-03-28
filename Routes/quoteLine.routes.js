const express = require('express');
const checkAuth = require('../Middleware/checkAuth.middleware');
const quoteLineControllers = require('../Controllers/quoteLine.controllers');
const router = express.Router();

router.get('/', checkAuth, quoteLineControllers.getAllQuoteLine);
router.post('/', checkAuth, quoteLineControllers.createQuoteLine);
router.put('/', checkAuth, quoteLineControllers.updateQuoteLine);
router.get('/:id', checkAuth, quoteLineControllers.getQuoteLine);
router.delete('/:id', checkAuth, quoteLineControllers.deleteQuoteLine);

module.exports = router;
