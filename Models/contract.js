const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const mail = require('../Controllers/Helpers/sendGridMailer');
const mysql2Client = require('../Database/client');
const { select, insert, update, remove } = require('../Database/queries');
const util = require('util');
const { recordLog, formattedTimestamp } = require('../lib/db-utils');
require('dotenv').config();

const createNewContract = async (req) => {
  const bucket = req.app.locals.bucket;
  let cur_date = new Date();
  let cust_id = req.body.cust_id;
  let quote_id = req.body.quote_id;
  let date_entered =
    req.body.date_entered + ' ' + cur_date.toISOString().slice(11, 18);
  let adm_contract_status = req.body.adm_contract_status || 'pending';
  let adm_con_start_date =
    req.body.adm_con_start_date + ' ' + cur_date.toISOString().slice(11, 18);
  let adm_con_end_date =
    req.body.adm_con_end_date + ' ' + cur_date.toISOString().slice(11, 18);
  let adm_contract_type = req.body.adm_contract_type;
  let user_id_approved = req.body.user_id_approved;
  let contract_signed_att = req.body.contract_signed_att;
  let contract_signed_date =
    req.body.contract_signed_date + ' ' + cur_date.toISOString().slice(11, 18);
  let adm_number_of_invoices = req.body.adm_number_of_invoices;

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
  if (customer_id != cust_id && user_type != 'admin') {
    return { message: 'Invalid operation', status: 500 };
  }

  let contract = await mysql2Client.dbQuery(insert.contracts.create, [
    cust_id,
    quote_id,
    date_entered,
    adm_contract_status,
    adm_con_start_date,
    adm_con_end_date,
    adm_contract_type,
    user_id_approved,
    contract_signed_att,
    contract_signed_date,
    adm_number_of_invoices,
  ]);

  let contract_id = contract.insertId;
  recordLog('Created the contract :' + contract.insertId, req);

  if (typeof req.file != 'undefined') {
    let datetime = new Date().toISOString();
    let date_time =
      cur_date.toISOString().slice(0, 9) +
      ' ' +
      cur_date.toISOString().slice(11, 18);
    let contract_id = contract.insertId;
    let cust_id = req.body.cust_id;
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
    let updatedContract = null;

    let publicUrl = null;
    const newFileName = datetime + '-' + req.file.originalname;
    if (user_type == 'admin') {
      let type = req.body.type != undefined ? req.body.type : 'admin_contracts';
      let uploadFile = bucket.file('admin_contracts/' + newFileName);
      let upload = await uploadFile.save(req.file.buffer, function (error) {
        return error
          ? {
              message: 'File failed to upload !',
              status: 500,
            }
          : true;
      });
      publicUrl = `${req.app.locals.bucketLocation}/${uploadFile.name}`;
      let file = await mysql2Client.dbQuery(insert.contracts.createNewFile, [
        cust_id,
        status,
        type,
        file_name,
        publicUrl,
        created_at,
        updated_at,
        password,
      ]);

      let admin_contract_file_id = file.insertId;
      // TODO note nearly duplicated query from admin query
      updatedContract = await mysql2Client.dbQuery(
        update.contracts.updateContractFileUploadAdmin,
        [admin_contract_file_id, contract_id],
      );

      // TODO double check best method for short-circuiting
      contract &&
        updatedContract &&
        (contract.customer_contract_file_id =
          updatedContract.customer_contract_file_id);
    } else if (user_type == 'company' || user_type == 'user') {
      let type =
        req.body.type != undefined ? req.body.type : 'customer_contracts';
      let uploadFile = bucket.file('customer_contracts/' + newFileName);
      let upload = await uploadFile.save(req.file.buffer, function (error) {
        return error
          ? {
              message: 'File failed to upload !',
              status: 500,
            }
          : true;
      });
      publicUrl = `${req.app.locals.bucketLocation}/${uploadFile.name}`;
      let file = await mysql2Client.dbQuery(insert.contracts.createNewFile, [
        cust_id,
        status,
        type,
        file_name,
        publicUrl,
        created_at,
        updated_at,
        password,
      ]);

      let customer_contract_file_id = file.insertId;
      let updatedContract = await mysql2Client.dbQuery(
        'UPDATE cust_contract SET customer_contract_file_id=? WHERE id=?',
        [customer_contract_file_id, contract_id],
      );

      // TODO double check best method for short-circuiting
      contract &&
        updatedContract &&
        (contract.customer_contract_file_id =
          updatedContract.customer_contract_file_id);
    }
  }

  return null == contract
    ? { message: 'Failed to create contract', status: 500 }
    : {
        message: 'Contract created successfully',
        status: 200,
        data: contract,
      };
};

