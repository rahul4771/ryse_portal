const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const mail = require('../Controllers/Helpers/sendGridMailer');
const path = require('path');
require('dotenv').config();

const mysql2Client = require('../Database/client');
const { select, insert, update, remove } = require('../Database/queries');
const util = require('util');
const {
  recordLog,
  recordLogScheduledJob,
  formattedTimestamp,
} = require('../lib/db-utils');

const ROLES = {
  admin: 'admin',
  company: 'user',
  company: 'company',
};

const loginAsUser = async (req, cust_id, callback) => {
  // TODO don't pass around the connection like this !
  const con = req.app.locals.connection;
  let cur_date = new Date();
  let last_login = cur_date.toISOString().slice(0, 18);

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

  const params = [cust_id];
  const query =
    'select cu.id, cu.cust_id, cu.first_name, cu.last_name, cu.email, cu.phone, cu.street, cu.city, cu.province, cu.country, cu.user_type, cu.account_status, customer.company_name, customer.materials,customer.account_sub_type,customer.hwin_number,customer.hwin_number2,customer.activity_type_hauler, customer.hauler_category_a_notes,customer.hauler_category_b_notes,customer.activity_type_processor,customer.processor_category_a_notes, customer.processor_category_b_notes,customer.eca_number from cust_user as cu left join customer on customer.id = cu.cust_id where cu.cust_id = ?';

  let user = await mysql2Client.dbGetSingleRow(query, params);

  if (!user) {
    return callback('User id not found', null);
  }
  return callback(null, user);
};
const uploadQuoteFile = async (req, callback) => {
  const obj = JSON.parse(JSON.stringify(req.body));
  let datetime = new Date().toISOString();
  const bucket = req.app.locals.bucket;
  let quote_id = req.body.quote_id;
  let cust_id = req.body.cust_id;
  let quoteFile = null;

  let adm_quote_status =
    req.body.adm_quote_status != undefined
      ? req.body.adm_quote_status
      : 'pending';
  if (
    (quote_id != undefined && quote_id.length == 0) ||
    (cust_id != undefined && cust_id.length == 0)
  ) {
    return { message: 'Please provide quote id and customer id', status: 500 };
  }
  if (typeof req.file != 'undefined') {
    let status = req.body.status != undefined ? req.body.status : 1;
    let type = req.body.type != undefined ? req.body.type : 'admin_quotes';
    let file_name = req.file.originalname;
    let created_at = formattedTimestamp();
    let updated_at = formattedTimestamp();
    let password =
      req.body.password != undefined &&
      req.body.password != '' &&
      req.body.password != 'undefined'
        ? req.body.password
        : null;
    const newFileName = datetime + '-' + req.file.originalname;
    let remoteFile = bucket.file('admin_quotes/' + newFileName);

    // TODO wrap in try / catch
    await remoteFile.save(req.file.buffer, function (error) {
      return error
        ? {
            message: 'File failed to upload !',
            status: 500,
          }
        : true;
    });
    let publicUrl = `${req.app.locals.bucketLocation}/${remoteFile.name}`;
    // TODO can we reuse the updatedQuote object here?
    let quote = await mysql2Client.dbQuery(select.admin.quoteById, [
      quote_id,
      cust_id,
    ]);
    if (quote.length != 0) {
      // upsert operation
      if (quote[0].quote_file_id != null && quote[0].quote_file_id != '') {
        quoteFile = await mysql2Client.dbQuery(update.admin.updateFile, [
          status,
          type,
          file_name,
          publicUrl,
          password,
          updated_at,
          quote[0].quote_file_id,
          cust_id,
        ]);
      } else {
        quoteFile = await mysql2Client.dbQuery(
          insert.admin.fileWithOptionalPassword,
          [
            cust_id,
            status,
            type,
            file_name,
            publicUrl,
            password,
            created_at,
            updated_at,
          ],
        );

        let quoteWithNewFile = await mysql2Client.dbQuery(
          update.admin.updateQuoteFileUpload,
          [adm_quote_status, quoteFile.insertId, quote_id, cust_id],
        );
      }
    } else {
      return { message: 'Quote not found', status: 500 };
    }

    recordLog('Uploaded quote file for quote_id: ' + quote_id, req);

    let customer = await mysql2Client.dbQuery(
      select.admin.customerToEmailByQuoteId,
      [quote_id],
    );

    if (customer.length != 0) {
      let mailOptions = {
        from: fromMailId,
        to: customer[0].p_email,
        subject: 'Ryse Portal - You have a new quote ready for approval',
        html: `Hello ${customer[0].p_first_name} ${customer[0].p_last_name},<br>
        Please log in to review quote ${quote_id}.`,
      };
      if (customer[0].cust_quote_url != null)
        customer[0].cust_quote_filename = new URL(
          customer[0].cust_quote_url,
        ).pathname
          .split('/')
          .pop();
      if (customer[0].admin_quote_url != null)
        customer[0].admin_quote_filename = new URL(
          customer[0].admin_quote_url,
        ).pathname
          .split('/')
          .pop();
      let response = {
        cust_quote_url: customer[0].cust_quote_url,
        cust_quote_filename: customer[0].cust_quote_filename,
        admin_quote_url: customer[0].admin_quote_url,
        admin_quote_filename: customer[0].admin_quote_filename,
      };

      // TODO wrap in try / catch
      mail.sendMail(mailOptions, function (err, result) {
        if (err) {
          recordLog(
            'Successfully uploaded Quotation but failed to send notification: ' +
              quote_id,
            err,
          );
          return {
            message:
              'Successfully uploaded Quotation but failed to send notification',
            data: response,
            status: 200,
          };
        } else {
          return {
            message:
              'Successfully uploaded Quotation from admin and send notification',
            data: response,
            status: 200,
          };
        }
      });
    } else {
      return { message: 'Customer details not found', status: 500 };
    }
  }

  return null == quoteFile
    ? { message: 'Failed to upload quote file', status: 500 }
    : {
        message: 'Quote file uploaded successfully',
        status: 200,
        data: quoteFile.insertId,
      };
};

