const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const mail = require('../Controllers/Helpers/sendGridMailer');
require('dotenv').config();
const mysql2Client = require('../Database/client');
const { select, insert, update, remove } = require('../Database/queries');
const util = require('util');
const { recordLog, formattedTimestamp } = require('../lib/db-utils');
var path = require('path');
const XLSX = require('xlsx');

const createNewQuote = async (req) => {
  const obj = JSON.parse(JSON.stringify(req.body));
  const bucket = req.app.locals.bucket;
  let cur_date = new Date();
  let cust_id = req.body.cust_id ? parseInt(req.body.cust_id) : null;
  let date = req.body.date + ' ' + cur_date.toISOString().slice(11, 18);
  let category = req.body.category;
  let adm_quote = req.body.adm_quote;
  let adm_quote_status = 'pending';
  let adm_expiry_date =
    req.body.adm_expiry_date + ' ' + cur_date.toISOString().slice(11, 18);
  let cust_user_id = req.body.cust_user_id;
  let description = req.body.description;
  let collection_from_location = req.body.collection_from_location;
  let governance_council = req.body.governance_council;
  let authHeader = req.headers.authorization;
  let response = null;

  if (authHeader == undefined) {
    return { message: 'No token provided', status: 500 };
  }

  let user_type,
    quote_id,
    customer_id,
    user_id = null;
  let token = authHeader.split(' ')[1];
  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    customer_id = decoded.cust_id;
    user_id = decoded.id;
  });

  if (user_type != 'admin' && customer_id != cust_id) {
    return { message: 'Invalid operation to quote data', status: 500 };
  }

  let quote = null;

  await fileValidation(req, async function (err, result) {
    // TODO should catch a thrown exception from #fileValidation here if failure breaks control flow !  long conditional branches are messy and take up unnecessary memory
    if (err) {
      return { message: err, status: 500 };
    } else {
      quote = await mysql2Client.dbQuery(insert.quotes.createQuote, [
        cust_id,
        date,
        category,
        adm_quote,
        adm_quote_status,
        adm_expiry_date,
        cust_user_id,
        description,
        collection_from_location,
        governance_council,
      ]);

      recordLog('Created the quote :' + quote.insertId, req);
      // console.info(`Created the quote ${util.inspect(quote, { depth: null })}`);

      if (typeof req.body.quote_request_line != 'undefined') {
        let quoteLines = JSON.parse(
          JSON.stringify(req.body.quote_request_line),
        );
        quoteLines = JSON.parse(quoteLines);
        // BEGIN insert quoteLines
        for (let property in quoteLines) {
          let quote_id = quote.insertId;
          let customer_id = req.body.cust_id;
          let line_number = quoteLines[property]['line_number'];
          let amount = quoteLines[property]['volume'];
          let uom = quoteLines[property]['uom'];
          let category = req.body.category;
          let sub_category_1 = quoteLines[property]['sub_category_1'];
          let sub_category_2 = quoteLines[property]['sub_category_2'];
          let year = quoteLines[property]['year'];

          // TODO Material should be a model - use a getter here
          let material = await mysql2Client.dbQuery(
            select.quotes.materialByCategories,
            [category, sub_category_1, sub_category_2],
          );

          let uomData = await mysql2Client.dbQuery(
            select.quotes.uomByMaterialId,
            [uom, material[0].id],
          );

          // TODO this should be using the quoteLine model
          let quoteRequestLine = mysql2Client.dbQuery(
            insert.quotes.createQuoteRequestLine,
            [
              customer_id,
              quote_id,
              line_number,
              amount,
              uomData[0].id,
              material[0].id,
              year,
            ],
          );
        }
      } // END insert quoteLines

      quote_id = quote.insertId; // TODO fix reassignment?

      if (typeof req.files.file != 'undefined') {
        // TODO use an object prototype here, duplicated code
        let status =
          req.body.quote_file_status != undefined
            ? req.body.quote_file_status
            : 1;
        let type =
          req.body.quote_file_type != undefined
            ? req.body.quote_file_type
            : 'tires';
        let password =
          req.body.quote_file_password != undefined &&
          req.body.quote_file_password != '' &&
          req.body.quote_file_password != 'undefined'
            ? req.body.quote_file_password
            : null;
        await uploadQuoteFiles(
          req,
          bucket,
          req.files.file,
          cust_id,
          status,
          type,
          password,
          quote_id,
          'user_file_id',
        );
      }

      if (typeof req.files.file_collection_target != 'undefined') {
        let status =
          req.body.collection_target_file_status != undefined
            ? req.body.collection_target_file_status
            : 1;
        let type =
          req.body.collection_target_file_type != undefined
            ? req.body.collection_target_file_type
            : 'collection-target';
        let password =
          req.body.collection_target_file_password != undefined &&
          req.body.collection_target_file_password != '' &&
          req.body.collection_target_file_password != 'undefined'
            ? req.body.collection_target_file_password
            : null;
        await uploadQuoteFiles(
          req,
          bucket,
          req.files.file_collection_target,
          cust_id,
          status,
          type,
          password,
          quote_id,
          'file_collection_target',
        );
      }
    }
  });

  return null == quote
    ? { message: 'Failed to create quote', status: 500 }
    : {
        message: 'Quote created successfully',
        status: 200,
        data: quote.insertId,
      };
};

