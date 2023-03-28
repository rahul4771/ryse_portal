const express = require('express');
const checkAuth = require('../Middleware/checkAuth.middleware');
const filesControllers = require('../Controllers/file.controllers');
const upload = require('../Middleware/multer.middleware');
const router = express.Router();

router.post(
  '/',
  checkAuth,
  upload.singleFileUpload,
  filesControllers.createFile,
);
router.put(
  '/:id',
  checkAuth,
  upload.singleFileUpload,
  filesControllers.updateFile,
);
router.delete('/:id', checkAuth, filesControllers.deleteFile);

module.exports = router;
