const Invoice = require('../Models/invoice');
const Json2csvParser = require('json2csv').Parser;

/**
 * Creating new invoice
 */
const createInvoice = (req, res, next) => {
  Invoice.createNewInvoice(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else if (result.length == 0) {
      res.status(500).send({ error: 'Create invoice failed' });
    } else {
      res.status(200).send(result);
    }
  });
};

/**
 * Updating the invoice
 */
const updateInvoice = (req, res, next) => {
  Invoice.updateNewInvoice(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else if (result.length == 0) {
      res.status(500).send({ error: 'Update invoice Query failed' });
    } else {
      res.status(200).send(result);
    }
  });
};

/**
 * Returns all invoices
 */
const getAllInvoice = (req, res, next) => {
  Invoice.fetchAllInvoice(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(200).send(result);
    }
  });
};

/**
 * Returns invoice
 */
const getInvoice = (req, res, next) => {
  Invoice.fetchSingleInvoice(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else if (result.length == 0) {
      res.status(500).send({ error: 'Query failed - No records found' });
    } else {
      res.status(200).send(result);
    }
  });
};

/**
 * Deleting invoice
 */
const deleteInvoice = (req, res, next) => {
  Invoice.deleteSingleInvoice(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else if (result.length == 0) {
      res.status(500).send({ error: 'Query failed - No records found' });
    } else {
      res.status(200).send(result);
    }
  });
};
const sendInvoice = (req, res, next) => {
  Invoice.sendInvoiceEmail(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else if (result.length == 0) {
      res.status(500).send({ error: 'Query failed - No records found' });
    } else {
      res.status(200).send(result);
    }
  });
};
const invoiceEntry = (req, res, next) => {
  Invoice.invoiceEntryFetchContract(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else if (result.length == 0) {
      res.status(500).send({ error: 'Query failed - No records found' });
    } else {
      res.status(200).send(result);
    }
  });
};
const exportInvoiceCsv = (req, res, next) => {
  Invoice.downloadInvoicesCsv(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else {
      const invoiceJson = JSON.parse(JSON.stringify(result));
      const csvFields = [
        'Contract',
        'Customer',
        'Issue_Date',
        'Status',
        'Amount',
        'Due_Date',
        'Period',
        'Issued_Invoice',
      ];
      const json2csvParser = new Json2csvParser({ csvFields });
      const csvData = json2csvParser.parse(invoiceJson);
      res.setHeader(
        'Content-disposition',
        'attachment; filename=allInvoices.csv',
      );
      res.set('Content-Type', 'text/csv');
      res.status(200).send(csvData);
    }
  });
};
const downloadInvoice = (req, res, next) => {
  res.status(200).send('test');
};
module.exports = {
  createInvoice,
  getAllInvoice,
  updateInvoice,
  getInvoice,
  deleteInvoice,
  sendInvoice,
  invoiceEntry,
  exportInvoiceCsv,
  downloadInvoice,
};