const uploadContractFile = async (req, callback) => {
  const obj = JSON.parse(JSON.stringify(req.body));
  let datetime = new Date().toISOString();
  const con = req.app.locals.connection;
  const bucket = req.app.locals.bucket;
  let contract_id = req.body.contract_id;
  let adm_contract_status = req.body.adm_contract_status || 'pending';
  let adm_con_start_date =
    req.body.adm_con_start_date + ' ' + datetime.slice(11, 18);
  let adm_con_end_date =
    req.body.adm_con_end_date + ' ' + datetime.slice(11, 18);
  let cust_id = req.body.cust_id;
  let contractFileRecord = null;

  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type,
    customer_id,
    token_user_id = null;

  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    customer_id = decoded.cust_id;
    token_user_id = decoded.id;
  });

  if (user_type != 'admin' && customer_id != cust_id) {
    return { message: 'Invalid operation to contract data', status: 500 };
  }

  // TODO this should be a try/catch using a method from the Contract module
  let updatedContract = await mysql2Client.dbQuery(
    update.admin.updateContractForFileUpload,
    [adm_contract_status, adm_con_start_date, adm_con_end_date, contract_id],
  );

  // first upload the file and record to database...
  if (typeof req.file != 'undefined') {
    let status = req.body.status != undefined ? req.body.status : 1;
    let file_name = req.file.originalname;
    let created_at = formattedTimestamp();
    let updated_at = formattedTimestamp();
    let password =
      req.body.password != undefined &&
      req.body.password != '' &&
      req.body.password != 'undefined'
        ? req.body.password
        : null;
    const newFileName = datetime + '-' + req.file.originalname;

    let contract = await mysql2Client.dbQuery(
      select.admin.contractByIdAndCustomerId,
      [contract_id, cust_id],
    );

    let admin_contract_file = contract[0].admin_contract_file_id;
    let customer_contract_file = contract[0].customer_contract_file_id;

    if (user_type == 'admin') {
      let remoteFile = bucket.file('admin_contracts/' + newFileName);
      let type = req.body.type != undefined ? req.body.type : 'admin_contracts';

      // TODO wrap in try / catch
      await remoteFile.save(req.file.buffer, function (error) {
        return error
          ? {
              message: 'File failed to upload !',
              status: 500,
            }
          : true;
      });
      let publicUrl = `${req.app.locals.bucketLocation}/${remoteFile.name}`;

      if (admin_contract_file != null && admin_contract_file != '') {
        contractFileRecord = await mysql2Client.dbQuery(
          update.admin.updateFile,
          [
            status,
            type,
            file_name,
            publicUrl,
            password,
            updated_at,
            admin_contract_file,
            cust_id,
          ],
        );
      } else {
        contractFileRecord = await mysql2Client.dbQuery(
          insert.admin.fileWithOptionalPassword,
          [
            cust_id,
            status,
            type,
            file_name,
            publicUrl,
            password,
            created_at,
            updated_at,
          ],
        );

        let contractWithNewFile = await mysql2Client.dbQuery(
          update.admin.updateContractFileUploadAdmin,
          [file.insertId, contract_id, cust_id],
        );
      }
    } else if (user_type == 'company' || user_type == 'user') {
      let remoteFile = bucket.file('customer_contracts/' + newFileName);
      let type =
        req.body.type != undefined ? req.body.type : 'customer_contracts';

      // TODO wrap in try / catch
      await remoteFile.save(req.file.buffer, function (error) {
        return error
          ? {
              message: 'File failed to upload !',
              status: 500,
            }
          : true;
      });
      let publicUrl = `${req.app.locals.bucketLocation}/${remoteFile.name}`;

      if (customer_contract_file != null && customer_contract_file != '') {
        await mysql2Client.dbQuery(update.admin.updateFile, [
          status,
          type,
          file_name,
          publicUrl,
          password,
          updated_at,
          customer_contract_file,
          cust_id,
        ]);
      } else {
        let file = await mysql2Client.dbQuery(
          insert.admin.fileWithOptionalPassword,
          [
            cust_id,
            status,
            type,
            file_name,
            publicUrl,
            password,
            created_at,
            updated_at,
          ],
        );

        let contractWithNewFile = await mysql2Client.dbQuery(
          update.admin.updateContractFileUploadCustomer,
          [file.insertId, contract_id, cust_id],
        );
      }
    }
  }

  recordLog('Uploaded contract file for contract_id: ' + contract_id, req);

  // ...then email the customer
  let customer = await mysql2Client.dbQuery(
    select.admin.customerToEmailByContractId,
    [contract_id],
  );

  if (process.env.ENV == 'production') {
    domain_name = process.env.PROD_URL;
  } else {
    domain_name = process.env.DEV_URL;
  }

  let fromMail = fromMailId;
  let toMail = customer[0].p_email;
  let subject = 'Ryse Portal - A new contract is ready for your approval.';
  let text = `Hello ${customer[0].p_first_name} ${customer[0].p_last_name},<br>
              Please log into the <a href="${domain_name}/login">ryse portal</a> to review the contract`;
  let mailOptions = {
    from: fromMailId,
    to: customer[0].p_email,
    subject: 'Ryse Portal - A new contract is ready for your approval.',
    html: `Hello ${customer[0].p_first_name} ${customer[0].p_last_name},<br>
    Please log into the <a href="${domain_name}/login">ryse portal</a> to review the contract`,
  };

  // TODO wrap in try / catch
  mail.sendMail(mailOptions, function (err, result) {
    if (err) {
      return { message: err, status: 500 };
    } else {
      return {
        message: 'Successfully uploaded contract and sent notification',
        status: 200,
      };
    }
  });

  return null == contractFileRecord
    ? { message: 'Failed to upload contract', status: 500 }
    : {
        message: 'Contract uploaded successfully',
        status: 200,
        data: contractFileRecord,
      };
};

