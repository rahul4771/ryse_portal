const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const csv = require('csv-parser');
require('dotenv').config();
const mysql2Client = require('../Database/client');
const { select, insert, update, remove } = require('../Database/queries');
const util = require('util');
const { recordLog, formattedTimestamp } = require('../lib/db-utils');

const createUom = async (req, callback) => {
  const obj = JSON.parse(JSON.stringify(req.body));
  const con = req.app.locals.connection;
  const bucket = req.app.locals.bucket;
  publicUrl = null;
  const newFileName = req.file.originalname;
  let file = bucket.file('admin_quotes/' + newFileName);
  let upload = await file.save(req.file.buffer, function (error) {
    return error
      ? {
          message: 'File failed to upload !',
          status: 500,
        }
      : true;
  });
  publicUrl = `${req.app.locals.bucketLocation}/${file.name}`;
  setTimeout(() => {
    file
      .createReadStream('admin_quotes/' + newFileName)
      .pipe(csv())
      .on('data', (row) => {
        con.query(
          `INSERT INTO uom (uom,material_id,description) VALUES ('${row.uom}', '${row.material_id}',  '${row.description}')`,
          (err, result, fields) => {
            if (err) {
              return callback(err, null);
            }
          },
        );
      })
      .on('end', () => {
        recordLog('Created UOM', req);
        return callback(null, 'Created UOM');
      });
  }, 12000);
};

const createUomConversion = async (req, callback) => {
  const obj = JSON.parse(JSON.stringify(req.body));
  const con = req.app.locals.connection;
  const bucket = req.app.locals.bucket;
  publicUrl = null;
  const newFileName = req.file.originalname;
  let file = bucket.file('admin_quotes/' + newFileName);
  let upload = await file.save(req.file.buffer, function (error) {
    return error
      ? {
          message: 'File failed to upload !',
          status: 500,
        }
      : true;
  });
  publicUrl = `${req.app.locals.bucketLocation}/${file.name}`;
  setTimeout(() => {
    file
      .createReadStream('admin_quotes/' + newFileName)
      .pipe(csv())
      .on('data', (row) => {
        con.query(
          `INSERT INTO uom_conv (from_uom_id,to_uom_id,rate,description) VALUES ('${row.from_uom_id}', '${row.to_uom_id}', '${row.rate}',  '${row.description}')`,
          (err, result, fields) => {
            if (err) {
              return callback(err, null);
            }
          },
        );
      })
      .on('end', () => {
        recordLog('Created UOM Conversion', req);
        return callback(null, 'Created UOM CONV');
      });
  }, 12000);
};

const createMaterial = async (req, callback) => {
  const obj = JSON.parse(JSON.stringify(req.body));
  const con = req.app.locals.connection;
  const bucket = req.app.locals.bucket;
  publicUrl = null;
  const newFileName = req.file.originalname;
  let file = bucket.file('admin_quotes/' + newFileName);

  let upload = await file.save(req.file.buffer, function (error) {
    return error
      ? {
          message: 'File failed to upload !',
          status: 500,
        }
      : true;
  });
  publicUrl = `${req.app.locals.bucketLocation}/${file.name}`;
  setTimeout(() => {
    file
      .createReadStream('admin_quotes/' + newFileName)
      .pipe(csv())
      .on('data', (row) => {
        con.query(
          `INSERT INTO material_master (category,sub_category_1,sub_category_2) VALUES ('${row.category}', '${row.sub_category_1}',  '${row.sub_category_2}')`,
          (err, result, fields) => {
            if (err) {
              return callback(err, null);
            }
          },
        );
      })
      .on('end', () => {
        recordLog('Created Materials', req);
        return callback(null, 'Created Materials');
      });
  }, 12000);
};