const uploadQuoteFiles = async (
  req,
  bucket,
  file,
  customer_id,
  status,
  type,
  password,
  quote_id,
  updateColumn,
) => {
  let file_name = file[0].originalname;
  let created_at = formattedTimestamp();
  let updated_at = formattedTimestamp();
  let datetime = new Date().toISOString();
  const newFileName = datetime + '-' + file[0].originalname;

  let remoteFile = bucket.file('customer_quotes/' + newFileName);

  let upload = await remoteFile.save(file[0].buffer, function (error) {
    return error
      ? {
          message: 'File failed to upload !',
          status: 500,
        }
      : true;
  });

  let publicUrl = `${req.app.locals.bucketLocation}/customer_quotes/${newFileName}`;

  let quote = await mysql2Client.dbQuery(
    select.quotes.fileIdForQuoteByQuoteId,
    [updateColumn, quote_id],
  );

  let file_id = quote[0][updateColumn];

  let updatedFile = await mysql2Client.dbQuery(update.quotes.updateFileById, [
    status,
    type,
    file_name,
    publicUrl,
    updated_at,
    password,
    file_id,
  ]);

  if (updatedFile.changedRows == 0) {
    let newFile = await mysql2Client.dbQuery(insert.quotes.createNewFile, [
      customer_id,
      status,
      type,
      file_name,
      publicUrl,
      created_at,
      updated_at,
      password,
    ]);

    let file_id = newFile.insertId;

    // TODO dynamic column naming fails when passing through prepared statements
    // is there some elegant way around this?  perhaps another method in the client?
    // await mysql2Client.dbQuery(update.quotes.updateFileIdDynamicColumn, [
    //   updateColumn,
    //   file_id,
    //   quote_id,
    // ]);

    await mysql2Client.dbQuery(
      `UPDATE cust_quote_request SET ${updateColumn}= ? WHERE id= ?`,
      [file_id, quote_id],
    );
  }

  // TODO return a truthy value based on success or failure? or at least something
  return true;
};

