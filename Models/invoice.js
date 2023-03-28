const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const mail = require('../Controllers/Helpers/sendGridMailer');
require('dotenv').config();
const mysql2Client = require('../Database/client');
const { select, insert, update, remove } = require('../Database/queries');
const util = require('util');
const { recordLog, formattedTimestamp } = require('../lib/db-utils');

const createNewInvoice = async (req, callback) => {
  const con = req.app.locals.connection;
  const bucket = req.app.locals.bucket;
  let cur_date = new Date();
  let cust_id = req.body.cust_id;
  let contract_id = req.body.contract_id;
  let date = req.body.date + ' ' + cur_date.toISOString().slice(11, 18);
  let adm_invoice_att = req.body.adm_invoice_att;
  let adm_invoice_status = req.body.adm_invoice_status || 'invoiced';
  let adm_due_date =
    req.body.adm_due_date + ' ' + cur_date.toISOString().slice(11, 18);
  let adm_period_start =
    req.body.adm_period_start + ' ' + cur_date.toISOString().slice(11, 18);
  let adm_period_end =
    req.body.adm_period_end + ' ' + cur_date.toISOString().slice(11, 18);
  let adm_due_amount = req.body.adm_due_amount;
  let adm_billing_date =
    req.body.adm_billing_date + ' ' + cur_date.toISOString().slice(11, 18);

  con.query(
    'INSERT INTO cust_invoice (cust_id, contract_id, date, adm_invoice_att, adm_invoice_status, adm_due_date, adm_period_start, adm_period_end, adm_due_amount, adm_billing_date) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [
      cust_id,
      contract_id,
      date,
      adm_invoice_att,
      adm_invoice_status,
      adm_due_date,
      adm_period_start,
      adm_period_end,
      adm_due_amount,
      adm_billing_date,
    ],
    async (err, invoice_result, fields) => {
      if (err || invoice_result == null) {
        return callback(err, null);
      } else {
        recordLog('Created the invoice :' + invoice_result.insertId, req);
        con.query(
          `UPDATE cust_contract SET adm_contract_status='invoiced' WHERE id=?`,
          [contract_id],
          (err, invoice_result, fields) => {
            if (err) {
              return callback(err, null);
            }
          },
        );
        if (typeof req.file != 'undefined') {
          let datetime = new Date().toISOString();
          let invoice_id = invoice_result.insertId;
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
          let type = req.body.type != undefined ? req.body.type : 'invoice';
          let publicUrl = null;
          const newFileName = datetime + '-' + req.file.originalname;
          let file = bucket.file('admin_invoices/' + newFileName);
          let upload = await file.save(req.file.buffer, function (error) {
            return error
              ? {
                  message: 'File failed to upload !',
                  status: 500,
                }
              : true;
          });
          publicUrl = `${req.app.locals.bucketLocation}/${file.name}`;
          con.query(
            `SELECT p_email,p_first_name FROM customer WHERE id=${cust_id}`,
            (err, result, fields) => {
              if (err || result == null) {
                return callback(err, null);
              } else {
                const invoiceCreatedMailOptions = {
                  from: req.app.locals.senderEmail, // sender address
                  to: result[0].p_email, // list of receivers
                  subject: 'Ryse Solutions Universal Portal - Invoice Created',
                  template: 'invoice_created', // the name of the template file within the notifications folder i.e account_approval.handlebars
                  context: {
                    first_name: result[0].p_first_name, // replace {{first_name}}
                    publicUrl: publicUrl, // replace {{publicUrl}}
                  },
                };

                mail.sendMail(
                  invoiceCreatedMailOptions,
                  function (err, result) {
                    if (err) {
                      return callback(err, null);
                    }
                  },
                );
              }
            },
          );

          con.query(
            `INSERT INTO files (cust_id, status, type, name, url, created_at, updated_at, password) VALUES (?,?,?,?,?,?,?,?)`,
            [
              cust_id,
              status,
              type,
              file_name,
              publicUrl,
              created_at,
              updated_at,
              password,
            ],
            (err, result, fields) => {
              if (err) {
                return callback(err, null);
              } else {
                let invoice_file_id = result.insertId;
                con.query(
                  'UPDATE cust_invoice SET invoice_file_id=? WHERE id=?',
                  [invoice_file_id, invoice_id],
                  (err, result, fields) => {
                    if (err) {
                      return callback(err, null);
                    }
                  },
                );
                return callback(null, invoice_result);
              }
            },
          );
        } else {
          return callback(null, invoice_result);
        }
      }
    },
  );
};

