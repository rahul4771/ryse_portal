const customerSupply = require('../Models/customerSupply');
const Json2csvParser = require('json2csv').Parser;

const createCustomerSupply = async (req, res, next) => {
  try {
    let response = await customerSupply.createNewCustomerSupply(req);

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
const updateCustomerSupply = async (req, res, next) => {
  try {
    let response = await customerSupply.updateNewCustomerSupply(req);

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

const getAllCustomerSupply = async (req, res, next) => {
  try {
    let response = await customerSupply.fetchAllCustomerSupply(req);

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

const getCustomerSupply = async (req, res, next) => {
  try {
    let response = await customerSupply.fetchSingleCustomerSupply(req);

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

const deleteCustomerSupply = async (req, res, next) => {
  try {
    let response = await customerSupply.deleteSingleCustomerSupply(req);

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

const downloadSupply = async (req, res, next) => {
  try {
    let response = await customerSupply.downloadCustomerSupply(req);

    if (response?.data && response.status === 200) {
      // console.info(`Response is ${util.inspect(response)}`);
      // TODO determine if this is necessary; looks hack-ey
      const supplyJSON = JSON.parse(JSON.stringify(response.data));
      const csvFields = [
        'id',
        'cust_id',
        'user_id',
        'contract_id',
        'material_master_id',
        'amount',
        'period_start',
        'period_end',
        'uom_id',
      ];
      const json2csvParser = new Json2csvParser({ csvFields });
      const csvData = json2csvParser.parse(supplyJSON);
      res.setHeader('Content-disposition', 'attachment; filename=supply.csv');
      res.set('Content-Type', 'text/csv');
      res.status(200).send(csvData);
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    // console.info(`Error is ${util.inspect(error)}`);
    res.status(500).send(error.message);
  }
};

module.exports = {
  createCustomerSupply,
  updateCustomerSupply,
  getAllCustomerSupply,
  getCustomerSupply,
  deleteCustomerSupply,
  downloadSupply,
};
