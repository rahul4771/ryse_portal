const jwt = require('jsonwebtoken');
const mysql2Client = require('../Database/client');
const { select, insert, update, remove } = require('../Database/queries');
const util = require('util');
const { recordLog, formattedTimestamp } = require('../lib/db-utils');

const updatecustomerInfo = async (req, callback) => {
  let cust_id = req.params.id;
  let hwin_number = req.body.hwin_number;
  let hwin_number2 = req.body.hwin_number2;
  let user_type = null;
  let customer_id = null;
  let activity_type_hauler = JSON.stringify(req.body.activity_type_hauler);
  let hauler_category_a_notes = req.body.hauler_category_a_notes;
  let hauler_category_b_notes = req.body.hauler_category_b_notes;
  let activity_type_processor = JSON.stringify(
    req.body.activity_type_processor,
  );
  let processor_category_a_notes = req.body.processor_category_a_notes;
  let processor_category_b_notes = req.body.processor_category_b_notes;
  let eca_number = req.body.eca_number;
  // console.info(`Received files ${util.inspect(req.files, { depth: null })}`);

  let file_collection_sites_registration_form =
    req.files?.file_collection_sites_registration_form || null;
  let file_contingency_plan = req.files?.file_contingency_plan || null;
  let file_wsib_clearance_certificate =
    req.files?.file_wsib_clearance_certificate || null;
  let file_insurance_certificate_general_liablity =
    req.files?.file_insurance_certificate_general_liablity || null;
  let file_insurance_certificate_gradual =
    req.files?.file_insurance_certificate_gradual || null;
  let file_insurance_certificate_automobile =
    req.files?.file_insurance_certificate_automobile || null;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];

  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    customer_id = decoded.cust_id;
  });
  if (user_type != 'admin' && customer_id != cust_id) {
    return { message: 'Invalid operation to customer data', status: 500 };
  }

  let customer = await mysql2Client.dbGetSingleRow(select.hsp.customerById, [
    cust_id,
  ]);
  // return callback({ error: 'Customer not found' }, null);

  if (file_collection_sites_registration_form != null) {
    let file_id = customer.file_collection_sites_registration_form;
    let file_collection_sites_registration_form_status =
      req.body.file_collection_sites_registration_form_status != null &&
      req.body.file_collection_sites_registration_form_status != ''
        ? req.body.file_collection_sites_registration_form_status
        : 1;
    let file_collection_sites_registration_form_type =
      req.body.file_collection_sites_registration_form_type != null &&
      req.body.file_collection_sites_registration_form_type != ''
        ? req.body.file_collection_sites_registration_form_type
        : null;
    let file_collection_sites_registration_form_password =
      req.body.file_collection_sites_registration_form_password != null &&
      req.body.file_collection_sites_registration_form_password != ''
        ? req.body.file_collection_sites_registration_form_password
        : null;
    await uploadFile(
      req,
      'file_collection_sites_registration_form',
      file_collection_sites_registration_form,
      file_id,
      cust_id,
      file_collection_sites_registration_form_status,
      file_collection_sites_registration_form_type,
      file_collection_sites_registration_form_password,
    );
  }
  if (file_contingency_plan != null) {
    let file_id = customer.file_contingency_plan;
    let file_contingency_plan_status =
      req.body.file_contingency_plan_status != null &&
      req.body.file_contingency_plan_status != ''
        ? req.body.file_contingency_plan_status
        : 1;
    let file_contingency_plan_type =
      req.body.file_contingency_plan_type != null &&
      req.body.file_contingency_plan_type != ''
        ? req.body.file_contingency_plan_type
        : null;
    let file_contingency_plan_password =
      req.body.file_contingency_plan_password != null &&
      req.body.file_contingency_plan_password != ''
        ? req.body.file_contingency_plan_password
        : null;
    await uploadFile(
      req,
      'file_contingency_plan',
      file_contingency_plan,
      file_id,
      cust_id,
      file_contingency_plan_status,
      file_contingency_plan_type,
      file_contingency_plan_password,
    );
  }
  if (file_wsib_clearance_certificate != null) {
    let file_id = customer.file_wsib_clearance_certificate;
    let file_wsib_clearance_certificate_status =
      req.body.file_wsib_clearance_certificate_status != null &&
      req.body.file_wsib_clearance_certificate_status != ''
        ? req.body.file_wsib_clearance_certificate_status
        : 1;
    let file_wsib_clearance_certificate_type =
      req.body.file_wsib_clearance_certificate_type != null &&
      req.body.file_wsib_clearance_certificate_type != ''
        ? req.body.file_wsib_clearance_certificate_type
        : null;
    let file_wsib_clearance_certificate_password =
      req.body.file_wsib_clearance_certificate_password != null &&
      req.body.file_wsib_clearance_certificate_password != ''
        ? req.body.file_wsib_clearance_certificate_password
        : null;
    await uploadFile(
      req,
      'file_wsib_clearance_certificate',
      file_wsib_clearance_certificate,
      file_id,
      cust_id,
      file_wsib_clearance_certificate_status,
      file_wsib_clearance_certificate_type,
      file_wsib_clearance_certificate_password,
    );
  }
  if (file_insurance_certificate_general_liablity != null) {
    let file_id = customer.file_insurance_certificate_general_liablity;
    let file_insurance_certificate_general_liablity_status =
      req.body.file_insurance_certificate_general_liablity_status != null &&
      req.body.file_insurance_certificate_general_liablity_status != ''
        ? req.body.file_insurance_certificate_general_liablity_status
        : 1;
    let file_insurance_certificate_general_liablity_type =
      req.body.file_insurance_certificate_general_liablity_type != null &&
      req.body.file_insurance_certificate_general_liablity_type != ''
        ? req.body.file_insurance_certificate_general_liablity_type
        : null;
    let file_insurance_certificate_general_liablity_password =
      req.body.file_insurance_certificate_general_liablity_password != null &&
      req.body.file_insurance_certificate_general_liablity_password != ''
        ? req.body.file_insurance_certificate_general_liablity_password
        : null;
    await uploadFile(
      req,
      'file_insurance_certificate_general_liablity',
      file_insurance_certificate_general_liablity,
      file_id,
      cust_id,
      file_insurance_certificate_general_liablity_status,
      file_insurance_certificate_general_liablity_type,
      file_insurance_certificate_general_liablity_password,
    );
  }
  if (file_insurance_certificate_gradual != null) {
    let file_id = customer.file_insurance_certificate_gradual;
    let file_insurance_certificate_gradual_status =
      req.body.file_insurance_certificate_gradual_status != null &&
      req.body.file_insurance_certificate_gradual_status != ''
        ? req.body.file_insurance_certificate_gradual_status
        : 1;
    let file_insurance_certificate_gradual_type =
      req.body.file_insurance_certificate_gradual_type != null &&
      req.body.file_insurance_certificate_gradual_type != ''
        ? req.body.file_insurance_certificate_gradual_type
        : null;
    let file_insurance_certificate_gradual_password =
      req.body.file_insurance_certificate_gradual_password != null &&
      req.body.file_insurance_certificate_gradual_password != ''
        ? req.body.file_insurance_certificate_gradual_password
        : null;
    await uploadFile(
      req,
      'file_insurance_certificate_gradual',
      file_insurance_certificate_gradual,
      file_id,
      cust_id,
      file_insurance_certificate_gradual_status,
      file_insurance_certificate_gradual_type,
      file_insurance_certificate_gradual_password,
    );
  }
  if (file_insurance_certificate_automobile != null) {
    let file_id = customer.file_insurance_certificate_automobile;
    let file_insurance_certificate_automobile_status =
      req.body.file_insurance_certificate_automobile_status != null &&
      req.body.file_insurance_certificate_automobile_status != ''
        ? req.body.file_insurance_certificate_automobile_status
        : 1;
    let file_insurance_certificate_automobile_type =
      req.body.file_insurance_certificate_automobile_type != null &&
      req.body.file_insurance_certificate_automobile_type != ''
        ? req.body.file_insurance_certificate_automobile_type
        : null;
    let file_insurance_certificate_automobile_password =
      req.body.file_insurance_certificate_automobile_password != null &&
      req.body.file_insurance_certificate_automobile_password != ''
        ? req.body.file_insurance_certificate_automobile_password
        : null;
    await uploadFile(
      req,
      'file_insurance_certificate_automobile',
      file_insurance_certificate_automobile,
      file_id,
      cust_id,
      file_insurance_certificate_automobile_status,
      file_insurance_certificate_automobile_type,
      file_insurance_certificate_automobile_password,
    );
  }

  let hspCustomer = await mysql2Client.dbQuery(update.hsp.updateCustomerById, [
    hwin_number,
    hwin_number2,
    activity_type_hauler,
    hauler_category_a_notes,
    hauler_category_b_notes,
    activity_type_processor,
    processor_category_a_notes,
    processor_category_b_notes,
    eca_number,
    cust_id,
  ]);

  recordLog('Updated the Hsp customer :' + cust_id, req);
  return null == customer
    ? { message: 'Failed to update customer !', status: 500 }
    : {
        message: 'Customer updated successfully',
        status: 200,
        data: customer,
      };
};