const deleteSingleContract = async (req) => {
  let contract_id = parseInt(req.params.id);
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type,
    cust_id = null;

  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
  });

  let contract = await mysql2Client.dbGetSingleRow(select.contracts.byId, [
    contract_id,
  ]);

  if (contract.cust_id != cust_id && user_type != 'admin') {
    return { message: 'Invalid operation', status: 500 };
  } else {
    let admin_contract_file_id = contract.admin_contract_file_id;
    let customer_contract_file_id = contract.customer_contract_file_id;

    let updatedContract = await mysql2Client.dbQuery(
      update.contracts.invalidateContract,
      ['invalid', null, null, contract_id],
    );

    if (updatedContract.affectedRows != 0) {
      recordLog('Deleted the contract :' + contract_id, req);
      let files = await mysql2Client.dbQuery(remove.contracts.deleteFiles, [
        admin_contract_file_id,
        customer_contract_file_id,
      ]);

      if (files.affectedRows != 0) {
        return {
          status: 200,
          message: 'Deleted Successfully',
        };
      } else {
        return { status: 400, message: 'File not found' };
      }
    } else {
      return { status: 400, message: 'Failed to update contract' };
    }
  }
};

const fetchSingleContract = async (req) => {
  let contract_id = req.params.id;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type,
    cust_id = null;

  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
  });

  let contract = await mysql2Client.dbGetSingleRow(
    select.contracts.detailsById,
    [contract_id],
  );

  if (contract.cust_id != cust_id && user_type != 'admin') {
    return { message: 'Invalid operation', status: 500 };
  }

  if (contract.ryse_contract_url != null)
    contract.ryse_contract_filename = new URL(
      contract.ryse_contract_url,
    ).pathname
      .split('/')
      .pop();
  if (contract.customer_contract_url != null)
    contract.customer_contract_filename = new URL(
      contract.customer_contract_url,
    ).pathname
      .split('/')
      .pop();

  // TODO improve naming conventions
  let quoteRequestLine = await mysql2Client.dbQuery(
    select.contracts.quoteRequestLineByQuoteId,
    [contract.quote_id],
  );

  contract.quote_request_line = quoteRequestLine;

  return null == contract
    ? { message: 'Failed to fetch contract', status: 500 }
    : {
        message: 'Received contract',
        status: 200,
        data: contract,
      };
};

const updateNewContract = async (req) => {
  let cur_date = new Date();
  let contract_id = req.params.id;
  let cust_id = req.body.cust_id;
  let quote_id = req.body.quote_id;
  let adm_contract_status = req.body.adm_contract_status;
  let adm_con_start_date =
    req.body.adm_con_start_date + ' ' + cur_date.toISOString().slice(11, 18);
  let adm_con_end_date =
    req.body.adm_con_end_date + ' ' + cur_date.toISOString().slice(11, 18);
  let adm_contract_type = req.body.adm_contract_type;
  let user_id_approved = req.body.user_id_approved;
  let contract_signed_att = req.body.contract_signed_att;
  let contract_signed_date =
    req.body.contract_signed_date + ' ' + cur_date.toISOString().slice(11, 18);
  let adm_number_of_invoices = req.body.adm_number_of_invoices;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type,
    customer_id = null;
  let updatedContract = null;

  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    customer_id = decoded.cust_id;
  });

  if (customer_id != cust_id && user_type != 'admin') {
    return { message: 'Invalid operation', status: 500 };
  }

  let customerId = await mysql2Client.dbGetSingleValue(
    select.contracts.customerIdByContractId,
    [contract_id],
  );

  // TODO improve this with RBAC
  if (customerId != customer_id && user_type != 'admin') {
    return { message: 'Invalid operation', status: 500 };
  } else {
    updatedContract = await mysql2Client.dbQuery(update.contracts.byId, [
      cust_id,
      quote_id,
      adm_contract_status,
      adm_con_start_date,
      adm_con_end_date,
      adm_contract_type,
      user_id_approved,
      contract_signed_att,
      contract_signed_date,
      adm_number_of_invoices,
      contract_id,
    ]);

    recordLog('Updated the contract :' + contract_id, req);
  }

  return null == updatedContract
    ? { message: 'Failed to update contract !', status: 500 }
    : {
        message: 'Contract updated successfully.',
        status: 200,
        data: updatedContract,
      };
};

