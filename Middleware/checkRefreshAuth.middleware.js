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
      let username = mysql.escape(decoded.username);
      let password = decoded.password;
      let cur_date = new Date();
      let last_login = cur_date.toISOString().slice(0, 18);
      query = `select cu.id, cu.cust_id, cu.first_name, cu.last_name, cu.email, cu.password, cu.phone, cu.street, cu.city, cu.province, cu.country, cu.user_type, cu.account_status, customer.materials from cust_user as cu
  left join customer on customer.id = cu.cust_id
   where cu.email= ${username} and cu.password= '${password}'`;

      con.query(query, (err, result, fields) => {
        if (err || result.length == 0) {
          res.status(500).send({ error: 'Authentication failed' });
        } else if (result[0].account_status == 0) {
          res.status(500).send({ error: 'Account not approved' });
        } else {
          con.query('UPDATE cust_user SET last_login=? WHERE id=?', [
            last_login,
            result[0].id,
          ]);
          req.result = result;
          next();
        }
      });
    }
  });
};
