const jwt = require('jsonwebtoken');
const mysql = require('mysql');

const mail = require('../Controllers/Helpers/sendGridMailer');
const md5 = require('md5');
// TODO implement
// const queries = require('../Database/queries');
const mysql2Client = require('../Database/client');
const { select, insert, update, remove } = require('../Database/queries');
const { recordLog, formattedTimestamp } = require('../lib/db-utils');
const util = require('util');
const ER_DUP_ENTRY = 1062;
// TODO DRY up
const ROLES = {
  admin: 'admin',
  company: 'user',
  customer: 'company',
};

const ACCESS_STATUS = {
  pending: 0,
  active: 1,
  deactivated: 3,
};

const loginUser = async (req, callback) => {
  // TODO don't pass around the connection like this !
  const con = req.app.locals.connection;
  let cur_date = new Date();
  let username = req.body.email;
  let password_get = req.body.password;
  let last_login = cur_date.toISOString().slice(0, 18);
  let password = md5(password_get);

  let query =
    'select cu.id, cu.cust_id, cu.first_name, cu.last_name, cu.email, cu.phone, cu.street, cu.city, cu.province, cu.country, cu.user_type, cu.account_status, customer.materials,customer.account_sub_type,customer.hwin_number,customer.hwin_number2,customer.activity_type_hauler, customer.hauler_category_a_notes,customer.hauler_category_b_notes,customer.activity_type_processor,customer.processor_category_a_notes, customer.processor_category_b_notes,customer.eca_number from cust_user as cu left join customer on customer.id = cu.cust_id where cu.email= ? and cu.password= ?';

  let params = [username, password];
  let user = await mysql2Client.dbGetSingleRow(query, params);

  if (!user) {
    return callback('Invalid Login Credentials', null);
  } else if (user.account_status === ACCESS_STATUS['pending']) {
    return callback('Account not approved', null);
  } else {
    await mysql2Client.dbQuery('UPDATE cust_user SET last_login=? WHERE id=?', [
      last_login,
      user.id,
    ]);
  }

  return callback(null, user);
};

