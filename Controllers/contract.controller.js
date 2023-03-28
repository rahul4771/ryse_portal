const Contract = require('../Models/contract');
const https = require('https');

const createContract = async (req, res, next) => {
  try {
    let response = await Contract.createNewContract(req);

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

const deleteContract = async (req, res, next) => {
  try {
    let response = await Contract.deleteSingleContract(req);

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

const getContract = async (req, res, next) => {
  try {
    let response = await Contract.fetchSingleContract(req);

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

const getAllContracts = async (req, res, next) => {
  try {
    let response = await Contract.fetchAllContracts(req);

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

const updateContract = async (req, res, next) => {
  try {
    let response = await Contract.updateNewContract(req);

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

const expiredContracts = async (req, res, next) => {
  try {
    let response = await Contract.contractsExpired(req);

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

const downloadContract = async (req, res, next) => {
  try {
    // TODO should rename Contract.downloadContractFile and Contract.downloadContract for clarity
    let response = await Contract.downloadContractFile(req);

    if (response?.data && response.status === 200) {
      // console.info(`Response is ${util.inspect(response)}`);
      // TODO should be contract_url from model
      res.status(200).send(response.data); // TODO improve standardization here
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    // console.info(`Error is ${util.inspect(error)}`);
    res.status(500).send(error.message);
  }
};

const approveContract = async (req, res, next) => {
  try {
    let response = await Contract.approveContractByUser(req);

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

const contractlist = async (req, res, next) => {
  try {
    let response = await Contract.fetchAllContractsToInvoice(req);

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
  createContract,
  deleteContract,
  getContract,
  getAllContracts,
  updateContract,
  expiredContracts,
  downloadContract,
  approveContract,
  contractlist,
};