const fetchAllContracts = async (req) => {
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type,
    cust_id = null;
  let contracts = {};

  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
  });

  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const offset = (page - 1) * limit;

  let query,
    params = null;
  // TODO remove this check?
  if (user_type == 'admin') {
    query = select.contracts.adminFetchAll;
    params = [limit, offset];
  } else if (user_type == 'company' || user_type == 'user') {
    query = select.contracts.userFetchAll;
    params = [cust_id, limit, offset];
  } else {
    // TODO improve this with RBAC
    return { message: 'Permission failed', status: 500 };
  }

  let contractData = await mysql2Client.dbQuery(query, params);

  let countQuery = null;
  // TODO tidy up
  if (user_type == 'admin') {
    countQuery = `SELECT count(*) FROM cust_contract WHERE cust_contract.adm_contract_status !='invalid'`;
  } else if (user_type == 'company' || user_type == 'user') {
    countQuery = `SELECT count(*) FROM cust_contract WHERE cust_contract.adm_contract_status !='invalid' AND cust_contract.cust_id =${cust_id}`;
  }

  let totalRecords = await mysql2Client.dbGetSingleRow(countQuery);

  contracts.totalRecords = totalRecords['count(*)'];
  contracts.data = contractData;

  // TODO improve these inconsistent data structures
  // eg. return data and count as separate key-value pairs?
  // TODO should this be considered success if there are no contracts?
  return {
    message: 'Received contracts',
    status: 200,
    data: contracts,
  };

  // ...if not
  // return null == contractData
  //   ? { message: 'Failed to fetch contracts !', status: 500 }
  //   : {
  //       message: 'Received contracts',
  //       status: 200,
  //       data: contracts,
  //     };
};

const contractsExpired = async (req) => {
  let contracts = {};
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type,
    cust_id = null;

  jwt.verify(token, 'secret', function (err, decoded) {
    // res.send(decoded);
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
  });

  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const offset = (page - 1) * limit;

  let query,
    params = null;
  if (user_type == 'admin') {
    query = select.contracts.adminExpiredContracts;
    params = [limit, offset];
  } else if (user_type == 'company' || user_type == 'user') {
    query = select.contracts.userExpiredContracts;
    params = [cust_id, limit, offset];
  } else {
    // TODO improve this with RBAC
    return { message: 'Permission failed', status: 500 };
  }

  let contractData = await mysql2Client.dbQuery(query, params);

  let countQuery = null;
  // TODO tidy up
  if (user_type == 'admin') {
    countQuery = `SELECT count(*) FROM cust_contract WHERE cust_contract.adm_contract_status = 'expired'`;
  } else if (user_type == 'company' || user_type == 'user') {
    countQuery = `SELECT count(*) FROM cust_contract WHERE cust_contract.adm_contract_status = 'expired' and cust_contract.cust_id =${cust_id}`;
  }

  let totalRecords = await mysql2Client.dbGetSingleRow(countQuery);

  contracts.totalRecords = totalRecords['count(*)'];
  contracts.data = contractData;

  // TODO improve these inconsistent data structures
  // eg. return data and count as separate key-value pairs?
  // TODO should this be considered success if there are no contracts?
  return {
    message: 'Received contracts',
    status: 200,
    data: contracts,
  };

  // ...if not
  // return null == contractData
  //   ? { message: 'Failed to fetch contracts !', status: 500 }
  //   : {
  //       message: 'Received contracts',
  //       status: 200,
  //       data: contracts,
  //     };
};

