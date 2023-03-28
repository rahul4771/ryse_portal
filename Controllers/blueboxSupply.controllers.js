const Bluebox = require('../Models/blueboxSupply');

const createBluebox = async (req, res, next) => {
  try {
    let response = await Bluebox.createNewBluebox(req);

    if (response?.data && response.status === 200) {
      res.status(200).send({
        result: response.message,
        blueBoxId: response.data,
      });
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};
const updateBluebox = async (req, res, next) => {
  try {
    let response = await Bluebox.updateNewBluebox(req);

    if (response?.data && response.status === 200) {
      res.status(200).send({
        result: response.message,
        output: response.data,
      });
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getAllBluebox = async (req, res, next) => {
  try {
    let response = await Bluebox.fetchAllBluebox(req);

    if (response?.data && response.status === 200) {
      res.status(200).send(response.data);
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getBluebox = async (req, res, next) => {
  try {
    let response = await Bluebox.fetchSingleBluebox(req);

    if (response?.data && response.status === 200) {
      res.status(200).send(response.data);
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const deleteBluebox = async (req, res, next) => {
  try {
    let response = await Bluebox.deleteSingleBluebox(req);
    console.log(response.status, 'opo');
    if (response?.data && response.status === 200) {
      res.status(200).send({
        result: response.message,
        output: response.data,
      });
    } else {
      console.log(response.status, 'opo2');
      throw new Error(response.message);
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};
const fetchRepresentationAgreement = async (req, res, next) => {
  try {
    let response = await Bluebox.fetchRepresentationAgreement(req);

    if (response?.data && response.status === 200) {
      res.status(200).send(response.data);
    } else {
      throw response;
    }
  } catch (response) {
    res.status(response.status).send(response.message);
  }
};
const uploadRepresentationAgreement = async (req, res, next) => {
  try {
    let response = await Bluebox.fetchRepresentationAgreement(req);

    if (response?.data && response.status === 200) {
      if (response.data.length != 0) {
        response = await Bluebox.updateRepresentationAgreement(req);
      } else {
        response = await Bluebox.createRepresentationAgreement(req);
      }

      if (response?.data && response.status === 200) {
        res.status(200).send({
          message: response.message,
          fileId: response.data,
        });
      } else {
        throw response;
      }
    } else {
      throw response;
    }
  } catch (response) {
    res.status(response.status).send(response.message);
  }
};
const deleteRepresentationAgreement = async (req, res, next) => {
  try {
    let response = await Bluebox.deleteRepresentationAgreement(req);

    if (response?.data && response.status === 200) {
      res.status(200).send({
        message: response.message,
        data: response.data,
      });
    } else {
      throw response;
    }
  } catch (response) {
    console.log(response);
    res.status(response.status).send(response.message);
  }
};

module.exports = {
  createBluebox,
  updateBluebox,
  getAllBluebox,
  getBluebox,
  deleteBluebox,
  uploadRepresentationAgreement,
  deleteRepresentationAgreement,
  fetchRepresentationAgreement,
};
