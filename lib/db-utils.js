const mysql2Client = require('../Database/client');
const jwt = require('jsonwebtoken');

// TODO this method shouldn't require a callback or perform jwt verification !
const recordLog = (operation, req, callback) => {
  const con = req.app.locals.connection;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type = null;
  let cust_id = null;
  let user_id = null;
  jwt.verify(token, 'secret', function (err, decoded) {
    cust_id = decoded.cust_id;
    user_id = decoded.id;
    user_type = decoded.user_type;
  });

  console.info('Record logged: ${operation}');

  mysql2Client.dbQuery(
    'INSERT INTO logs (cust_id, user_id, user_type, operation) VALUES (?,?,?,?)',
    [cust_id, user_id, user_type, operation],
  );
};

const recordLogScheduledJob = (message) => {
  mysql2Client.dbQuery('INSERT INTO logs (user_type, operation) VALUES (?,?)', [
    'cron',
    message,
  ]);
};

const formattedTimestamp = () => {
  const d = new Date();
  const date = d.toISOString().split('T')[0];
  const time = d.toTimeString().split(' ')[0];
  return `${date} ${time}`;
};

module.exports = {
  recordLog,
  formattedTimestamp,
};