const downloadContractFile = async (req) => {
  let contract_id = req.params.id;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let url = null;
  let user_type,
    cust_id = null;

  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
  });

  let query = null;
  if (user_type == 'company') {
    query = select.contracts.adminDownloadByContractId;
  } else {
    query = select.contracts.userDownloadByContractId;
  }

  url = await downloadContract(con, user_type, cust_id, contract_id, query);

  return null == url
    ? { message: 'Failed to fetch contract file', status: 500 }
    : {
        message: 'Received contract file',
        status: 200,
        data: url,
      };
};

const downloadContract = async (
  con,
  user_type,
  cust_id,
  contract_id,
  query,
) => {
  let contractFile = await mysql2Client.dbQuery(query, [contract_id]);

  if (contractFile.length != 0) {
    if (contractFile[0].cust_id != cust_id && user_type != 'admin') {
      return { message: 'Invalid operation', status: 500 };
    } else {
      let file_id = contractFile[0].file_id;
      let url = await mysql2Client.dbQuery(select.contracts.urlByFileId, [
        file_id,
      ]);

      return url;
    }
  } else {
    console.info(`No contract file found for ${contract_id} !`);
    return null;
  }
};

// TODO this should require a contract param within controller
const approveContractByUser = async (req) => {
  const bucket = req.app.locals.bucket;
  let contract_id = req.body.contract_id;
  let status = req.body.status != undefined ? req.body.status : 1;
  let type =
    req.body.type != undefined ? req.body.status : 'customer_contracts';
  let password =
    req.body.password != undefined &&
    req.body.password != '' &&
    req.body.password != 'undefined'
      ? req.body.password
      : null;
  let created_at = formattedTimestamp();
  let updated_at = formattedTimestamp();
  let cust_id,
    user_id,
    user_type = null;

  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];

  jwt.verify(token, 'secret', function (err, decoded) {
    cust_id = decoded.cust_id;
    user_id = decoded.id;
    user_type = decoded.user_type;
  });

  let contract = await mysql2Client.dbQuery(select.contracts.byId, [
    contract_id,
  ]);

  // TODO control flow inside controller, ie.
  // if (contract.length != 0) { ...
  // return { message: 'No contract found', status: 400 };

  if (contract[0].cust_id != cust_id && user_type != 'admin') {
    return { message: 'Invalid operation', status: 500 };
  } else {
    let file_id = contract[0].customer_contract_file_id;
    let updatedContract = await mysql2Client.dbQuery(
      update.contracts.approveContractById,
      [contract_id],
    );

    // TODO double check best method for short-circuiting
    contract &&
      updatedContract &&
      (contract.adm_contract_status = updatedContract.adm_contract_status);

    if (typeof req.file != 'undefined') {
      let datetime = new Date().toISOString();
      let contract_id = req.body.contract_id;

      let publicUrl = null;
      let file_name = req.file.originalname;
      const newFileName = datetime + '-' + req.file.originalname;
      // TODO BEGIN convert this to async/await, see Quote model
      let file = bucket.file('customer_contracts/' + newFileName);
      let upload = await file.save(req.file.buffer, function (error) {
        return error
          ? {
              message: 'File failed to upload !',
              status: 500,
            }
          : true;
      });
      publicUrl = `${req.app.locals.bucketLocation}/${file.name}`;

      if (file_id != null) {
        let file = await mysql2Client.dbQuery(update.contracts.updateFile, [
          status,
          type,
          file_name,
          publicUrl,
          file_id,
          cust_id,
        ]);

        if (file.changedRows == 0) {
          return { message: 'No contract file updated !', status: 500 };
        }
      } else {
        let file = await mysql2Client.dbQuery(insert.contracts.createNewFile, [
          cust_id,
          status,
          type,
          file_name,
          publicUrl,
          created_at,
          updated_at,
          password,
        ]);

        let file_id = file.insertId;
        let updatedContract = await mysql2Client.dbQuery(
          update.contracts.updateCustomerContractFileUpload,
          [file_id, contract_id],
        );
      }
    }

    let approvedContract = await mysql2Client.dbQuery(
      select.contracts.approvedContractForEmail,
      [contract_id],
    );

    const approveContractMailOptions = {
      from: req.app.locals.senderEmail, // sender address
      to: req.app.locals.contactEmail, // list of receivers
      subject: `Ryse Solutions' Universal Portal - A customer has approved contract ${approvedContract[0].id}`,
      template: 'contract_approve', // the name of the template file i.e contract_approve.handlebars
      context: {
        contractId: approvedContract[0].id, // replace {{contractId}},
      },
    };

    mail.sendMail(approveContractMailOptions, function (err, result) {
      if (err) {
        // TODO should this be an error or some sort of warning?
        return { message: err, status: 500 };
      } else {
        console.info('Customer email sent !');
      }
    });
  }

  return null == contract || contract[0].adm_contract_status !== 'active'
    ? { message: 'Failed to approve contract !', status: 500 }
    : {
        message: 'Contract approved.',
        status: 200,
        data: contract,
      };
};