const updateNewQuote = async (req) => {
  const bucket = req.app.locals.bucket;
  let cur_date = new Date();
  let quote_id = req.params.id;
  let cust_id = req.body.cust_id;
  let category = req.body.category;
  let adm_quote = req.body.adm_quote;
  let adm_quote_status = req.body.adm_quote_status;
  let adm_expiry_date =
    req.body.adm_expiry_date + ' ' + cur_date.toISOString().slice(11, 18);
  let cust_user_id = req.body.cust_user_id;
  let description = req.body.description;
  let collection_from_location = req.body.collection_from_location;
  let governance_council = req.body.governance_council;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type,
    customer_id = null;

  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    customer_id = decoded.cust_id;
  });

  const quoteForId = await mysql2Client.dbQuery(
    select.quotes.customerIdByQuoteId,
    [quote_id],
  );

  let quote = null;

  // TODO improve this with RBAC
  if (
    user_type != 'admin' &&
    (customer_id != quoteForId[0].cust_id || customer_id != cust_id)
  ) {
    return { message: 'Invalid operation to quote data', status: 500 };
  } else {
    await fileValidation(req, async function (err, result) {
      // TODO should catch a thrown exception from #fileValidation here if failure breaks control flow !  long conditional branches are messy and take up unnecessary memory
      if (err) {
        return { message: err, status: 500 };
      } else {
        quote = await mysql2Client.dbQuery(update.quotes.updateQuoteById, [
          cust_id,
          category,
          adm_quote,
          adm_quote_status,
          adm_expiry_date,
          cust_user_id,
          description,
          collection_from_location,
          governance_council,
          quote_id,
        ]);

        recordLog('Updated the quote :' + quote_id, req);

        if (typeof req.body.quote_request_line != 'undefined') {
          let quoteLines = JSON.parse(
            JSON.stringify(req.body.quote_request_line),
          );
          quoteLines = JSON.parse(quoteLines);
          // BEGIN update / insert quoteLines
          for (let property in quoteLines) {
            let quote_id = req.params.id;
            let customer_id = req.body.cust_id;
            let id = quoteLines[property]['id'];
            let line_number = quoteLines[property]['line_number'];
            let amount = quoteLines[property]['volume'];
            let uom = quoteLines[property]['uom'];
            let category = req.body.category;
            let sub_category_1 = quoteLines[property]['sub_category_1'];
            let sub_category_2 = quoteLines[property]['sub_category_2'];
            let year = quoteLines[property]['year'];

            // TODO Material should be a model - use a getter here
            let material = await mysql2Client.dbQuery(
              select.quotes.materialById,
              [category, sub_category_1, sub_category_2],
            );

            let uomData = await mysql2Client.dbQuery(
              select.quotes.uomByMaterialId,
              [uom, material[0].id],
            );

            // TODO basically 'upsert'; lots of duplication with createNewQuote
            // this should be using the quoteLine model
            let quoteRequestLine = mysql2Client.dbQuery(
              update.quotes.updateQuoteRequestLineById,
              [line_number, amount, uomData[0].id, material[0].id, year, id],
            );

            if (quoteRequestLine.affectedRows == 0) {
              quoteRequestLine = mysql2Client.dbQuery(
                insert.quotes.createQuoteRequestLine,
                [
                  customer_id,
                  quote_id,
                  line_number,
                  amount,
                  uomData[0].id,
                  material[0].id,
                  year,
                ],
              );
            }
          }
        } // END update / insert quoteLines

        if (typeof req.files.file != 'undefined') {
          // TODO use an object prototype here, duplicated code
          let status =
            req.body.quote_file_status != undefined
              ? req.body.quote_file_status
              : 1;
          let type =
            req.body.quote_file_type != undefined
              ? req.body.quote_file_type
              : 'tires';
          let password =
            req.body.quote_file_password != undefined &&
            req.body.quote_file_password != '' &&
            req.body.quote_file_password != 'undefined'
              ? req.body.quote_file_password
              : null;
          await uploadQuoteFiles(
            req,
            bucket,
            req.files.file,
            cust_id,
            status,
            type,
            password,
            quote_id,
            'user_file_id',
          );
        }

        if (typeof req.files.file_collection_target != 'undefined') {
          let status =
            req.body.collection_target_file_status != undefined
              ? req.body.collection_target_file_status
              : 1;
          let type =
            req.body.collection_target_file_type != undefined
              ? req.body.collection_target_file_type
              : 'collection-target';
          let password =
            req.body.collection_target_file_password != undefined &&
            req.body.collection_target_file_password != '' &&
            req.body.collection_target_file_password != 'undefined'
              ? req.body.collection_target_file_password
              : null;
          await uploadQuoteFiles(
            req,
            bucket,
            req.files.file_collection_target,
            cust_id,
            status,
            type,
            password,
            quote_id,
            'file_collection_target',
          );
        }
      }
    });
  }

  return null == quote
    ? { message: 'Failed to update quote', status: 500 }
    : {
        message: 'Quote updated successfully',
        status: 200,
        data: quote,
      };
};