const updateNewInvoice = (req, callback) => {
  const con = req.app.locals.connection;
  let cur_date = new Date();
  let invoice_id = req.params.id;
  let contract_id = req.body.contract_id;
  let adm_invoice_att = req.body.adm_invoice_att;
  let adm_invoice_status = req.body.adm_invoice_status;
  let adm_due_date =
    req.body.adm_due_date + ' ' + cur_date.toISOString().slice(11, 18);
  let adm_period_start =
    req.body.adm_period_start + ' ' + cur_date.toISOString().slice(11, 18);
  let adm_period_end =
    req.body.adm_period_end + ' ' + cur_date.toISOString().slice(11, 18);
  let adm_due_amount = req.body.adm_due_amount;
  let adm_billing_date =
    req.body.adm_billing_date + ' ' + cur_date.toISOString().slice(11, 18);

  con.query(
    'UPDATE cust_invoice SET contract_id=?, adm_invoice_att=?, adm_invoice_status=?, adm_due_date=?, adm_period_start=?, adm_period_end=?, adm_due_amount=?, adm_billing_date=? WHERE id=?',
    [
      contract_id,
      adm_invoice_att,
      adm_invoice_status,
      adm_due_date,
      adm_period_start,
      adm_period_end,
      adm_due_amount,
      adm_billing_date,
      invoice_id,
    ],
    (err, result, fields) => {
      if (err || result == null) {
        return callback(err, null);
      } else {
        recordLog('Updated the invoice :' + invoice_id, req);
        return callback(null, result);
      }
    },
  );
};

const deleteSingleInvoice = (req, callback) => {
  const con = req.app.locals.connection;
  let invoice_id = mysql.escape(req.params.id);
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type = null;
  let cust_id = null;
  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
  });
  con.query(
    `SELECT * FROM cust_invoice WHERE id=${invoice_id}`,
    (err, result, fields) => {
      if (err) {
        return callback(err, null);
      } else {
        if (result.length != 0) {
          if (result[0].cust_id != cust_id && user_type != 'admin') {
            return callback({ error: 'Invalid operation' }, null);
          }
          let file_id = result[0].invoice_file_id;
          con.query(
            `UPDATE cust_invoice SET adm_invoice_status='invalid',invoice_file_id=${null} WHERE id=${invoice_id}`,
            (err, result, fields) => {
              if (err || result == null) {
                return callback(err, null);
              } else {
                if (result.affectedRows != 0) {
                  recordLog('Deleted the invoice :' + invoice_id, req);
                  con.query(
                    `DELETE FROM files WHERE id=${file_id}`,
                    (err, result, fields) => {
                      if (err) {
                        return callback(err, null);
                      } else {
                        if (result.affectedRows != 0) {
                          return callback(null, {
                            status: 200,
                            message: 'Deleted Successfully',
                          });
                        } else {
                          return callback(
                            {
                              error:
                                'Contract delete and Contract file not found',
                            },
                            null,
                          );
                        }
                      }
                    },
                  );
                } else {
                  return callback({ error: 'Failed to update invoice' }, null);
                }
              }
            },
          );
        }
      }
    },
  );
};

