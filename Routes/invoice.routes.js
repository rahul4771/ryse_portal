const express = require('express');
const checkAuth = require('../Middleware/checkAuth.middleware');
const invoiceControllers = require('../Controllers/invoice.controllers');
const upload = require('../Middleware/multer.middleware');
const router = express.Router();

router.get('/', checkAuth, invoiceControllers.getAllInvoice);
router.post(
  '/',
  checkAuth,
  upload.singleFileUpload,
  invoiceControllers.createInvoice,
);
router.put('/:id', checkAuth, invoiceControllers.updateInvoice);
router.get('/:id', checkAuth, invoiceControllers.getInvoice);
router.delete('/:id', checkAuth, invoiceControllers.deleteInvoice);

module.exports = router;