const createNewOrganization = async (req, callback) => {
  const con = req.app.locals.connection;
  const bucket = req.app.locals.bucket;
  let company_name = req.body.company_name;
  let business_name = req.body.business_name;
  let street = req.body.street;
  let city = req.body.city;
  let postal_code = req.body.postal_code;
  let province = req.body.province;
  let country = req.body.country;
  let p_first_name = req.body.primary_first_name;
  let p_last_name = req.body.primary_last_name;
  let country_code = req.body.country_code || null;
  let office_phone = req.body.office_phone;
  let office_phone_extension = req.body.office_phone_extension;
  let mobile_phone = req.body.mobile_phone;
  let p_email = req.body.primary_email;
  let p_street = req.body.primary_street;
  let p_city = req.body.primary_city;
  let p_postal_code = req.body.primary_postal_code;
  let p_province = req.body.primary_province;
  let p_country = req.body.primary_country;
  let b_first_name = req.body.billing_first_name || null;
  let b_last_name = req.body.billing_last_name || null;
  let billing_phone_extension = req.body.billing_phone_extension || null;
  let b_phone = req.body.billing_phone || null;
  let b_email = req.body.billing_email || null;
  let b_street = req.body.billing_street || null;
  let b_city = req.body.billing_city || null;
  let b_postal_code = req.body.billing_postal_code || null;
  let b_province = req.body.billing_province || null;
  let b_county = req.body.billing_county || null;
  let website = req.body.website;
  let rpra_id = req.body.rpra_id;
  let account_type = req.body.account_type;
  let hst_number = req.body.hst_number;
  let materials = JSON.stringify(req.body.materials);
  let account_sub_type = JSON.stringify(req.body.account_sub_type);
  let rpra_confirmation_email = req.body.rpra_confirmation_email || null;
  let rpra_confirmation_file = null;

  try {
    const customer = await mysql2Client.dbQuery(
      `INSERT INTO customer (company_name, business_name, street, city, postal_code, province, country, p_first_name, p_last_name, country_code, office_phone, office_phone_extension, mobile_phone, p_email, p_street, p_city, p_postal_code, p_province, p_country, b_first_name, b_last_name, b_phone, b_email, b_street, b_city, b_postal_code, b_province, b_county, website, rpra_id, account_type,account_sub_type, hst_number, materials, permission_id, rpra_confirmation_email, rpra_confirmation_file) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
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
        '0',
        rpra_confirmation_email,
        rpra_confirmation_file,
      ],
    );
    return callback(null, customer);
  } catch (error) {
    switch (error.errno) {
      case ER_DUP_ENTRY:
        if (error.sqlMessage.includes('email_UNIQUE')) {
          callback(
            'Error: 1006 - An error has occurred. Contact your Ryse representative at info@ryseinc.ca',
            null,
          );
        }

        if (error.sqlMessage.includes('company-name_UNIQUE')) {
          callback(
            'Error: 1004 - An error has occurred. Contact your Ryse representative at info@ryseinc.ca',
            null,
          );
        }
        break;

      default:
        callback(error, null);
        break;
    }
  }
};

const createNewCustomer = async (req, cust_id, callback) => {
  //console.log('req', req.body);
  const con = req.app.locals.connection;
  let email = req.body.primary_email;
  let first_name = req.body.primary_first_name;
  let last_name = req.body.primary_last_name;
  let phone = req.body.office_phone;
  let company = req.body.company_name;
  let street = req.body.primary_street;
  let city = req.body.primary_city;
  let province = req.body.primary_province;
  let country = req.body.primary_country;
  let password_get = req.body.password;
  let password = md5(password_get);
  let type = 'company';

  const user = await mysql2Client.dbQuery(
    'INSERT INTO cust_user (cust_id, email, first_name, last_name, phone, street, city, province, country, password, user_type, account_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    [
      cust_id,
      email,
      first_name,
      last_name,
      phone,
      street,
      city,
      province,
      country,
      password,
      type,
      '0',
    ],
  ); // TODO error check here?

  const registrationConfirmationMailOptions = {
    from: req.app.locals.senderEmail, // sender address
    to: email, // list of receivers
    subject: `Ryse Solutions Universal Portal - Registration Confirmation`,
    template: 'customer_registration', // the name of the template file within the notifications folder i.e account_approval.handlebars
    context: {
      first_name: first_name,
    },
  };

  mail.sendMail(registrationConfirmationMailOptions, function (err, user) {
    if (err) {
      recordLog(
        'Successfully created customer but failed to send notification:',
        err,
      );
    }
  });

  const newUserRegistrationEmailOptions = {
    from: req.app.locals.senderEmail, // sender address
    to: req.app.locals.contactEmail, // list of receivers
    subject: `Ryse Solutions Universal Portal - New User Registration`,
    template: 'new_organization_registration', // the name of the template file within the notifications folder i.e account_approval.handlebars
    context: {
      email: email, // replace {{email}}
      company: company,
    },
  };

  mail.sendMail(newUserRegistrationEmailOptions, function (err, result) {
    if (err) {
      recordLog(
        'Successfully approved customer but failed to send admin notification:',
        err,
      );
    }
  });

  return callback(null, user);
};

const createNewUser = async (req, callback) => {
  console.info('Attempting to create new user...');
  const con = req.app.locals.connection;
  let cust_id = req.body.cust_id;
  let email = req.body.email;
  let first_name = req.body.first_name;
  let last_name = req.body.last_name;
  let password_get = req.body.password;
  let password = md5(password_get);
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user = null;

  let user_type,
    customer_id,
    type = null;

  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    customer_id = decoded.cust_id;
    if (user_type == 'admin' && customer_id == cust_id) {
      type = 'admin';
    } else {
      type = 'user';
    }
  });

  let domain_name = null;
  if (process.env.ENV == 'production') {
    domain_name = process.env.PROD_URL;
  } else {
    domain_name = process.env.DEV_URL;
  }

  if (user_type == 'company' && customer_id != cust_id) {
    return callback({ err: 'Invalid operation to user data' }, null);
  }

  const currentUser = await mysql2Client.dbQuery(
    `SELECT p_email FROM customer WHERE id= ?`,
    [cust_id],
  );

  let customer_email = currentUser[0].p_email;
  let customer_email_domain = customer_email.substring(
    customer_email.lastIndexOf('@') + 1,
  );
  let user_email_domain = email.substring(email.lastIndexOf('@') + 1);

  if (customer_email_domain != user_email_domain) {
    return callback(
      {
        error: 'cannot create users with different email domains',
      },
      null,
    );
  } else {
    user = await mysql2Client.dbQuery(
      'INSERT INTO cust_user (cust_id, email, first_name, last_name, password, user_type, account_status) VALUES (?,?,?,?,?,?,?)',
      [cust_id, email, first_name, last_name, password, type, '1'],
    );

    recordLog('Created the user: ' + user.insertId, req);

    let toMail = user[0].p_email;
    let subject = 'Ryse Portal - User created -' + first_name + ' ' + last_name;

    //TODO - convert to email template and nodemailer
    const userCreatedByCompanyMailOptions = {
      from: req.app.locals.senderEmail, // sender address
      to: customer[0].p_email, // list of receivers
      subject: `Ryse Portal - User created - ${first_name} ${last_name}`,
      template: 'user_created_by_company', // the name of the template file within the notifications folder i.e account_approval.handlebars
      context: {
        first_name: first_name, // replace {{first_name}}
        last_name: last_name,
        email: email,
        userId: user.insertId,
      },
    };

    mail.sendEmail(mailOptions, function (err, user) {
      if (err) return callback(err, null);
    });

    const accountApprovedMailOptions = {
      from: req.app.locals.senderEmail, // sender address
      to: email, // list of receivers
      subject: `Ryse Solutions Universal Portal - Account Approved`,
      template: 'account_approval', // the name of the template file within the notifications folder i.e account_approval.handlebars
      context: {
        first_name: first_name, // replace {{first_name}}
      },
    };

    mail.sendEmail(accountApprovedMailOptions, function (err, user) {
      if (err) {
        return callback(err, null);
      }
    });

    // see https://github.com/p80w/ryse-portal-app/pull/123/files
    const newUserRegistermailOptions = {
      from: req.app.locals.senderEmail, // sender address
      to: req.app.locals.contactEmail, // list of receivers
      subject: `A new user has registered to the Ryse Solutions Universal Portal`,
      template: 'new_user_registration', // the name of the template file within the notifications folder i.e account_approval.handlebars
      context: {
        first_name: newUserRegistermailOptions.subject, // replace {{first_name}}
        email: email, // replace {{email}}
      },
    };

    mail.sendEmail(newUserRegistermailOptions, function (err, user) {
      if (err) {
        return callback(err, null);
      }
    });
  }

  return callback(null, user);
};

const updateNewUser = async (req, callback) => {
  const con = req.app.locals.connection;
  let user_id = req.params.id;
  let email = req.body.email;
  let first_name = req.body.first_name;
  let last_name = req.body.last_name;
  let phone_number = req.body.phone;
  let street = req.body.street;
  let city = req.body.city;
  let province = req.body.province;
  let country = req.body.country;
  let user_type_req = req.body.account_type;
  let account_status = req.body.account_status;
  let password_get = req.body.password;
  let password = md5(password_get);

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

  if (user_type == 'user' && token_user_id != user_id) {
    return callback({ err: 'Invalid operation to user details' }, null);
  }

  let user = await mysql2Client.dbQuery(
    'SELECT cust_id FROM cust_user WHERE id=?',
    [user_id],
  );

  if (user_type == 'company' && customer_id != user[0].cust_id) {
    return callback(
      { err: 'Invalid operation to user data-customer id' },
      null,
    );
  }

  user = await mysql2Client.dbQuery(
    'UPDATE cust_user SET email=?,first_name=?,last_name=?,phone=?,street=?,city=?,province=?,country=?,password=?,user_type=?, account_status=? WHERE id=?',
    [
      email,
      first_name,
      last_name,
      phone_number,
      street,
      city,
      province,
      country,
      password,
      user_type_req,
      account_status,
      user_id,
    ],
  );

  recordLog('Updated the user:' + user_id, req);
  return callback(null, user);
};

const quoteExpireNotifyUser = async (req, callback) => {
  const con = req.app.locals.connection;

  let quotes = await mysql2Client.dbQuery(
    `SELECT cust_quote_request.id,cust_quote_request.cust_id,cust_quote_request.adm_quote,cust_quote_request.adm_expiry_date,cust_quote_request.adm_quote_status,customer.p_email,customer.company_name,files.url as admin_quote_url FROM cust_quote_request
	LEFT JOIN customer ON customer.id = cust_quote_request.cust_id
  LEFT JOIN files ON files.id = cust_quote_request.quote_file_id
	WHERE adm_expiry_date between DATE_SUB(NOW(),INTERVAL 5 DAY) and DATE_ADD(NOW(),INTERVAL 5 DAY) and adm_quote_status ='pending' `,
    null,
  );

  let mail_result = null;
  quotes.forEach((element) => {
    let quoteExpiredMailOptions = {
      from: req.app.locals.senderEmail,
      to: element.p_email,
      subject: subject,
      template: 'quote_expired',
      context: {
        quoteId: element.id,
        adm_quote: element.adm_quote,
        adm_expiry_date: element.adm_expiry_date,
        company_name: element.company_name,
        customerId: element.cust_id,
        invoice_status: result[0].adm_invoice_status,
        invoice_duedate: result[0].adm_due_date,
        invoice_period_start: result[0].adm_period_start,
        invoice_period_end: result[0].adm_period_end,
        invoice_due_amount: result[0].adm_due_amount,
        invoice_billing_date: result[0].adm_billing_date,
        invoice_url: result[0].invoice_url,
        admin_quote_url: element.admin_quote_url,
      },
    };
    mail.sendEmail(quoteExpiredMailOptions, function (err, result) {
      if (err) {
        return callback(err, null);
      } else {
        mail_result += result;
        mysql2Client.dbQuery(
          `UPDATE cust_quote_request SET adm_quote_status='pending-notified' WHERE id=${element.id}`,
          null,
        );
      }
    });
  });

  return callback(null, mail_result);
};

const resetPassword = async (req, callback) => {
  const con = req.app.locals.connection;
  let user_id = req.body.user_id;
  let password_get = req.body.password;
  let password = md5(password_get);

  let data = await mysql2Client.dbQuery(
    `UPDATE cust_user SET password=? WHERE id=?`,
    [password, user_id],
  );

  return callback(null, data);
};

const fetchAllUsers = async (req, res, callback) => {
  const con = req.app.locals.connection;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type = null;
  let cust_id = null;

  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
  });
  const limit = req.query.limit ? parseInt(req.query.limit) : 12;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const offset = (page - 1) * limit;

  let users = {};

  let usersQuery,
    params,
    countQuery = null;
  // TODO verify that middleware can handle the permission check
  if (user_type == 'admin') {
    usersQuery = select.users.adminFetchAll;
    params = [limit, offset];
  } else if (user_type == 'company') {
    usersQuery = select.users.userFetchAll;
    params = [cust_id, limit, offset];
  } else {
    return callback({ err: 'Permission failed' }, null);
  }

  let userData = await mysql2Client.dbQuery(usersQuery, params);

  if (user_type == 'admin') {
    countQuery = `Select count(id) from cust_user where account_status != '3' and user_type ='company'`;
    params = null;
  } else if (user_type == 'company') {
    countQuery = `Select count(id) from cust_user  where cust_id =${cust_id} and account_status != '3' and user_type ='company'`;
    params = [cust_id];
  }

  let totalRecords = await mysql2Client.dbGetSingleRow(countQuery, params);

  // TODO figure out how to get the count directly from query
  console.log(totalRecords['count(id)']);
  users.totalRecords = totalRecords['count(id)'];
  users.data = userData;

  return callback(null, users);
};

const fetchUserByEmail = async (req, callback) => {
  const con = req.app.locals.connection;
  let email_id = req.body.email;

  const user = await mysql2Client.dbQuery(
    `SELECT * FROM cust_user WHERE email= ? AND account_status != '3' `,
    [email_id],
  );

  return callback(null, user);
};

const fetchSingleUser = async (req, callback) => {
  const con = req.app.locals.connection;
  let user_id = req.params.id;

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

  // TODO this may be redundant? or could be factored out
  if (user_type == 'user' && token_user_id != user_id) {
    return callback({ err: 'Invalid operation to user details' }, null);
  }

  let user = await mysql2Client.dbQuery('SELECT * FROM cust_user WHERE id=?', [
    user_id,
  ]);

  // TODO this may be redundant?  or could be factored out
  if (user_type == 'company' && customer_id != user[0].cust_id) {
    return callback(
      { err: 'Invalid operation to user data-customer id' },
      null,
    );
  }

  for (let property in user[0]) {
    if (user[0][property] == null) {
      user[0][property] = '';
    }
  }
  return callback(null, user);
};

const fetchRequiredAccountInformation = async (req, callback) => {
  const con = req.app.locals.connection;
  let quote_id = req.body.quote_id;

  const quoteRequest = await mysql2Client.dbQuery(
    'SELECT * FROM cust_quote_request WHERE id= ?',
    [quote_id],
  );

  const customer = await mysql2Client.dbQuery(
    `SELECT rpra_id,account_type FROM customer WHERE id=${quoteRequest[0].cust_id}`,
  );

  return callback(null, customer);
};

// TODO where is this used?
const fetchUserIncompleteDetails = async (req, callback) => {
  const con = req.app.locals.connection;
  let user_id = req.body.user_id;

  // TODO this could perhaps be cleaned up further?
  let user = await mysql2Client.dbQuery(`SELECT * FROM cust_user WHERE id= ?`, [
    user_id,
  ]);

  let customer = await mysql2Client.dbQuery(
    `SELECT * FROM customer WHERE id= ?`,
    [user[0].cust_id],
  );

  // TODO what is happening here?
  for (let property in user[0]) {
    if (user[0][property] != null && user[0][property] != '') {
      delete user[0][property];
    } else {
      user[0][property] = '';
    }
  }

  for (let property in customer[0]) {
    if (customer[0][property] != null && customer[0][property] != '') {
      delete customer[0][property];
    } else {
      customer[0][property] = '';
    }
  }

  return callback(null, user, customer);
};

const deleteSingleUser = async (req, callback) => {
  const con = req.app.locals.connection;
  let user_id = req.params.id;
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

  let data = await mysql2Client.dbQuery(
    "UPDATE cust_user SET account_status='3' WHERE id=?",
    [user_id],
  );

  return callback(null, data);
};

module.exports = {
  createNewOrganization,
  createNewCustomer,
  loginUser,
  createNewUser,
  updateNewUser,
  quoteExpireNotifyUser,
  resetPassword,
  fetchAllUsers,
  fetchUserByEmail,
  fetchSingleUser,
  fetchRequiredAccountInformation,
  fetchUserIncompleteDetails,
  deleteSingleUser,
};