const fetchSingleInvoice = (req, callback) => {
  const con = req.app.locals.connection;
  let invoice_id = mysql.escape(req.params.id);
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type = null;
  let cust_id = null;
  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
  });
  con.query(
    `SELECT ci.id,ci.cust_id,ci.contract_id,ci.date,ci.adm_invoice_att,ci.adm_invoice_status,ci.adm_due_date,ci.adm_period_start,ci.adm_period_end,CONCAT('$', FORMAT(ci.adm_due_amount/100, 2)) as adm_due_amount,ci.adm_billing_date,ci.updated_at,
    cc.quote_id,cc.date_entered,cc.adm_contract_status,cc.adm_con_start_date,cc.adm_con_end_date,cc.adm_contract_type,cc.user_id_approved,cc.contract_signed_att,cc.contract_signed_date,
    cc.adm_number_of_invoices,customer.company_name,cq.description as quote,cq.updated_at as quote_updated_at,files.url as invoice_url,files.password as invoice_password,files.name as invoice_filename,CONCAT_WS(' - ',ci.adm_period_start, ci.adm_period_end ) as period FROM cust_invoice as ci
    LEFT JOIN files ON files.id = ci.invoice_file_id
    LEFT JOIN customer ON customer.id = ci.cust_id
    LEFT JOIN cust_contract as cc ON cc.id = ci.contract_id
    LEFT JOIN cust_quote_request as cq ON cq.id = cc.quote_id
    WHERE ci.id=${invoice_id}`,
    (err, result, fields) => {
      if (err || result == null) {
        return callback(err, null);
      } else if (result.length == 0) {
        return callback('Output is null', null);
      } else {
        if (result[0].cust_id != cust_id && user_type != 'admin') {
          return callback({ error: 'Invalid operation' }, null);
        }
        if (result[0].invoice_url != null)
          result[0].invoice_filename = new URL(result[0].invoice_url).pathname
            .split('/')
            .pop();
        return callback(null, result);
      }
    },
  );
};

