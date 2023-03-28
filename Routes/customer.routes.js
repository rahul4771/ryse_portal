const express = require('express');
const checkAuth = require('../Middleware/checkAuth.middleware');
const customerControllers = require('../Controllers/customer.controllers');
const router = express.Router();
const upload = require('../Middleware/multer.middleware');

router.get('/', checkAuth, customerControllers.getAllCustomers);

router.get('/:id', checkAuth, customerControllers.getCustomerInfo);
router.put(
  '/:id',
  upload.singleFileUpload,
  checkAuth,
  customerControllers.updateCustomer,
);

router.delete('/:id', checkAuth, customerControllers.deleteCustomer);

module.exports = router;
