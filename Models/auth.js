const mysql2Client = require('../Database/client');
// TODO implement
// const queries = require('../Database/queries');

const UserType = async (req, user_type, callback) => {
  const con = req.app.locals.connection;
  base_url = req.baseUrl.substring(1);
  orginal_url = req.originalUrl.substring(1, req.originalUrl.length - 1);

  if (
    base_url == 'customers' &&
    base_url == orginal_url &&
    req.method == 'GET'
  ) {
    base_url = 'customer/all';
  }
  if (base_url == null || base_url == '') {
    base_url = req.originalUrl.substring(1);
    if (base_url.includes('?')) {
      base_url = base_url.substr(0, base_url.indexOf('?'));
    }
  }
  method = req.method;
  let query = `select permissions from user_permissions where user_type='${user_type}' and api_call= '${base_url}' and method= '${method}'`;

  let permissions = await mysql2Client.dbQuery(query);
  if (permissions == null) {
    return callback({ error: 'Permission Denied' }, null);
  } else {
    return callback(null, permissions);
  }
};

module.exports = {
  UserType,
};
