const hsp = require('../Models/hsp');
const util = require('util');

const updateHspCustomer = async (req, res, next) => {
  // console.info(`Received params ${util.inspect(req.params, { depth: null })}`);
  try {
    let response = await hsp.updatecustomerInfo(req);

    if (response?.data && response.status === 200) {
      // console.info(`Response is ${util.inspect(response)}`);
      res.status(200).send({
        message: response.message,
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

const getHspCustomerInfo = (req, res, next) => {
  hsp.getHspCustomerInfo(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(200).send(result);
    }
  });
};
module.exports = {
  updateHspCustomer,
  getHspCustomerInfo,
};
