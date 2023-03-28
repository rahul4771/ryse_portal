const jwt = require('jsonwebtoken');
const User = require('../Models/user');
const request = require('request');
const mail = require('../Controllers/Helpers/sendGridMailer');
const md5 = require('md5');
const util = require('util');

const ROLES = {
  admin: 'admin',
  company: 'user',
  company: 'company',
};

const ACCESS_STATUS = {
  pending: 0,
  active: 1,
  deactivated: 3,
};

//TODO - refactor this to use event emitters and possibly
// Look at changing DB architecure so that there is only one table required.
const createOrganization = async (req, res, next) => {
  await User.createNewOrganization(req, async function (err, result) {
    if (err) {
      res.status(500).send(err);
    } else {
      await User.createNewCustomer(
        req,
        result.insertId,
        function (error, result_user) {
          if (error) {
            res.status(500).send(error);
          } else {
            res.status(200).send({ company: result, user: result_user });
          }
        },
      );
    }
  });
};

const createUser = async (req, res, next) => {
  await User.createNewUser(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else if (result.length == 0) {
      res.status(500).send({ error: 'Registration failed' });
    } else {
      res
        .status(200)
        .send({ result: 'User created successfully', output: result });
    }
  });
};
const updateUser = async (req, res, next) => {
  await User.updateNewUser(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else {
      res
        .status(200)
        .send({ result: 'User updated successfully', output: result });
    }
  });
};

const userLogin = async (req, res, next) => {
  if (req.body.email == undefined && req.body.password == undefined) {
    res.status(400).send({ error: 'Authentication failed' });
    return false;
  }

  if (req.body.remember_me !== undefined && req.body.remember_me) {
    let resp_rem = {
      username: req.body.email,
      password: md5(req.body.password),
    };
    refresh_token = jwt.sign(resp_rem, 'secret', { expiresIn: 604800000 });
  } else {
    refresh_token = null;
  }

  await User.loginUser(req, function (err, user) {
    if (err) {
      res.status(400).send({ error: err });
    } else if (user.account_status == ACCESS_STATUS['deactivated']) {
      res.status(400).send({ error: 'Invalid User' });
    } else {
      console.info(`Setting up login for ${util.inspect(user)}`);
      let user_id = user.id;
      let type = user.user_type;
      let name = user.first_name;
      let last_name = user.last_name;
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
        user_type: type,
        account_status: user.account_status,
        isImpersonating: false,
      };

      let token = jwt.sign(resp, 'secret', { expiresIn: 84000 });
      res.status(200).send({
        auth: true,
        authorization_token: token,
        refresh_token: refresh_token,
        user_id: user_id,
        user_type: type,
        first_name: name,
        last_name: last_name,
        email: email,
        phone: phone,
        street: street,
        city: city,
        province: province,
        country: country,
        organization_id: cust_id,
        materials: materials,
        account_sub_type: account_sub_type,
      });
    }
  });
};
const userLogout = async (req, res, next) => {
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let id,
    first_name,
    cust_id,
    user_type,
    account_status = null;

  jwt.verify(token, 'secret', function (err, decoded) {
    if (err) {
      res.status(500).send({ error: 'Authentication failed' });
    } else {
      id = decoded.id;
      first_name = decoded.name;
      cust_id = decoded.cust_id;
      user_type = decoded.user_type;
      account_status = decoded.account_status;
    }
  });
  let resp = {
    id: id,
    name: first_name,
    cust_id: cust_id,
    user_type: user_type,
    account_status: account_status,
  };
  let logout_token = jwt.sign(resp, 'secret', { expiresIn: 2 });
  res.status(200).send({
    auth: true,
    logout_token: logout_token,
    user_id: id,
    user_type: user_type,
    first_name: first_name,
    customer_id: cust_id,
  });
};

const quoteExpireNotify = async (req, res, next) => {
  await User.quoteExpireNotifyUser(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(200).send(result);
    }
  });
};

const userResetPasswordLink = async (req, res, next) => {
  await User.fetchUserByEmail(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else if (result.length == 0) {
      res.status(500).send({ error: 'No user found' });
    } else {
      let resp = {
        id: result[0].id,
        name: result[0].first_name,
        cust_id: result[0].cust_id,
        user_type: result[0].user_type,
        password: result[0].password,
      };
      let token = jwt.sign(resp, 'secret', { expiresIn: 84000 });
      if (process.env.ENV == 'production') {
        domain_name = process.env.PROD_URL;
      } else {
        domain_name = process.env.DEV_URL;
      }
      let resetLink = `${domain_name}/password-reset?token=` + token;

      const resetPasswordMailOptions = {
        from: req.app.locals.senderEmail, // sender address
        to: req.body.email, // list of receivers
        subject: 'Ryse Solutions Universal Portal - Reset Password Link',
        template: 'reset_password', // the name of the template file i.e email.handlebars
        context: {
          first_name: resp.name, // replace {{first_name}}
          reset_password_link: resetLink,
        },
      };

      mail.sendMail(resetPasswordMailOptions, function (err, result) {
        if (err) {
          res.status(400).send(err);
        } else {
          res.status(200).send(result);
        }
      });
    }
  });
};

