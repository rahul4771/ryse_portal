const QuoteLine = require('../Models/quoteLine');

const createQuoteLine = (req, res, next) => {
  QuoteLine.createNewQuoteLine(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else if (result.length == 0) {
      res.status(500).send({ error: 'Create quote line failed' });
    } else {
      res.status(200).send(result);
    }
  });
};
const updateQuoteLine = (req, res, next) => {
  QuoteLine.updateNewQuoteLine(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else if (result.length == 0) {
      res.status(500).send({ error: 'Query failed - No records found' });
    } else {
      res.status(200).send(result);
    }
  });
};

const getAllQuoteLine = (req, res, next) => {
  QuoteLine.fetchAllQuoteLine(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else if (result.length == 0) {
      res.status(500).send({ error: 'Query failed - No records found' });
    } else {
      res.status(200).send(result);
    }
  });
};

const getQuoteLine = (req, res, next) => {
  QuoteLine.fetchSingleQuoteLine(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else if (result.length == 0) {
      res.status(500).send({ error: 'Query failed - No records found' });
    } else {
      res.status(200).send(result);
    }
  });
};

const deleteQuoteLine = (req, res, next) => {
  QuoteLine.deleteSingleQuoteLine(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else if (result.length == 0) {
      res.status(500).send({ error: 'Query failed - No records found' });
    } else {
      res.status(200).send(result);
    }
  });
};

module.exports = {
  createQuoteLine,
  updateQuoteLine,
  getAllQuoteLine,
  getQuoteLine,
  deleteQuoteLine,
};
