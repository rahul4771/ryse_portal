const files = require('../Models/file');

const createFile = (req, res, next) => {
  files.createNewFile(req, function (err, result) {
    if (err) {
      res.status(404).send(err);
    } else if (result.length != 0) {
      res.status(result.status).send(result);
    }
  });
};

const deleteFile = (req, res, next) => {
  files.deleteFile(req, function (err, result) {
    if (err) {
      res.status(404).send(err);
    } else if (result.length != 0) {
      res.status(result.status).send(result);
    }
  });
};

const updateFile = (req, res, next) => {
  files.updateFile(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else if (result.status == 200) {
      res.status(200).send(result);
    } else if (result.status == 500) {
      res.status(500).send(result);
    }
  });
};
module.exports = {
  createFile,
  deleteFile,
  updateFile,
};