const uploadInvoiceFile = async (req, callback) => {
  const obj = JSON.parse(JSON.stringify(req.body));
  let datetime = new Date().toISOString();
  const con = req.app.locals.connection;
  const bucket = req.app.locals.bucket;
  let invoice_id = req.body.invoice_id;
  let cust_id = req.body.cust_id;
  recordLog('Uploaded invoice file for invoice_id: ' + invoice_id, req);
  let status = req.body.status != undefined ? req.body.status : 1;
  let type = req.body.type != undefined ? req.body.type : 'admin_invoices';
  let created_at = formattedTimestamp();
  let updated_at = formattedTimestamp();
  let invoiceFileRecord = null;
  let password =
    req.body.password != undefined &&
    req.body.password != '' &&
    req.body.password != 'undefined'
      ? req.body.password
      : null;

  if (typeof req.file != 'undefined') {
    let file_name = req.file.originalname;
    const newFileName = datetime + '-' + req.file.originalname;
    let remoteFile = bucket.file('admin_invoices/' + newFileName);

    // TODO wrap in try / catch
    await remoteFile.save(req.file.buffer, function (error) {
      return error
        ? {
            message: 'File failed to upload !',
            status: 500,
          }
        : true;
    });
    let publicUrl = `${req.app.locals.bucketLocation}/${remoteFile.name}`;

    let invoice = await mysql2Client.dbQuery(
      select.admin.invoiceByIdAndCustomerId,
      [invoice_id, cust_id],
    );

    if (
      invoice[0].invoice_file_id != null &&
      invoice[0].invoice_file_id != ''
    ) {
      await mysql2Client.dbQuery(update.admin.updateFile, [
        status,
        type,
        file_name,
        publicUrl,
        password,
        updated_at,
        invoice[0].invoice_file_id,
        cust_id,
      ]);
    } else {
      invoiceFileRecord = await mysql2Client.dbQuery(
        insert.admin.fileWithOptionalPassword,
        [
          cust_id,
          status,
          type,
          file_name,
          publicUrl,
          password,
          created_at,
          updated_at,
        ],
      );

      await mysql2Client.dbQuery(update.admin.updateInvoiceWithNewFile, [
        invoiceFileRecord.insertId,
        invoice_id,
        cust_id,
      ]);
    }
  }

  return null == invoiceFileRecord
    ? { message: 'Failed to upload invoice', status: 500 }
    : {
        message: 'Successfully uploaded invoice from admin',
        status: 200,
        data: invoiceFileRecord,
      };
};