const fetchAllQuotes = async (req) => {
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type = null;
  let cust_id = null;
  let quotes = {};
  let isImpersonating = false;
  jwt.verify(token, 'secret', function (err, decoded) {
    // res.send(decoded);
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
    isImpersonating = decoded.isImpersonating;
  });

  if (isImpersonating) {
    user_type = 'company';
  }

  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const order_by = req.query.order_by || 'id';
  const order = req.query.order || 'DESC';
  const offset = (page - 1) * limit;

  let orderBy,
    query,
    countQuery,
    countParams,
    params = null;

  switch (order_by) {
    case 'customer_name':
      orderBy = 'customer.company_name';
      break;
    case 'requestee_name':
      orderBy = 'cust_user.first_name';
    default:
      orderBy = 'cust_quote_request.' + order_by;
      break;
  }

  let suffix = `ORDER BY ${orderBy} ${order} limit ? OFFSET ?`;

  // TODO these role-based sort of queries could perhaps be given namespaces for clarity?
  // eg. select.admin.quotes.fetchAll ?
  // select.quotes.admin.fetchAll ?
  if (user_type == 'admin') {
    query = select.quotes.adminFetchAll + suffix;
    countQuery = select.quotes.adminCountRecords;
    params = [limit, offset];
  } else if (user_type == 'company' || user_type == 'user') {
    query = select.quotes.userFetchAll + suffix;
    countQuery = select.quotes.userCountRecords;
    countParams = [cust_id];
    params = [cust_id, limit, offset];
  } else {
    return { message: 'Permission failed', status: 500 };
  }

  let availableQuotes = await mysql2Client.dbQuery(query, params);

  let totalRecords = await mysql2Client.dbGetSingleRow(countQuery, countParams);

  // TODO investigate possibilities to combine queries + data structure to clean up
  quotes.totalRecords = totalRecords['count(*)'];
  quotes.data = availableQuotes;

  return {
    message: 'Received all available quotes',
    status: 200,
    data: quotes,
  };
};

const fetchSingleQuote = async (req) => {
  let quote_id = req.params.id;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type,
    cust_id = null;

  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
  });

  let quote = await mysql2Client.dbQuery(select.quotes.byQuoteId, [quote_id]);

  // TODO clean up using RBAC
  if (user_type != 'admin' && cust_id != quote[0].cust_id) {
    return { message: 'Invalid operation to quote data', status: 500 };
  }

  // TODO clean up
  if (quote[0].cust_quote_url != null)
    quote[0].cust_quote_filename = new URL(quote[0].cust_quote_url).pathname
      .split('/')
      .pop();
  if (quote[0].admin_quote_url != null)
    quote[0].admin_quote_filename = new URL(quote[0].admin_quote_url).pathname
      .split('/')
      .pop();
  if (quote[0].collection_target_file_url != null)
    quote[0].collection_target_filename = new URL(
      quote[0].collection_target_file_url,
    ).pathname
      .split('/')
      .pop();
  for (let property in quote[0]) {
    if (quote[0][property] == null) {
      quote[0][property] = '';
    }
  }

  let quoteLines = await mysql2Client.dbQuery(
    select.quotes.quoteLinesByQuoteId,
    [quote_id],
  );

  quote[0].quote_request_line = quoteLines;

  let user = await mysql2Client.dbQuery(select.quotes.userByUserId, [
    quote[0].cust_user_id,
  ]);

  let customer = await mysql2Client.dbQuery(
    select.quotes.customerByCustomerId,
    [user[0].cust_id],
  );

  // TODO clean up
  let incomplete_details = [];
  let cust_details = [];
  for (let property in user[0]) {
    if (user[0][property] == null) {
      incomplete_details.push(property);
    }
  }
  for (let property in customer[0]) {
    if (customer[0][property] == null) {
      cust_details.push(property);
    }
  }
  quote[0].customer_incomplete = cust_details;
  quote[0].user_incomplete = incomplete_details;

  return {
    message: 'Received quote',
    status: 200,
    data: quote,
  };
};

