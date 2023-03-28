const path = require('path');
const Multer = require('multer');

const fileFilter = (req, file, cb) => {
  const filetypes = /docx|png|csv|jpg|pdf|xlsx|jpeg/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  if (extname) {
    return cb(null, true);
  } else {
    cb('Invalid file format');
  }
};
const multer = Multer({
  fileFilter: fileFilter,
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

upload = multer.single('file');
uploadMultipleFile = multer.fields([
  { name: 'representation_agreement' },
  { name: 'bluebox_quote_file' },
  { name: 'file_collection_sites_registration_form' },
  { name: 'file_contingency_plan' },
  { name: 'file_wsib_clearance_certificate' },
  { name: 'file_insurance_certificate_general_liablity' },
  { name: 'file_insurance_certificate_gradual' },
  { name: 'file_insurance_certificate_automobile' },
  { name: 'file' },
  { name: 'file_collection_target' },
]);

const singleFileUpload = function (req, res, next) {
  upload(req, res, function (err) {
    if (err) {
      res.status(400).send(err);
    } else {
      next();
    }
  });
};
const multipleFileUpload = function (req, res, next) {
  uploadMultipleFile(req, res, function (err) {
    if (err) {
      res.status(400).send(err);
    } else {
      next();
    }
  });
};
module.exports = {
  singleFileUpload,
  multipleFileUpload,
};