const addQuoteToCustomer = async (req, callback) => {
  let datetime = new Date().toISOString();
  let quote_id = null;
  let file_name = req.file.originalname;
  const obj = JSON.parse(JSON.stringify(req.body));
  const con = req.app.locals.connection;
  const bucket = req.app.locals.bucket;
  let cur_date = new Date();
  let cust_id = req.body.cust_id;
  let date = req.body.date + ' ' + cur_date.toISOString().slice(11, 18);
  let category = req.body.category;
  let adm_quote = req.body.adm_quote;
  let adm_quote_status = req.body.adm_quote_status;
  let adm_expiry_date =
    req.body.adm_expiry_date + ' ' + cur_date.toISOString().slice(11, 18);
  let cust_user_id = req.body.cust_user_id;
  let description = req.body.description;
  let status = req.body.status != undefined ? req.body.status : 1;
  let type = req.body.type != undefined ? req.body.type : 'admin_quotes';
  let created_at = formattedTimestamp();
  let updated_at = formattedTimestamp();
  let password =
    req.body.password != undefined &&
    req.body.password != '' &&
    req.body.password != 'undefined'
      ? req.body.password
      : null;

  let user_type,
    user_id = null;

  let authHeader = req.headers.authorization;
  if (authHeader == undefined) {
    return { message: 'No token provided', status: 500 };
  }

  let token = authHeader.split(' ')[1];
  jwt.verify(token, 'secret', function (err, decoded) {
    cust_id = decoded.cust_id;
    user_id = decoded.id;
    user_type = decoded.user_type;
    // TODO this was added later but seemingly not used?
    // customer_id = decoded.cust_id;
  });

  let quote = await mysql2Client.dbQuery(insert.admin.addQuoteToCustomer, [
    cust_id,
    date,
    category,
    adm_quote,
    adm_quote_status,
    adm_expiry_date,
    cust_user_id,
    description,
  ]);

  if (typeof req.file != 'undefined') {
    const newFileName = datetime + '-' + req.file.originalname;
    let remoteFile = bucket.file('admin_quotes/' + newFileName);

    // TODO wrap in try / catch
    await remoteFile.save(req.file.buffer, function (error) {
      return error
        ? {
            message: 'File failed to upload !',
            status: 500,
          }
        : true;
    });

    let publicUrl = `${req.app.locals.bucketLocation}/${remoteFile.name}`;

    let file = await mysql2Client.dbQuery(
      insert.admin.fileWithOptionalPassword,
      [
        cust_id,
        status,
        type,
        file_name,
        publicUrl,
        password,
        created_at,
        updated_at,
      ],
    );

    await mysql2Client.dbQuery(update.admin.updateQuoteFileUpload, [
      adm_quote_status,
      file.insertId,
      quote.insertId,
      cust_id,
    ]);
  }

  recordLog(
    'Added quote to customer, quote_id: ' +
      quote.insertId +
      ' , customer_id: ' +
      cust_id,
    req,
  );

  return null == quote
    ? { message: 'Failed to add quote', status: 500 }
    : {
        message: 'Added quote to customer',
        status: 200,
        data: quote,
      };
};