const deleteSingleQuote = async (req) => {
  let quote_id = req.params.id;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type = null;
  let cust_id = null;
  jwt.verify(token, 'secret', function (err, decoded) {
    // res.send(decoded);
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
  });

  let quote = await mysql2Client.dbQuery(select.quotes.forInvalidation, [
    quote_id,
  ]);

  if (user_type != 'admin' && cust_id != quote[0].cust_id) {
    return { message: 'Invalid operation to quote data', status: 500 };
  } else {
    let user_file_id = quote[0].user_file_id;
    let quote_file_id = quote[0].quote_file_id;

    let invalidatedQuote = await mysql2Client.dbQuery(
      update.quotes.invalidateById,
      ['invalid', null, null, quote_id],
    );

    if (invalidatedQuote.affectedRows == 0) {
      return { message: 'Failed to delete quote !', status: 500 };
    } else {
      recordLog('Deleted the quote :' + quote_id, req);
      // ${},${}

      let deletedFiles = await mysql2Client.dbQuery(remove.quotes.deleteFiles, [
        user_file_id,
        quote_file_id,
      ]);

      recordLog('Deleted files associated with quote  :' + quote_id, req);
    }
  }

  return {
    message: 'Deleted quote',
    status: 200,
    data: quote,
  };
};

const quotesRequested = async (req) => {
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type = null;
  let cust_id = null;
  let quotes = {};
  jwt.verify(token, 'secret', function (err, decoded) {
    // res.send(decoded);
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
  });
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const order_by = req.query.order_by || 'id';
  const order = req.query.order || 'DESC';
  const offset = (page - 1) * limit;

  let orderBy,
    query,
    countQuery,
    countParams,
    params = null;

  if (order_by == 'customer_name') {
    orderBy = 'customer.company_name';
  } else if (order_by == 'requestee_name') {
    orderBy = 'cust_user.first_name';
  } else {
    orderBy = 'cust_quote_request.' + order_by;
  }

  let suffix = `ORDER BY ${orderBy} ${order} limit ? OFFSET ?`;

  if (user_type == 'admin') {
    query = select.quotes.adminRequestedQuotes + suffix;
    countQuery = select.quotes.adminCountRequestedRecords;
    params = [limit, offset];
  } else if (user_type == 'company' || user_type == 'user') {
    query = select.quotes.userRequestedQuotes + suffix;
    countQuery = select.quotes.userCountRequestedRecords;
    countParams = [cust_id];
    params = [cust_id, limit, offset];
  } else {
    return { message: 'Permission failed', status: 500 };
  }

  let requestedQuotes = await mysql2Client.dbQuery(query, params);

  let totalRecords = await mysql2Client.dbGetSingleRow(countQuery, countParams);

  quotes.totalRecords = totalRecords['count(*)'];
  quotes.data = requestedQuotes;

  return {
    message: 'Received quotes',
    status: 200,
    data: quotes,
  };
};

