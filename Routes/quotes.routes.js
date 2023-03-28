const express = require('express');
const checkAuth = require('../Middleware/checkAuth.middleware');
const quoteControllers = require('../Controllers/quotes.controllers');
const upload = require('../Middleware/multer.middleware');

const router = express.Router();

router.get('/', checkAuth, quoteControllers.getAllQuotes);
router.post(
  '/',
  checkAuth,
  upload.multipleFileUpload,
  quoteControllers.createQuote,
);
router.put(
  '/:id',
  checkAuth,
  upload.multipleFileUpload,
  quoteControllers.updateQuote,
);
router.get('/:id', checkAuth, quoteControllers.getQuote);
router.delete('/:id', checkAuth, quoteControllers.deleteQuote);

module.exports = router;
