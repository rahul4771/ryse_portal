const express = require('express');
const checkAuth = require('../Middleware/checkAuth.middleware');
const contractControllers = require('../Controllers/contract.controller');
const upload = require('../Middleware/multer.middleware');
const router = express.Router();

router.get('/', checkAuth, contractControllers.getAllContracts);
router.post(
  '/',
  checkAuth,
  upload.singleFileUpload,
  contractControllers.createContract,
);
router.delete('/:id', checkAuth, contractControllers.deleteContract);
router.get('/:id', checkAuth, contractControllers.getContract);
router.put('/:id', checkAuth, contractControllers.updateContract);

module.exports = router;