const quotesExpired = async (req) => {
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type = null;
  let cust_id = null;
  let quotes = {};
  jwt.verify(token, 'secret', function (err, decoded) {
    // res.send(decoded);
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
  });
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const order_by = req.query.order_by || 'id';
  const order = req.query.order || 'DESC';
  const offset = (page - 1) * limit;

  let orderBy,
    query,
    countQuery,
    params,
    countParams = null;

  if (order_by == 'customer_name') {
    orderBy = 'customer.company_name';
  } else if (order_by == 'requestee_name') {
    orderBy = 'cust_user.first_name';
  } else {
    orderBy = 'cust_quote_request.' + order_by;
  }

  // TODO any way to avoid concatenating strings when dynamically sorting like this?
  // seems to be no way to do so using mysql package's methods
  let suffix = `ORDER BY ${orderBy} ${order} limit ? OFFSET ?`;

  if (user_type == 'admin') {
    query = select.quotes.adminExpiredQuotes + suffix;
    params = [limit, offset];
    countQuery = select.quotes.adminCountExpiredRecords;
  } else if (user_type == 'company' || user_type == 'user') {
    query = select.quotes.userExpiredQuotes + suffix;
    params = [cust_id, limit, offset];
    countQuery = select.quotes.userCountExpiredRecords;
    countParams = [cust_id];
  } else {
    return { message: 'Permission failed', status: 500 };
  }

  let expiredQuotes = await mysql2Client.dbQuery(query, params);

  let totalRecords = await mysql2Client.dbGetSingleRow(countQuery, countParams);

  quotes.totalRecords = totalRecords['count(*)'];
  quotes.data = expiredQuotes;

  return {
    message: 'Received expired quotes',
    status: 200,
    data: quotes,
  };
};

const quotesApproved = async (req) => {
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type = null;
  let cust_id = null;
  let quotes = {};
  jwt.verify(token, 'secret', function (err, decoded) {
    // res.send(decoded);
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
  });
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const order_by = req.query.order_by || 'id';
  const order = req.query.order || 'DESC';
  const offset = (page - 1) * limit;

  let orderBy,
    query,
    countQuery,
    countParams,
    params = null;

  if (order_by == 'customer_name') {
    orderBy = 'customer.company_name';
  } else if (order_by == 'requestee_name') {
    orderBy = 'cust_user.first_name';
  } else {
    orderBy = 'cust_quote_request.' + order_by;
  }

  let suffix = `ORDER BY ${orderBy} ${order} limit ? OFFSET ?`;

  if (user_type == 'admin') {
    query = select.quotes.adminApprovedQuotes + suffix;
    params = [limit, offset];
    countQuery = select.quotes.adminCountApprovedRecords;
  } else if (user_type == 'company' || user_type == 'user') {
    query = select.quotes.userApprovedQuotes + suffix;
    params = [cust_id, limit, offset];
    countQuery = select.quotes.userCountApprovedRecords;
    countParams = [cust_id];
  } else {
    return { message: 'Permission failed', status: 500 };
  }

  let approvedQuotes = await mysql2Client.dbQuery(query, params);

  let totalRecords = await mysql2Client.dbGetSingleRow(countQuery, countParams);

  quotes.totalRecords = totalRecords['count(*)'];
  quotes.data = approvedQuotes;

  return {
    message: 'Received approved quotes',
    status: 200,
    data: quotes,
  };
};

const quotesApproveCustomer = async (req) => {
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type = null;
  let cust_id = null;
  jwt.verify(token, 'secret', function (err, decoded) {
    // res.send(decoded);
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
  });
  let quoteId = req.body.quote_id;
  let quote = await mysql2Client.dbQuery(update.quotes.approveById, [quoteId]);
  //TODO: Not ideal, should use a single query to update and return the company_name.
  let companyDetails = await mysql2Client.dbQuery(
    select.admin.companyFullNameById,
    [cust_id],
  );
  let companyName = companyDetails[0].company_name;

  console.log(companyName);
  console.log('approved quote...');

  const quoteApprovedMailOptions = {
    from: req.app.locals.senderEmail, // sender address
    to: req.app.locals.contactEmail, // list of receivers
    subject: `Ryse Portal - ${companyName} has approved quote #${quoteId}`,
    template: 'quote_approve', // the name of the template file within the notifications folder i.e account_approval.handlebars
    context: {
      quoteId: quoteId,
      company: companyName,
    },
  };

  mail.sendMail(quoteApprovedMailOptions, function (err, result) {
    if (err) {
      return { message: err, status: 500 };
    }
  });

  console.log('mail sent...');

  return null != quote
    ? {
        message: 'Quote approved successfully.',
        status: 200,
        data: quote,
      }
    : {
        message: 'Failed to approve quote !',
        status: 500,
      };
};

