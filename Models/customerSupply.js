const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const mysql2Client = require('../Database/client');
const { select, insert, update, remove } = require('../Database/queries');
const util = require('util');
const { recordLog, formattedTimestamp } = require('../lib/db-utils');

const createNewCustomerSupply = async (req) => {
  const obj = JSON.parse(JSON.stringify(req.body));
  let cur_date = new Date();
  let cust_id = req.body.cust_id;
  let user_id = req.body.user_id;
  let period_start =
    req.body.period_start + ' ' + cur_date.toISOString().slice(11, 18);
  let period_end =
    req.body.period_end + ' ' + cur_date.toISOString().slice(11, 18);
  let contract_id = req.body.contract_id;
  let supply = null;

  if (typeof req.body.supply_details != 'undefined') {
    let supply_details = JSON.parse(JSON.stringify(req.body.supply_details));
    supply_details = JSON.parse(supply_details);
    for (let property in supply_details) {
      let material_id = supply_details[property]['material_id'];
      let amount = supply_details[property]['amount'];
      let uom_id = supply_details[property]['uom_id'];

      supply = await mysql2Client.dbQuery(insert.customerSupply.create, [
        cust_id,
        user_id,
        contract_id,
        material_id,
        amount,
        period_start,
        period_end,
        uom_id,
      ]);
    }
  }

  return null == supply
    ? { message: `Failed to create supply !`, status: 500 }
    : {
        message: `Customer supply added successfully.`,
        status: 200,
        data: supply,
      };
};

const updateNewCustomerSupply = async (req) => {
  let cur_date = new Date();
  let cust_supply_id = req.params.id;
  let cust_id = req.body.cust_id;
  let user_id = req.body.user_id;
  let contract_id = req.body.contract_id;
  let material_id = req.body.material_id;
  let amount = req.body.amount;
  let period_start =
    req.body.period_start + ' ' + cur_date.toISOString().slice(11, 18);
  let period_end =
    req.body.period_end + ' ' + cur_date.toISOString().slice(11, 18);
  let uom_id = req.body.uom_id;

  let supply = await mysql2Client.dbQuery(update.customerSupply.updateById, [
    cust_id,
    user_id,
    contract_id,
    material_id,
    amount,
    period_start,
    period_end,
    uom_id,
    cust_supply_id,
  ]);

  return null == supply
    ? { message: `Failed to update supply !`, status: 500 }
    : {
        message: `Customer supply updated successfully.`,
        status: 200,
        data: supply,
      };
};

const fetchAllCustomerSupply = async (req) => {
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type = null;
  let cust_id = null;
  let sort = req.query.sort;

  jwt.verify(token, 'secret', function (err, decoded) {
    // res.send(decoded);
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
  });

  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const offset = (page - 1) * limit;

  let query,
    params,
    order_by = null;

  switch (sort) {
    case 'material':
      order_by = 'cust_supply.material_master_id';
      break;
    case 'contract':
      order_by = 'cust_supply.contract_id';
      break;
    case 'date':
      order_by = 'cust_supply.period_start';
      break;
    default:
      order_by = 'cust_supply.period_start';
      break;
  }

  if (user_type == 'admin') {
    query = select.customerSupply.adminFetchAll;
    params = [order_by, limit, offset];
  } else if (user_type == 'company' || user_type == 'user') {
    query = select.customerSupply.userFetchAll;
    params = [cust_id, order_by, limit, offset];
  } else {
    // TODO improve this with RBAC
    return { message: 'Permission failed', status: 500 };
  }

  let supply = await mysql2Client.dbQuery(query, params);

  return null == supply
    ? { message: `Failed to fetch supply data`, status: 500 }
    : {
        message: `Received all supply data.`,
        status: 200,
        data: supply,
      };
};

const fetchSingleCustomerSupply = async (req) => {
  let cust_supply_id = req.params.id;

  let supply = await mysql2Client.dbQuery(select.customerSupply.byId, [
    cust_supply_id,
  ]);

  // TODO remove this?
  for (let property in supply[0]) {
    if (supply[0][property] == null) {
      supply[0][property] = '';
    }
  }

  let quoteRequestLine = await mysql2Client.dbQuery(
    select.customerSupply.quoteRequestLineByQuoteId,
    [supply.quote_id],
  );

  supply[0].quote_request_line = quoteRequestLine;

  return null == supply
    ? { message: `No supply data received`, status: 500 }
    : {
        message: `Received a supply data record.`,
        status: 200,
        data: supply,
      };
};

const deleteSingleCustomerSupply = async (req) => {
  let cust_supply_id = req.params.id;

  let supply = await mysql2Client.dbQuery(remove.customerSupply.byId, [
    cust_supply_id,
  ]);

  // TODO improve for auditing
  recordLog('Deleted customer supply :' + cust_supply_id, req);

  return null == supply
    ? { message: `Failed to delete supply data !`, status: 500 }
    : {
        message: `Customer supply data deleted successfully.`,
        status: 200,
        data: supply,
      };
};

const downloadCustomerSupply = async (req) => {
  let contract_id = req.body.contract_id;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type = null;
  let cust_id = null;

  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
  });

  let query,
    params = null;

  if (user_type == 'admin') {
    if (typeof contract_id != 'undefined') {
      query = select.customerSupply.adminDownloadByContractId;
      params = [contract_id];
    } else {
      query = select.customerSupply.adminDownload;
    }
  } else if (user_type == 'company' || user_type == 'user') {
    query = select.customerSupply.userDownloadByUserId;
    params = [cust_id];
  }

  let supply = await mysql2Client.dbQuery(query, params);

  return null == supply
    ? { message: `Failed to retrieve supply data !`, status: 500 }
    : {
        message: `Received customer supply data for download.`,
        status: 200,
        data: supply,
      };
};

module.exports = {
  createNewCustomerSupply,
  updateNewCustomerSupply,
  fetchAllCustomerSupply,
  fetchSingleCustomerSupply,
  deleteSingleCustomerSupply,
  downloadCustomerSupply,
};
