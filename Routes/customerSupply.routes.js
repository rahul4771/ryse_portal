const express = require('express');
const checkAuth = require('../Middleware/checkAuth.middleware');
const customerSupplyControllers = require('../Controllers/customerSupply.controllers');
const upload = require('../Middleware/multer.middleware');
const router = express.Router();

router.get('/', checkAuth, customerSupplyControllers.getAllCustomerSupply);
router.post(
  '/',
  checkAuth,
  upload.singleFileUpload,
  customerSupplyControllers.createCustomerSupply,
);
router.put(
  '/:id',
  checkAuth,
  upload.singleFileUpload,
  customerSupplyControllers.updateCustomerSupply,
);
router.get('/:id', checkAuth, customerSupplyControllers.getCustomerSupply);
router.delete(
  '/:id',
  checkAuth,
  customerSupplyControllers.deleteCustomerSupply,
);

module.exports = router;