const uploadCustQuoteFile = async (req) => {
  const bucket = req.app.locals.bucket;
  let quote = null;

  if (typeof req.file != 'undefined') {
    let datetime = new Date().toISOString();
    let quote_id = req.body.quote_id;
    let customer_id = req.body.cust_id;
    let user_type = null;
    let cust_id = null;
    let user_id = null;
    let file_name = '';
    let updated_at = formattedTimestamp();
    let created_at = formattedTimestamp();
    let type = 'customer_tires';
    let status = req.body.status.length != 0 ? req.body.status : 1;
    let password =
      req.body.password != undefined &&
      req.body.password != '' &&
      req.body.password != 'undefined'
        ? req.body.password
        : null;

    let authHeader = req.headers.authorization;
    let token = authHeader.split(' ')[1];
    jwt.verify(token, 'secret', function (err, decoded) {
      user_type = decoded.user_type;
      cust_id = decoded.cust_id;
      user_id = decoded.id;
    });

    if (user_type != 'admin') {
      if (customer_id != cust_id) {
        return { message: 'Invalid operation.', status: 500 };
      }
    }

    const newFileName = datetime + '-' + req.file.originalname;

    file_name = req.file.originalname;

    let file = bucket.file('customer_quotes/' + newFileName);

    let upload = await file.save(req.file.buffer, function (error) {
      return error
        ? {
            message: 'File failed to upload !',
            status: 500,
          }
        : true;
    });

    let publicUrl = `${req.app.locals.bucketLocation}/${file.name}`;

    quote = await mysql2Client.dbQuery(select.quotes.byQuoteIdAndCustomerId, [
      quote_id,
      customer_id,
    ]);

    let attachedFile = await mysql2Client.dbGetSingleRow(
      select.quotes.getFileIdForQuote,
      [quote_id],
    );

    let updatedFile = await mysql2Client.dbQuery(update.quotes.updateFileById, [
      status,
      type,
      file_name,
      publicUrl,
      updated_at,
      password,
      attachedFile.user_file_id,
    ]);

    // upsert again
    // TODO move this logic to controller
    // TODO refactor, should be returning a single row anyway
    if (updatedFile.changedRows == 1) {
      quote[0].cust_quote_url = publicUrl;
      quote[0].cust_quote_filename = file_name;
    } else if (updatedFile.changedRows == 0) {
      let newFile = await mysql2Client.dbQuery(insert.quotes.createNewFile, [
        customer_id,
        status,
        type,
        file_name,
        publicUrl,
        created_at,
        updated_at,
        password,
      ]);

      let updatedQuote = await mysql2Client.dbQuery(
        update.quotes.updateFileIdForQuote,
        [newFile.insertId, quote_id],
      );

      // TODO refactor, should be returning a single row anyway
      if (quote && updatedQuote) {
        quote[0].cust_quote_url = publicUrl;
        quote[0].cust_quote_filename = file_name;
      }
    }

    return null != quote
      ? {
          message: 'Quote updated successfully',
          status: 200,
          data: quote,
        }
      : {
          message: 'Quote failed to update !',
          status: 500,
        };
  } else {
    return {
      message: 'No file in request',
      status: 200,
    };
  }
};