const updateContractInvoiceStatus = async (req, callback) => {
  const con = req.app.locals.connection;

  // recordLog('Uploaded quote file for quote_id: ' + quote_id, req);
  let contracts = await mysql2Client.dbQuery(
    update.admin.expirePendingContracts,
  );

  recordLogScheduledJob(`Updated ${contracts.affectedRows} contracts.`);

  let invoices = await mysql2Client.dbQuery(update.admin.flagOverdueInvoices);

  recordLogScheduledJob(`Updated ${contracts.affectedRows} invoices.`);

  return {
    message: 'Updated Contract/Invoices status to expired/overdue',
    status: 200,
  };
};

const customerApproveByAdmin = async (req, callback) => {
  const con = req.app.locals.connection;
  let user_id = req.body.user_id;

  let approvedUser = await mysql2Client.dbQuery(update.admin.approveUserById, [
    user_id,
  ]);

  let contact = await mysql2Client.dbQuery(select.admin.companyFullNameById, [
    user_id,
  ]);

  const accountApprovalMailOptions = {
    from: req.app.locals.senderEmail, // sender address
    to: contact[0].p_email, // list of receivers
    subject: 'Your Ryse Solutions Universal Portal Account is Approved',
    template: 'account_approval', // the name of the template file i.e email.handlebars
    context: {
      first_name: contact[0].p_first_name, // replace {{first_name}}
    },
  };

  // TODO wrap in try / catch
  mail.sendMail(accountApprovalMailOptions, function (err, user) {
    if (err) {
      console.log(err);
      return;
    }
  });

  return null == approvedUser
    ? { message: 'Failed to approve user', status: 500 }
    : {
        message: `${contact[0].first_name} ${contact[0].last_name} is approved !`,
        status: 200,
        data: approvedUser,
      };
};

module.exports = {
  uploadQuoteFile,
  uploadContractFile,
  uploadInvoiceFile,
  addQuoteToCustomer,
  updateContractInvoiceStatus,
  customerApproveByAdmin,
  loginAsUser,
};