const uploadFile = async (
  req,
  column,
  hspFile,
  file_id,
  customer_id,
  status,
  type,
  password,
) => {
  const bucket = req.app.locals.bucket;
  let publicUrl = null;
  let datetime = new Date().toISOString();
  const newFileName = datetime + '-' + hspFile[0].originalname;
  let uploadFile = bucket.file('customer_quotes/' + newFileName);
  let file_name = hspFile[0].originalname;
  let created_at = formattedTimestamp();
  let updated_at = formattedTimestamp();

  let upload = await uploadFile.save(hspFile[0].buffer, function (error) {
    return error
      ? {
          message: 'File failed to upload !',
          status: 500,
        }
      : true;
  });

  publicUrl = `${req.app.locals.bucketLocation}/${uploadFile.name}`;
  // console.info(`Uploading ${file_name} to ${publicUrl}...`);

  let file = await mysql2Client.dbQuery(update.hsp.updateFileById, [
    status,
    type,
    file_name,
    publicUrl,
    updated_at,
    password,
    file_id,
  ]);

  if (file.changedRows == 0) {
    let newFile = await mysql2Client.dbQuery(insert.hsp.createNewFile, [
      customer_id,
      status,
      type,
      file_name,
      publicUrl,
      created_at,
      updated_at,
      password,
    ]);

    let file_id = null;
    file_id = newFile.insertId;
    await mysql2Client.dbQuery(update.hsp.updateCustomerDynamic, [
      column,
      file_id,
      customer_id,
    ]);
  }
};

const getHspCustomerInfo = async (req, callback) => {
  const con = req.app.locals.connection;
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
    return callback({ err: 'Invalid operation to customer data' }, null);
  }

  let customer = await mysql2Client.dbQuery(select.hsp.customerInfo, [cust_id]);

  // TODO remove these instances?
  for (let property in customer[0]) {
    if (customer[0][property] == null) {
      customer[0][property] = '';
    }
  }
  return callback(null, customer);
};

module.exports = {
  updatecustomerInfo,
  getHspCustomerInfo,
};