const fetchAllInvoice = (req, callback) => {
  const con = req.app.locals.connection;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type = null;
  let cust_id = null;
  let totalRecords = 0;
  let invoices = {};

  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
  });
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const offset = (page - 1) * limit;
  const order_by = req.query.order_by || 'id';
  const order = req.query.order || 'ASC';
  if (order_by == 'Period') {
    orderBy = 'ci.adm_period_start';
  } else if (order_by == 'Status') {
    orderBy = 'ci.adm_invoice_status';
  } else if (order_by == 'Amount') {
    orderBy = 'ci.adm_due_amount';
  } else if (order_by == 'Issue Date') {
    orderBy = 'ci.date';
  } else if (order_by == 'Due Date') {
    orderBy = 'ci.adm_due_date';
  } else if (order_by == 'Contract ID') {
    orderBy = 'ci.contract_id';
  } else {
    orderBy = 'ci.' + order_by;
  }
  if (user_type == 'admin') {
    query = `SELECT ci.id,ci.cust_id,ci.contract_id,ci.date,ci.adm_invoice_att,ci.adm_invoice_status,ci.adm_due_date,ci.adm_period_start,ci.adm_period_end,CONCAT('$', FORMAT(ci.adm_due_amount/100, 2)) as adm_due_amount,ci.adm_billing_date,ci.updated_at,
    customer.company_name,cq.description as quote,cq.updated_at as quote_updated_at,files.url as invoice_url,files.password as invoice_password,files.name as invoice_filename,CONCAT_WS(' - ',ci.adm_period_start, ci.adm_period_end ) as period FROM cust_invoice as ci
    LEFT JOIN files ON files.id = ci.invoice_file_id
    LEFT JOIN customer ON customer.id = ci.cust_id
    LEFT JOIN cust_contract as cc ON cc.id = ci.contract_id
    LEFT JOIN cust_quote_request as cq ON cq.id = cc.quote_id
    WHERE ci.adm_invoice_status !='invalid'
    ORDER BY ${orderBy} ${order} limit ${limit} OFFSET ${offset}`;
  } else if (user_type == 'company' || user_type == 'user') {
    query = `SELECT ci.id,ci.cust_id,ci.contract_id,ci.date,ci.adm_invoice_att,ci.adm_invoice_status,ci.adm_due_date,ci.adm_period_start,ci.adm_period_end,CONCAT('$', FORMAT(ci.adm_due_amount/100, 2)) as adm_due_amount,ci.adm_billing_date,ci.updated_at,
    cq.description as quote,cq.updated_at as quote_updated_at,files.url as invoice_url,files.password as invoice_password,files.name as invoice_filename,CONCAT_WS(' - ',ci.adm_period_start, ci.adm_period_end ) as period FROM cust_invoice as ci
    LEFT JOIN cust_contract as cc ON cc.id = ci.contract_id
    LEFT JOIN cust_quote_request as cq ON cq.id = cc.quote_id
    LEFT JOIN files ON files.id = ci.invoice_file_id
    WHERE ci.cust_id =${cust_id} AND ci.adm_invoice_status !='invalid'
    ORDER BY ${orderBy} ${order} limit ${limit} OFFSET ${offset}`;
  } else {
    return callback({ err: 'Permission failed' }, null);
  }

  con.query(query, (err, result, fields) => {
    if (err || result == null) {
      return callback(err, null);
    } else if (result.length == 0) {
      invoices.data = result;
      return callback(null, invoices);
    } else {
      if (user_type == 'admin') {
        countQuery = `SELECT count(*) FROM cust_invoice as ci WHERE ci.adm_invoice_status !='invalid'`;
      } else if (user_type == 'company' || user_type == 'user') {
        countQuery = `SELECT count(*) FROM cust_invoice as ci WHERE ci.cust_id =${cust_id} AND ci.adm_invoice_status !='invalid'`;
      }
      con.query(countQuery, (err, queryResult, fields) => {
        if (err || queryResult == null) {
          return callback(err, null);
        } else {
          totalRecords = queryResult[0]['count(*)'];
          for (let property in result) {
            if (
              result[property].invoice_url != null &&
              result[property].invoice_url != ''
            )
              result[property].invoice_filename = new URL(
                result[property].invoice_url,
              ).pathname
                .split('/')
                .pop();
          }
          invoices.totalRecords = totalRecords;
          invoices.data = result;
          return callback(null, invoices);
        }
      });
    }
  });
};
const sendInvoiceEmail = (req, callback) => {
  const con = req.app.locals.connection;
  let invoice_id = mysql.escape(req.body.invoice_id);
  let isReminder = req.body.is_reminder;
  let subject = null;
  let html = null;
  con.query(
    `SELECT cust_invoice.*,customer.*,files.url as invoice_url FROM cust_invoice
    LEFT JOIN files ON files.id = cust_invoice.invoice_file_id
    LEFT JOIN customer ON customer.id = cust_invoice.cust_id
    WHERE cust_invoice.id=${invoice_id}`,
    (err, result, fields) => {
      if (err || result == null) {
        return callback(err, null);
      } else if (result.length == 0) {
        return callback('Output is null', null);
      } else {
        subject = `Invoice generated for  - ${result[0].adm_invoice_att}`;

        //set email template
        let emailTemplate = 'invoice_send';

        if (isReminder) {
          emailTemplate = 'invoice_reminder';
          subject = `Ryse Solutions' Universal Portal Invoice Reminder for ${result[0].adm_invoice_att}`;
        }

        const invoiceReminderMailOptions = {
          from: req.app.locals.senderEmail,
          to: result[0].p_email,
          subject: subject,
          template: emailTemplate,
          context: {
            company_name: result[0].company_name,
            invoice_attributes: result[0].adm_invoice_att,
            invoice_status: result[0].adm_invoice_status,
            invoice_due_date: result[0].adm_due_date,
            invoice_period_start: result[0].adm_period_start,
            invoice_period_end: result[0].adm_period_end,
            invoice_due_amount: result[0].adm_due_amount,
            invoice_billing_date: result[0].adm_billing_date,
            invoice_url: result[0].invoice_url,
          },
        };

        mail.sendMail(invoiceReminderMailOptions, function (err, result) {
          if (err) {
            return callback(err, null);
          } else {
            return callback(null, result);
          }
        });
      }
    },
  );
};
const invoiceEntryFetchContract = (req, callback) => {
  const con = req.app.locals.connection;
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const offset = (page - 1) * limit;
  //  query = `SELECT cust_contract.*,attachments.cust_quote_url,attachments.admin_quote_url,attachments.contract_url,attachments.invoice_url FROM cust_contract
  //  LEFT JOIN attachments ON attachments.contract_id = cust_contract.id
  //  LEFT JOIN cust_invoice ON cust_invoice.contract_id = cust_contract.id
  //  LEFT JOIN customer ON customer.id = cust_contract.cust_id
  //  CASE(WHEN customer.user_type ='Pay-as-you-go' THEN cust_contract.id WHEN customer.user_type !='Pay-as-you-go' AND (SELECT count(*) FROM  cust_invoice WHERE MONTH(adm_billing_date)=MONTH(NOW()) and YEAR(adm_billing_date) = YEAR(NOW())) < cust_contract.adm_number_of_invoices THEN cust_contract.id ELSE NULL)
  //  WHERE cust_contract.adm_contract_status ='approved' AND customer.user_type ='Pay-as-you-go' ORDER BY cust_contract.id DESC limit ${limit} OFFSET ${offset}`;
  query = `SELECT cust_invoice.*,customer.company_name,files.url as invoice_url,files.password as invoice_password FROM cust_invoice
    LEFT JOIN files ON files.id = cust_invoice.invoice_file_id
    LEFT JOIN customer ON customer.id = cust_invoice.cust_id
    ORDER BY cust_invoice.id DESC limit ${limit} OFFSET ${offset}`;
  con.query(query, (err, result, fields) => {
    if (err || result == null) {
      return callback(err, null);
    } else {
      return callback(null, result);
    }
  });
};
const downloadInvoicesCsv = (req, callback) => {
  const con = req.app.locals.connection;
  let cust_id = req.body.cust_id;
  let adm_invoice_status = req.body.adm_invoice_status;
  let adm_due_date = req.body.adm_due_date;
  let adm_due_amount = req.body.adm_due_amount;
  query = `SELECT cust_invoice.id as Contract,customer.company_name as Customer,cust_invoice.date as Issue_Date,cust_invoice.adm_invoice_status as Status,CONCAT('$', FORMAT(cust_invoice.adm_due_amount/100, 2)) as Amount,
    cust_invoice.adm_due_date as Due_Date,CONCAT_WS(' - ',cust_invoice.adm_period_start, cust_invoice.adm_period_end ) as Period,files.url as Issued_Invoice,files.name as invoice_filename FROM cust_invoice
    LEFT JOIN files ON files.id = cust_invoice.invoice_file_id
    LEFT JOIN customer ON customer.id = cust_invoice.cust_id
    WHERE adm_invoice_status !='invalid' `;
  if (typeof cust_id != 'undefined') {
    query += " AND cust_invoice.cust_id = '" + cust_id + "' ";
  }
  if (typeof adm_invoice_status != 'undefined') {
    query +=
      " AND cust_invoice.adm_invoice_status = '" + adm_invoice_status + "' ";
  }
  if (typeof adm_due_date != 'undefined') {
    query += " AND cust_invoice.adm_due_date = '" + adm_due_date + "' ";
  }
  if (typeof adm_due_amount != 'undefined') {
    query += ' AND cust_invoice.adm_due_amount = ' + adm_due_amount + ' ';
  }
  con.query(query, (err, result, fields) => {
    if (err || result == null) {
      return callback(err, null);
    } else if (result.length == 0) {
      return callback('Output is null', null);
    } else {
      return callback(null, result);
    }
  });
};

module.exports = {
  createNewInvoice,
  deleteSingleInvoice,
  updateNewInvoice,
  fetchSingleInvoice,
  fetchAllInvoice,
  sendInvoiceEmail,
  invoiceEntryFetchContract,
  downloadInvoicesCsv,
};
