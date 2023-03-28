const Uom = require('../Models/uom');
const Json2csvParser = require('json2csv').Parser;

const createUom = (req, res, next) => {
  Uom.createUom(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(200).send(result);
    }
  });
};
const createUomConversion = (req, res, next) => {
  Uom.createUomConversion(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(200).send(result);
    }
  });
};
const createMaterial = (req, res, next) => {
  Uom.createMaterial(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(200).send(result);
    }
  });
};
const fetchAllUom = (req, res, next) => {
  Uom.fetchAllUom(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(200).send(result);
    }
  });
};

const fetchAllUomConversion = (req, res, next) => {
  Uom.fetchAllUomConversion(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(200).send(result);
    }
  });
};

const fetchAllMaterial = (req, res, next) => {
  Uom.fetchAllMaterial(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(200).send(result);
    }
  });
};

const downloadUom = (req, res, next) => {
  Uom.downloadUom(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else {
      const uomJson = JSON.parse(JSON.stringify(result));
      const csvFields = ['id', 'uom', 'material_id', 'description'];
      const json2csvParser = new Json2csvParser({ csvFields });
      const csvData = json2csvParser.parse(uomJson);
      res.setHeader('Content-disposition', 'attachment; filename=uom.csv');
      res.set('Content-Type', 'text/csv');
      res.status(200).send(csvData);
    }
  });
};

const downloadUomConversion = (req, res, next) => {
  Uom.downloadUomConversion(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else {
      const uomJson = JSON.parse(JSON.stringify(result));
      const csvFields = [
        'id',
        'from_uom_id',
        'to_uom_id',
        'rate',
        'description',
      ];
      const json2csvParser = new Json2csvParser({ csvFields });
      const csvData = json2csvParser.parse(uomJson);
      res.setHeader(
        'Content-disposition',
        'attachment; filename=uomConversion.csv',
      );
      res.set('Content-Type', 'text/csv');
      res.status(200).send(csvData);
    }
  });
};

const downloadMaterial = (req, res, next) => {
  Uom.downloadMaterial(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else {
      const uomJson = JSON.parse(JSON.stringify(result));
      const csvFields = [
        'id',
        'category',
        'sub_category_1',
        'sub_category_2',
        'sub_category_3',
      ];
      const json2csvParser = new Json2csvParser({ csvFields });
      const csvData = json2csvParser.parse(uomJson);
      res.setHeader(
        'Content-disposition',
        'attachment; filename=materialMaster.csv',
      );
      res.set('Content-Type', 'text/csv');
      res.status(200).send(csvData);
    }
  });
};
module.exports = {
  fetchAllUom,
  fetchAllUomConversion,
  fetchAllMaterial,
  createUom,
  createUomConversion,
  createMaterial,
  downloadUom,
  downloadUomConversion,
  downloadMaterial,
};