const userResetLinkVerify = async (req, res, next) => {
  let token = req.body.token;
  if (token == undefined) {
    res.status(401).send({ error: 'No token provided' });
  }
  jwt.verify(token, 'secret', function (err, decoded) {
    if (err) {
      res.status(400).send({ error: 'Authentication failed' });
    } else {
      let user_id = decoded.id;
      let name = decoded.name;
      let cust_id = decoded.cust_id;
      let user_type = decoded.user_type;
      let password = decoded.password;
      res.status(200).send({
        auth: true,
        user_id: user_id,
        user_type: user_type,
        first_name: name,
        password: password,
        customer_id: cust_id,
      });
    }
  });
};
const userResetPassword = async (req, res, next) => {
  await User.resetPassword(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else if (result.length == 0) {
      res.status(500).send({ error: 'Reset passwword failed' });
    } else {
      res
        .status(200)
        .send({ result: 'Reset passwword successfully', output: result });
    }
  });
};
const createQuote = async (req, res, next) => {
  const con = req.app.locals.connection;
  let cur_date = new Date();
  let cust_id = req.body.cust_id;
  let date = req.body.date + ' ' + cur_date.toISOString().slice(11, 18);
  let adm_quote = req.body.adm_quote;
  let adm_quote_status = req.body.adm_quote_status;
  let adm_expiry_date =
    req.body.adm_expiry_date + ' ' + cur_date.toISOString().slice(11, 18);
  let cust_user_id = req.body.cust_user_id;
  let description = req.body.description;

  con.query(
    'INSERT INTO cust_quote_request (cust_id, date, adm_quote, adm_quote_status, adm_expiry_date, cust_user_id, description) VALUES (?,?,?,?,?,?,?)',
    [
      cust_id,
      date,
      adm_quote,
      adm_quote_status,
      adm_expiry_date,
      cust_user_id,
      description,
    ],
    (err, result, fields) => {
      if (err) throw err;
      res
        .status(200)
        .send({ result: 'Quote created successfully', output: result });
    },
  );
};

const getAllUsers = async (req, res, next) => {
  await User.fetchAllUsers(req, res, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else if (result.length == 0) {
      res.status(500).send({ error: 'Query failed - No records found' });
    } else {
      res.status(200).send(result);
    }
  });
};

const getUser = async (req, res, next) => {
  await User.fetchSingleUser(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else if (result.length == 0) {
      res.status(500).send({ error: 'Query failed - No records found' });
    } else {
      res.status(200).send(result);
    }
  });
};

const userIncompleteDetails = async (req, res, next) => {
  await User.fetchUserIncompleteDetails(
    req,
    function (err, user_incomplete, cust_incomplete) {
      if (err) {
        res.status(400).send(err);
      } else {
        res.status(200).send({
          result: 'Incomplete Details of User',
          User_incomplete: user_incomplete,
          Customer_incomplete: cust_incomplete,
        });
      }
    },
  );
};
const requiredAccountInformation = async (req, res, next) => {
  await User.fetchRequiredAccountInformation(
    req,
    function (err, cust_incomplete) {
      if (err) {
        res.status(400).send(err);
      } else {
        res.status(200).send({ Customer_Details: cust_incomplete });
      }
    },
  );
};
const deleteUser = async (req, res, next) => {
  await User.deleteSingleUser(req, function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else {
      res
        .status(200)
        .send({ result: 'User deleted successfully', output: result });
    }
  });
};

const openPDF = (req, res, next) => {
  pdf_url = "https://lagoapparel-development.nodejs.p80w.com/images/artworks/tesdet-6150242238623-2022-05-12-04:20:05.jpeg";
  render(pdf_url).pipe(
    res
      .set('Content-Type', 'application/pdf')
      .set('Content-Disposition', 'inline; filename="myFile.pdf"'),
  );
};

const validateRemember = (req, res, next) => {
  if (req.result[0].account_status == ACCESS_STATUS['deactivated']) {
    res.status(400).send({ error: 'Invalid User' });
  } else {
    let result = req.result;
    let user_id = result[0].id;
    let type = result[0].user_type;
    let name = result[0].first_name;
    let last_name = result[0].last_name;
    let email = result[0].email;
    let password = result[0].password;
    let phone = result[0].phone;
    let street = result[0].street;
    let city = result[0].city;
    let province = result[0].province;
    let country = result[0].country;
    let cust_id = result[0].cust_id;
    let materials = JSON.parse(result[0].materials);

    let resp_rem = {
      username: email,
      password: password,
    };
    refresh_token = jwt.sign(resp_rem, 'secret', { expiresIn: 604800000 });

    let resp = {
      id: result[0].id,
      name: result[0].first_name,
      cust_id: result[0].cust_id,
      user_type: type,
      account_status: result[0].account_status,
    };

    let token = jwt.sign(resp, 'secret', { expiresIn: 84000 });
    res.status(200).send({
      auth: true,
      authorization_token: token,
      refresh_token: refresh_token,
      user_id: user_id,
      user_type: type,
      first_name: name,
      last_name: last_name,
      email: email,
      phone: phone,
      street: street,
      city: city,
      province: province,
      country: country,
      organization_id: cust_id,
      materials: materials,
    });
  }
};

module.exports = {
  createOrganization,
  getAllUsers,
  userLogin,
  userLogout,
  quoteExpireNotify,
  userResetPasswordLink,
  userResetLinkVerify,
  userResetPassword,
  createUser,
  updateUser,
  getUser,
  requiredAccountInformation,
  userIncompleteDetails,
  deleteUser,
  createQuote,
  openPDF,
  validateRemember,
};