const fetchAllContractsToInvoice = async (req) => {
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type,
    cust_id = null;

  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
  });

  // TODO what is this for?
  // month_count=0 OR COUNT(SELECT cust_invoice.id FROM cust_invoice WHERE cust_invoice.contract_id = cust_contract.id AND MONTH(date) = MONTH(CURRENT_DATE())) < ) THEN t.Amount END AS large

  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const offset = (page - 1) * limit;

  let query,
    params = null;
  if (user_type == 'admin') {
    query = select.contracts.adminContractsForInvoice;
  } else if (user_type == 'company' || user_type == 'user') {
    query = select.contracts.userContractsForInvoice;
    params = [cust_id, limit, offset];
  } else {
    // TODO improve this with RBAC
    return { message: 'Permission failed', status: 500 };
  }

  let contracts = await mysql2Client.dbQuery(query, params);

  // TODO these guards are wildly inconsistent, needs cleanup
  if (contracts.length === 0) {
    return {
      message: 'Failed to find any contracts to invoice !',
      status: 500,
    };
  } else {
    // TODO there's probably a better way to do this !
    for (let property in contracts) {
      if (contracts[property].cust_quote_url != null)
        contracts[property].cust_quote_filename = new URL(
          contracts[property].cust_quote_url,
        ).pathname
          .split('/')
          .pop();
      if (contracts[property].admin_quote_url != null)
        contracts[property].admin_quote_filename = new URL(
          contracts[property].admin_quote_url,
        ).pathname
          .split('/')
          .pop();
      if (contracts[property].ryse_contract_url != null)
        contracts[property].ryse_contract_filename = new URL(
          contracts[property].ryse_contract_url,
        ).pathname
          .split('/')
          .pop();
      if (contracts[property].customer_contract_url != null)
        contracts[property].customer_contract_filename = new URL(
          contracts[property].customer_contract_url,
        ).pathname
          .split('/')
          .pop();
      if (contracts[property].invoice_url != null)
        contracts[property].invoice_filename = new URL(
          contracts[property].invoice_url,
        ).pathname
          .split('/')
          .pop();
    }
  }

  return null == contracts
    ? { message: 'Failed to find any contracts to invoice', status: 500 }
    : {
        message: 'Received contracts for invoice',
        status: 200,
        data: contracts,
      };
};

module.exports = {
  createNewContract,
  deleteSingleContract,
  fetchSingleContract,
  fetchAllContracts,
  updateNewContract,
  contractsExpired,
  downloadContractFile,
  approveContractByUser,
  fetchAllContractsToInvoice,
};
