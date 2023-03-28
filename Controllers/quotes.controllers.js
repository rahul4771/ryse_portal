const Quote = require('../Models/quote');
const util = require('util');

const createQuote = async (req, res, next) => {
  try {
    let response = await Quote.createNewQuote(req);

    if (response?.data && response.status === 200) {
      // console.info(`Response is ${util.inspect(response, { depth: null })}`);
      res.status(200).send({
        result: response.message,
        quoteId: response.data,
      });
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    // console.info(`Error is ${util.inspect(error, { depth: null })}`);
    res.status(500).send(error.message);
  }
};

const updateQuote = async (req, res, next) => {
  try {
    let response = await Quote.updateNewQuote(req);

    if (response?.data && response.status === 200) {
      // console.info(`Response is ${util.inspect(response)}`);
      res.status(200).send({
        result: response.message,
        output: response.data,
      });
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    // console.info(`Error is ${util.inspect(error)}`);
    res.status(500).send(error.message);
  }
};

const getAllQuotes = async (req, res, next) => {
  try {
    let response = await Quote.fetchAllQuotes(req);

    if (response?.data && response.status === 200) {
      // console.info(`Response is ${util.inspect(response, { depth: null })}`);
      res.status(200).send(response.data); // TODO improve standardization here
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    // console.info(`Error is ${util.inspect(error)}`);
    res.status(500).send(error.message);
  }
};

const getQuote = async (req, res, next) => {
  try {
    let response = await Quote.fetchSingleQuote(req);

    if (response?.data && response.status === 200) {
      // console.info(`Response is ${util.inspect(response, { depth: null })}`);
      res.status(200).send(response.data); // TODO improve standardization here
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    // console.info(`Error is ${util.inspect(error)}`);
    res.status(500).send(error.message);
  }
};

const deleteQuote = async (req, res, next) => {
  try {
    let response = await Quote.deleteSingleQuote(req);

    if (response?.data && response.status === 200) {
      // console.info(`Response is ${util.inspect(response)}`);
      res.status(200).send({
        result: response.message,
        output: response.data,
      }); // TODO improve standardization here
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    // console.info(`Error is ${util.inspect(error)}`);
    res.status(500).send(error.message);
  }
};

const expiredQuotes = async (req, res, next) => {
  try {
    let response = await Quote.quotesExpired(req);

    if (response?.data && response.status === 200) {
      // console.info(`Response is ${util.inspect(response)}`);
      res.status(200).send(response.data); // TODO improve standardization here
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    // console.info(`Error is ${util.inspect(error)}`);
    res.status(500).send(error.message);
  }
};

const requestedQuotes = async (req, res, next) => {
  try {
    let response = await Quote.quotesRequested(req);

    if (response?.data && response.status === 200) {
      // console.info(`Response is ${util.inspect(response)}`);
      res.status(200).send(response.data); // TODO improve standardization here
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    // console.info(`Error is ${util.inspect(error)}`);
    res.status(500).send(error.message);
  }
};

const approvedQuotes = async (req, res, next) => {
  try {
    let response = await Quote.quotesApproved(req);

    if (response?.data && response.status === 200) {
      // console.info(`Response is ${util.inspect(response)}`);
      res.status(200).send(response.data); // TODO improve standardization here
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    // console.info(`Error is ${util.inspect(error)}`);
    res.status(500).send(error.message);
  }
};

const quoteApprove = async (req, res, next) => {
  try {
    let response = await Quote.quotesApproveCustomer(req);

    if (response?.data && response.status === 200) {
      // console.info(`Response is ${util.inspect(response)}`);
      res.status(200).send({
        result: 'Quote approve successfully',
        output: response.data,
      });
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    // console.info(`Error is ${util.inspect(error)}`);
    res.status(500).send(error.message);
  }
};

const uploadCustQuote = async (req, res, next) => {
  try {
    let response = await Quote.uploadCustQuoteFile(req);

    if (response?.data && response.status === 200) {
      // console.info(`Response is ${util.inspect(response)}`);
      res.status(200).send(response.data);
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    // console.info(`Error is ${util.inspect(error.message)}`);
    res.status(500).send(error.message);
  }
};

const deleteQuotesAttachments = async (req, res, next) => {
  try {
    let response = await Quote.deleteQuotesFile(req);

    if (response?.data && response.status === 200) {
      // console.info(`Response is ${util.inspect(response)}`);
      res.status(200).send({
        result: 'Customer quote file deleted successfully',
        filename: response.data,
      });
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    // console.info(`Error is ${util.inspect(error.message)}`);
    res.status(500).send(error.message);
  }
};

module.exports = {
  createQuote,
  updateQuote,
  getAllQuotes,
  getQuote,
  deleteQuote,
  requestedQuotes,
  expiredQuotes,
  approvedQuotes,
  quoteApprove,
  uploadCustQuote,
  deleteQuotesAttachments,
};
