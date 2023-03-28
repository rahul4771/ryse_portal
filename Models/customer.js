const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const mysql2Client = require('../Database/client');
const { select, insert, update, remove } = require('../Database/queries');
const util = require('util');
const recordLog = require('../lib/db-utils').recordLog;

const fetchCustomerInfo = async (req) => {
  let cust_id = req.params.id;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type,
    customer_id = null;

  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    customer_id = decoded.cust_id;
  });

  if (user_type != 'admin' && customer_id != cust_id) {
    return { message: 'Invalid operation to customer data', status: 500 };
  }

  console.info(
    `Fetching customer info using query ${select.customers.fetchUserInfo}`,
  );

  let customer = await mysql2Client.dbGetSingleRow(
    select.customers.fetchUserInfo,
    [cust_id],
  );

  for (let property in customer) {
    if (customer[property] == null) {
      customer[property] = '';
    }
  }

  return null == customer
    ? { message: 'Failed to fetch customer', status: 500 }
    : {
        message: 'Received customer',
        status: 200,
        data: customer,
      };
};

const updatecustomerInfo = async (req) => {
  // TODO write a serliazer to clean this up
  const bucket = req.app.locals.bucket;
  let cust_id = req.params.id;
  let company_name = req.body.company_name;
  let business_name = req.body.business_name;
  let street = req.body.street;
  let city = req.body.city;
  let postal_code = req.body.postal_code;
  let province = req.body.province;
  let country = req.body.country;
  let p_first_name = req.body.primary_first_name;
  let p_last_name = req.body.primary_last_name;
  let country_code = req.body.country_code;
  let office_phone = req.body.office_phone;
  let office_phone_extension = req.body.office_phone_extension;
  let mobile_phone = req.body.mobile_phone;
  let p_email = req.body.primary_email;
  let p_street = req.body.primary_street;
  let p_city = req.body.primary_city;
  let p_postal_code = req.body.primary_postal_code;
  let p_province = req.body.primary_province;
  let p_country = req.body.primary_country;
  let b_first_name = req.body.billing_first_name;
  let b_last_name = req.body.billing_last_name;
  let b_phone = req.body.billing_phone;
  let billing_phone_extension = req.body.billing_phone_extension;
  let b_email = req.body.billing_email;
  let b_street = req.body.billing_street;
  let b_city = req.body.billing_city;
  let b_postal_code = req.body.billing_postal_code;
  let b_province = req.body.billing_province;
  let b_county = req.body.billing_county;
  let website = req.body.website;
  let rpra_id = req.body.rpra_id;
  let account_type = req.body.account_type;
  let hst_number = req.body.hst_number;
  let materials = JSON.stringify(req.body.materials);
  let account_sub_type = JSON.stringify(req.body.account_sub_type);
  let permission_id = req.body.permission_id;
  let rpra_confirmation_email = req.body.rpra_confirmation_email || null;
  let rpra_confirmation_file = null;

  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];

  let user_type,
    customer_id = null;
  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    customer_id = decoded.cust_id;
  });

  if (user_type != 'admin' && customer_id != cust_id) {
    return { message: 'Invalid operation to customer data', status: 500 };
  }

  if (typeof req.file != 'undefined') {
    let datetime = new Date().toISOString();
    const newFileName = datetime + '-' + req.file.originalname;
    let file = bucket.file('customer_quotes/' + newFileName);
    rpra_confirmation_file = `${req.app.locals.bucketLocation}/${file.name}`;

    let upload = await file.save(req.file.buffer, function (error) {
      return error
        ? {
            message: 'File failed to upload !',
            status: 500,
          }
        : true;
    });
  }

  let customer = await mysql2Client.dbQuery(update.customers.updateInfo, [
    company_name,
    business_name,
    street,
    city,
    postal_code,
    province,
    country,
    p_first_name,
    p_last_name,
    country_code,
    office_phone,
    office_phone_extension,
    mobile_phone,
    p_email,
    p_street,
    p_city,
    p_postal_code,
    p_province,
    p_country,
    b_first_name,
    b_last_name,
    billing_phone_extension,
    b_phone,
    b_email,
    b_street,
    b_city,
    b_postal_code,
    b_province,
    b_county,
    website,
    rpra_id,
    account_type,
    account_sub_type,
    hst_number,
    materials,
    permission_id,
    rpra_confirmation_email,
    rpra_confirmation_file,
    cust_id,
  ]);

  // TODO improve logging here...
  recordLog('Updated the customer :' + cust_id, req);

  // TODO ...and here
  return null == customer
    ? { message: 'Failed to update customer !', status: 500 }
    : {
        message: `Updated customer successfully`,
        status: 200,
        data: customer,
      };
};

const customerSelectiveUpdate = async (req) => {
  let cust_id = req.body.cust_id;
  let rpra_id = req.body.rpra_id;
  let account_type = req.body.account_type;

  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type,
    customer_id = null;

  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    customer_id = decoded.cust_id;
  });

  if (user_type != 'admin' && customer_id != cust_id) {
    return { message: 'Invalid operation to customer data', status: 500 };
  }
  let customer = await mysql2Client.dbQuery(
    update.customers.selectiveUpdateInfo,
    [rpra_id, account_type, cust_id],
  );

  recordLog('Updated the customer (Selective) :' + cust_id, req);

  // TODO improve logging upon failure
  return null == customer
    ? { message: 'Failed to update customer !', status: 500 }
    : {
        message: `Updated customer successfully.`,
        status: 200,
        data: customer,
      };
};

const fetchAllCustomers = async (req) => {
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type = null;
  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
  });
  if (user_type != 'admin') {
    // TODO improve this with RBAC
    return { message: 'Permission failed', status: 500 };
  }

  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const offset = (page - 1) * limit;

  let customers = await mysql2Client.dbQuery(select.customers.fetchAll, [
    limit,
    offset,
  ]);

  // TODO return error if no customers ?
  return {
    message: `Received customer data`,
    status: 200,
    data: customers,
  };
};

const deleteSingleCustomer = async (req) => {
  let cust_id = req.params.id;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];

  let user_type,
    customer_id = null;

  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    customer_id = decoded.cust_id;
  });

  if (user_type != 'admin' && customer_id != cust_id) {
    return { message: 'Invalid operation to customer data', status: 500 };
  }

  let customer = await mysql2Client.dbQuery(
    update.customers.invalidateCustomer,
    [cust_id],
  );

  let user = await mysql2Client.dbQuery(update.customers.deactivateUser, [
    cust_id,
  ]);

  recordLog('Deleted the customer :' + cust_id, req);

  return null == customer
    ? { message: `Failed to delete customer !`, status: 500 }
    : {
        message: `Deleted customer successfully.`,
        status: 200,
        data: customer,
      };
};

module.exports = {
  fetchCustomerInfo,
  updatecustomerInfo,
  customerSelectiveUpdate,
  fetchAllCustomers,
  deleteSingleCustomer,
};
