require('dotenv').config();
const jwt = require('jsonwebtoken');
const Admin = require('../Models/admin');
const { expiredQuotes } = require('./quotes.controllers');

const ROLES = {
  admin: 'admin',
  user: 'user',
  company: 'company',
};

const ACCESS_STATUS = {
  pending: 0,
  active: 1,
  deactivated: 3,
};

const impersonateUser = async (req, res, next) => {
  if (req.params == undefined) {
    res.status(400).send({ error: 'Authentication failed' });
    return false;
  }

  await Admin.loginAsUser(req, req.params.id, function (err, user) {
    if (err) {
      res.status(400).send({ error: err });
    } else {
      let user_id = user.id;
      let type = user.user_type;
      let name = user.first_name;
      let last_name = user.last_name;
      let company_name = user.company_name;
      let email = user.email;
      let phone = user.phone;
      let street = user.street;
      let city = user.city;
      let province = user.province;
      let country = user.country;
      let cust_id = user.cust_id;
      let materials = user.materials;
      let account_sub_type = user.account_sub_type;
      let hwin_number = user.hwin_number;
      let hwin_number2 = user.hwin_number2;
      let activity_type_hauler = user.activity_type_hauler;
      let hauler_category_a_notes = user.hauler_category_a_notes;
      let hauler_category_b_notes = user.hauler_category_b_notes;
      let activity_type_processor = user.activity_type_processor;
      let processor_category_a_notes = user.processor_category_a_notes;
      let processor_category_b_notes = user.processor_category_b_notes;
      let eca_number = user.eca_number;

      type = ROLES[type];
      // TODO proper logging, 2FA or email notification etc.
      console.info(`User ${name} ${last_name} (${type}) logged in.`);

      let resp = {
        id: user.id,
        name: user.first_name,
        cust_id: user.cust_id,
        user_type: ROLES.admin,
        account_status: user.account_status,
        isImpersonating: true,
      };

      let token = jwt.sign(resp, 'secret', { expiresIn: 84000 });
      res.status(200).send({
        authorization_token: token,
        user_id: cust_id,
        first_name: name,
        last_name: last_name,
        company_name: company_name,
      });
    }
  });
};

const uploadQuote = async (req, res, next) => {
  try {
    let response = await Admin.uploadQuoteFile(req);

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

const uploadContract = async (req, res, next) => {
  try {
    let response = await Admin.uploadContractFile(req);

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

const uploadInvoice = async (req, res, next) => {
  try {
    let response = await Admin.uploadInvoiceFile(req);

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

const addQuoteCustomer = async (req, res, next) => {
  try {
    let response = await Admin.addQuoteToCustomer(req);

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

const updateStatus = async (req, res, next) => {
  try {
    let response = await Admin.updateContractInvoiceStatus(req);

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

const customerApprove = async (req, res, next) => {
  try {
    let response = await Admin.customerApproveByAdmin(req);

    if (response?.data && response.status === 200) {
      // console.info(`Response is ${util.inspect(response)}`);
      res.status(200).send({
        result: 'Customer approved successfully',
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

module.exports = {
  uploadQuote,
  uploadContract,
  uploadInvoice,
  addQuoteCustomer,
  updateStatus,
  customerApprove,
  impersonateUser,
};
