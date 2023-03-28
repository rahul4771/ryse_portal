const jwt = require('jsonwebtoken');
const UserAuth = require('../Models/auth');
const mysql = require('mysql');

module.exports = function (req, res, next) {
  var con = req.app.locals.connection;
  let authHeader = req.headers.authorization;
  if (authHeader == undefined) {
    res.status(401).send({ error: 'No token provided' });
  }
  let token = authHeader.split(' ')[1];
  jwt.verify(token, 'secret', function (err, decoded) {
    if (err) {
      res.status(500).send({ error: 'Authentication failed' });
    } else {
      let query =
        "select account_status from cust_user where id= '" + decoded.id + "' ";
      con.query(query, (err, result, fields) => {
        if (result[0].account_status == 3) {
          res.status(500).send({ error: 'Invalid User' });
        } else {
          let user_type = decoded.user_type;
          UserAuth.UserType(req, user_type, function (err, result) {
            if (err || result == null || result == '') {
              res.status(500).send({ error: 'Permission Failed' });
            } else {
              if (result[0].permissions == 1) {
                next();
              } else {
                res.status(500).send({ error: 'Permission Denied' });
              }
            }
          });
        }
      });
    }
  });
};