// TODO this could still use more cleanup
const deleteQuotesFile = async (req) => {
  const bucket = req.app.locals.bucket;
  let quote_id = req.body.quote_id;
  let bluebox_id = req.body.bluebox_id;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  var file_id = '';
  let user_type,
    customer_id,
    user_id = null;

  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    customer_id = decoded.cust_id;
    user_id = decoded.id;
  });

  if (typeof req.body.quote_id !== 'undefined') {
    let quote = await mysql2Client.dbQuery(select.quotes.quoteForDeletion, [
      quote_id,
    ]);

    if (user_type != 'admin' && customer_id != quote[0].cust_id) {
      return { message: 'Invalid operation.', status: 500 };
    }

    file_id = quote[0].user_file_id;
    let cust_id = quote[0].cust_id;

    let quoteFile = await mysql2Client.dbQuery(
      select.quotes.quoteFileForDeletion,
      [file_id],
    );

    if (user_type != 'admin' && customer_id != quoteFile[0].cust_id) {
      return { message: 'Invalid operation to quote.', status: 500 };
    }

    if (
      typeof quoteFile != 'undefined' &&
      quoteFile.length != 0 &&
      quoteFile[0].url != null
    ) {
      let file_name = quoteFile[0].url.split('customer_quotes/')[1];
      const file = bucket.file('customer_quotes/' + file_name);

      await file.delete().catch(() => {
        return {
          status: 400,
          message: 'Failed to delete from GCP',
        };
      });

      await mysql2Client.dbQuery(remove.quotes.deleteFileById, [file_id]);

      await mysql2Client.dbQuery(update.quotes.deleteQuoteFile, [
        null,
        cust_id,
        quote_id,
      ]);

      recordLog('Deleted the customer quote file for id :' + quote_id, req);
    } else {
      return { message: 'No quote file found.', status: 500 };
    }
  } else if (typeof req.body.bluebox_id !== 'undefined') {
    let blueBoxQuote = await mysql2Client.dbQuery(
      select.quotes.blueBoxQuoteForDeletion,
      [bluebox_id],
    );

    if (blueBoxQuote.length == 0) {
      return { message: 'No BlueBox quote file found.', status: 500 };
    }

    if (
      user_type != 'admin' &&
      customer_id != blueBoxQuote[0].organization_id
    ) {
      return { message: 'Invalid operation to BlueBox quote.', status: 500 };
    }

    let file_id = blueBoxQuote[0].user_file_id;
    let cust_id = blueBoxQuote[0].organization_id;

    let quoteFile = await mysql2Client.dbQuery(
      select.quotes.quoteFileForDeletion,
      [file_id],
    );

    if (user_type != 'admin' && customer_id != quoteFile[0].cust_id) {
      return { message: 'Invalid operation to BlueBox quote.', status: 500 };
    }

    if (
      typeof quoteFile != 'undefined' &&
      quoteFile.length != 0 &&
      quoteFile[0].url != null
    ) {
      let file_name = quoteFile[0].url.split('customer_quotes/')[1];
      const file = bucket.file('customer_quotes/' + file_name);

      await file.delete().catch(() => {
        return {
          status: 400,
          message: 'Failed to delete from GCP',
        };
      });

      await mysql2Client.dbQuery(remove.quotes.deleteFileById, [file_id]);

      await mysql2Client.dbQuery(update.quotes.deleteBlueBoxQuoteFile, [
        null,
        cust_id,
        bluebox_id,
      ]);
    }
  }
};

const fileValidation = (req, callback) => {
  if (typeof req.files.file_collection_target != 'undefined') {
    if (
      ['pdf', 'jpg', 'jpeg'].indexOf(
        req.files.file_collection_target[0].originalname.split('.')[
          req.files.file_collection_target[0].originalname.split('.').length - 1
        ],
      ) === -1
    ) {
      return callback(
        {
          err: 'Invalid collection target file. Supported formats are pdf, jpg, and jpeg',
        },
        null,
      );
    }
  }

  if (typeof req.files.file != 'undefined') {
    if (
      ['pdf', 'xlsx'].indexOf(
        req.files.file[0].originalname.split('.')[
          req.files.file[0].originalname.split('.').length - 1
        ],
      ) === -1
    ) {
      return callback(
        {
          err: 'Invalid quote file format. Supported formats are pdf and xlsx',
        },
        null,
      );
    }
  }
  return callback(null, true);
};

module.exports = {
  createNewQuote,
  updateNewQuote,
  fetchAllQuotes,
  fetchSingleQuote,
  deleteSingleQuote,
  quotesRequested,
  quotesExpired,
  quotesApproved,
  quotesApproveCustomer,
  uploadCustQuoteFile,
  deleteQuotesFile,
};