const fetchAllUom = (req, callback) => {
  const con = req.app.locals.connection;
  let category = req.body.category;
  let sub_category_1 = req.body.sub_category_1;
  let sub_category_2 = req.body.sub_category_2;
  query = `SELECT id FROM material_master WHERE category='${category}' AND sub_category_1='${sub_category_1}' AND sub_category_2='${sub_category_2}'`;
  con.query(query, (err, result, fields) => {
    if (err) {
      return callback(err, null);
    } else {
      con.query(
        `SELECT * FROM uom WHERE material_id=${result[0].id}`,
        (err, result_uom, fields) => {
          if (err) {
            return callback(err, null);
          } else {
            return callback(null, result_uom);
          }
        },
      );
    }
  });
};

const fetchAllUomConversion = (req, callback) => {
  const con = req.app.locals.connection;
  query = 'SELECT * FROM uom_conv';

  con.query(query, (err, result, fields) => {
    if (err || result == null) {
      return callback(err, null);
    } else {
      return callback(null, result);
    }
  });
};

const fetchAllMaterial = (req, callback) => {
  const con = req.app.locals.connection;
  if (req.body.category != null && req.body.category != '') {
    let category = mysql.escape(req.body.category);
    query = `SELECT category,sub_category_1,sub_category_2 FROM material_master WHERE category=${category}`;
  } else {
    query = `SELECT category,sub_category_1,sub_category_2 FROM material_master`;
  }
  con.query(query, (err, result, fields) => {
    if (err) {
      return callback(err, null);
    } else {
      var cart = [];
      var output = [];
      for (let prop in result) {
        cart.push(result[prop]['category']);
      }
      var cart = cart.filter(function (elem, index, self) {
        return index === self.indexOf(elem);
      });
      for (const val of cart) {
        output.push({ category: val });
        for (let prop in result) {
          if (result[prop]['category'] == val) {
            for (let props in output) {
              if (output[props]['category'] == val) {
                if (
                  result[prop]['sub_category_2'] != '' &&
                  result[prop]['sub_category_2'] != null
                ) {
                  var constructors = {
                    label: result[prop]['sub_category_1'],
                    sub_category_2: [result[prop]['sub_category_2']],
                  };
                } else {
                  var constructors = {
                    label: result[prop]['sub_category_1'],
                  };
                }
                if (typeof output[props].sub_category_1 == 'undefined') {
                  var arr_out = [constructors];
                } else {
                  var arr_out = output[props].sub_category_1;
                  var check = 0;
                  for (let property in arr_out) {
                    if (arr_out[property].label == constructors.label) {
                      if (
                        constructors.sub_category_2 != '' &&
                        constructors.sub_category_2 != null
                      ) {
                        Array.prototype.push.apply(
                          arr_out[property].sub_category_2,
                          constructors.sub_category_2,
                        );
                      }
                      check = 1;
                    }
                  }
                  if (check == 0) {
                    var arr_out2 = [constructors];
                    Array.prototype.push.apply(arr_out, arr_out2);
                  }
                }
                output[props].sub_category_1 = arr_out;
                // }
              }
            }
          }
        }
      }
      return callback(null, output);
    }
  });
};

const downloadUom = (req, callback) => {
  const con = req.app.locals.connection;
  con.query('SELECT * FROM uom', function (err, uom, fields) {
    if (err || uom == null) {
      return callback(err, null);
    } else {
      return callback(null, uom);
    }
  });
};
const downloadUomConversion = (req, callback) => {
  const con = req.app.locals.connection;
  con.query('SELECT * FROM uom_conv', function (err, uom, fields) {
    if (err || uom == null) {
      return callback(err, null);
    } else {
      return callback(null, uom);
    }
  });
};
const downloadMaterial = (req, callback) => {
  const con = req.app.locals.connection;
  con.query('SELECT * FROM material_master', function (err, uom, fields) {
    if (err || uom == null) {
      return callback(err, null);
    } else {
      return callback(null, uom);
    }
  });
};

module.exports = {
  fetchAllUom,
  fetchAllUomConversion,
  fetchAllMaterial,
  createUom,
  createUomConversion,
  createMaterial,
  downloadUom,
  downloadUomConversion,
  downloadMaterial,
};
