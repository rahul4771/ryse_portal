const jwt = require('jsonwebtoken');
const mysql = require('mysql');

const createNewQuoteLine = (req, callback) => {
  const con = req.app.locals.connection;
  let cust_id = req.body.cust_id;
  let line_number = req.body.line_number;
  let material_id = req.body.material_id;
  let amount = req.body.amount;
  let uom_id = req.body.uom_id;
  let collection_from_location = req.body.collection_from_location;
  con.query(
    "INSERT INTO cust_quote_request_line (cust_id, line_number, material_id, amount, uom_id, collection_from_location) VALUES ('" +
      cust_id +
      "', '" +
      line_number +
      "',  '" +
      material_id +
      "', '" +
      amount +
      "', '" +
      uom_id +
      "',  '" +
      collection_from_location +
      "')",
    (err, result, fields) => {
      if (err || result == null) {
        return callback(err, null);
      } else {
        return callback(null, result);
      }
    },
  );
};

const updateNewQuoteLine = (req, callback) => {
  const con = req.app.locals.connection;
  let qline_id = req.body.qline_id;
  let cust_id = req.body.cust_id;
  let line_number = req.body.line_number;
  let material_id = req.body.material_id;
  let amount = req.body.amount;
  let uom_id = req.body.uom_id;
  let collection_from_location = req.body.collection_from_location;
  con.query(
    "UPDATE cust_quote_request_line SET cust_id='" +
      cust_id +
      "', line_number='" +
      line_number +
      "', material_id='" +
      material_id +
      "', amount='" +
      amount +
      "', uom_id='" +
      uom_id +
      "', collection_from_location='" +
      collection_from_location +
      "' WHERE id='" +
      qline_id +
      "'",
    (err, result, fields) => {
      if (err || result == null) {
        return callback(err, null);
      } else {
        return callback(null, result);
      }
    },
  );
};

const fetchAllQuoteLine = (req, callback) => {
  const con = req.app.locals.connection;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type = null;
  let cust_id = null;
  jwt.verify(token, 'secret', function (err, decoded) {
    // res.send(decoded);
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
  });
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const offset = (page - 1) * limit;
  if (user_type == 'admin') {
    query =
      'SELECT * FROM cust_quote_request_line limit ' +
      limit +
      ' OFFSET ' +
      offset;
  } else if (user_type == 'company' || user_type == 'user') {
    query =
      'SELECT * FROM cust_quote_request_line where cust_id =' +
      cust_id +
      ' limit ' +
      limit +
      ' OFFSET ' +
      offset;
  } else {
    return callback({ err: 'Permission failed' }, null);
  }
  con.query(query, (err, result, fields) => {
    if (err || result == null) {
      return callback(err, null);
    } else {
      return callback(null, result);
    }
  });
};

const fetchSingleQuoteLine = (req, callback) => {
  const con = req.app.locals.connection;
  let qline_id = req.params.id;
  con.query(
    "SELECT * FROM cust_quote_request_line WHERE id='" + qline_id + "' ",
    (err, result, fields) => {
      if (err || result == null) {
        return callback(err, null);
      } else {
        return callback(null, result);
      }
    },
  );
};

const deleteSingleQuoteLine = (req, callback) => {
  const con = req.app.locals.connection;
  let qline_id = req.params.id;
  con.query(
    "DELETE FROM cust_quote_request_line WHERE id='" + qline_id + "' ",
    (err, result, fields) => {
      if (err || result == null) {
        return callback(err, null);
      } else {
        return callback(null, result);
      }
    },
  );
};

module.exports = {
  createNewQuoteLine,
  updateNewQuoteLine,
  fetchAllQuoteLine,
  fetchSingleQuoteLine,
  deleteSingleQuoteLine,
};
