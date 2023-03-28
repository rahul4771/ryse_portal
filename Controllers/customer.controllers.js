const Customer = require('../Models/customer');

const getCustomerInfo = async (req, res, next) => {
  try {
    let response = await Customer.fetchCustomerInfo(req);

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

const updateCustomer = async (req, res, next) => {
  try {
    let response = await Customer.updatecustomerInfo(req);

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

const getAllCustomers = async (req, res, next) => {
  try {
    let response = await Customer.fetchAllCustomers(req);

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
const deleteCustomer = async (req, res, next) => {
  try {
    let response = await Customer.deleteSingleCustomer(req);

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

const customerUpdate = async (req, res, next) => {
  try {
    let response = await Customer.customerSelectiveUpdate(req);

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

module.exports = {
  getCustomerInfo,
  updateCustomer,
  getAllCustomers,
  deleteCustomer,
  customerUpdate,
};
