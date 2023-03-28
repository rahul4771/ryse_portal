const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const mysql2Client = require('../Database/client');
const { select, insert, update, remove } = require('../Database/queries');
const util = require('util');
const { recordLog, formattedTimestamp } = require('../lib/db-utils');

const createNewFile = async (req, callback) => {
  let response = null;
  if (typeof req.file != 'undefined') {
    const con = req.app.locals.connection;
    const bucket = req.app.locals.bucket;
    let customer_id = req.body.cust_id;
    let status = req.body.status.length != 0 ? req.body.status : 1;
    let type = req.body.type;
    let type_id = req.body.type_id;
    let publicUrl = null;
    let bucketFolder = null;
    let datetime = new Date().toISOString();
    let authHeader = req.headers.authorization;
    let tableField = '';
    let password =
      req.body.password != undefined &&
      req.body.password != '' &&
      req.body.password != 'undefined'
        ? req.body.password
        : null;
    let userTypeData;
    let file_name,
      created_at,
      updated_at = null;

    if (type.length == 0 || type_id.length == 0 || customer_id.length == 0) {
      response = {
        status: 400,
        message: 'One of the data is missing(type,type id or customer id)',
      };
      return callback(null, response);
    }
    if (authHeader == undefined) {
      return callback(null, { status: 500, error: 'No token provided' });
    }

    let token = authHeader.split(' ')[1];
    let user_type,
      cust_id,
      user_id = null;
    jwt.verify(token, 'secret', function (err, decoded) {
      user_type = decoded.user_type;
      cust_id = decoded.cust_id;
      user_id = decoded.id;
    });

    if (user_type != 'admin') {
      if (type == 'invoice') {
        response = {
          status: 401,
          message: `Customer can't create invoice`,
        };
        return callback(null, response);
      }
      if (customer_id != cust_id || type.includes('admin')) {
        response = {
          status: 401,
          message: 'Invalid Operation',
        };
        return callback(null, response);
      }
    }
    userTypeData = getUserType(type, user_type);
    bucketFolder = userTypeData.bucketFolder;
    tableField = userTypeData.tableField;

    const newFileName = datetime + '-' + req.file.originalname;
    let file = bucket.file(bucketFolder + '/' + newFileName);
    let upload = await file.save(req.file.buffer, function (error) {
      return error
        ? {
            message: 'File failed to upload !',
            status: 500,
          }
        : true;
    });
    file_name = req.file.originalname;
    created_at = formattedTimestamp();
    updated_at = formattedTimestamp();
    publicUrl = `${req.app.locals.bucketLocation}/${file.name}`;
    await checkFileExist(
      con,
      type,
      customer_id,
      tableField,
      type_id,
      async function (err, result) {
        if (result.status == 400) {
          response = {
            status: 400,
            message: 'Invalid data',
          };
          return callback(null, response);
        }
        if (result.status == 200) {
          let file = await mysql2Client.dbQuery(
            update.files.updateByIdAndUserId,
            [
              status,
              file_name,
              publicUrl,
              updated_at,
              password,
              customer_id,
              result.value,
            ],
          );

          if (result.affectedRows != 0) {
            response = {
              status: 200,
              message: 'Updated successfully',
            };
            return callback(null, response);
          } else {
            response = {
              status: 404,
              message: 'Failed to update',
            };
            return callback(null, response);
          }
        } else {
          let file = await mysql2Client.dbQuery(insert.files.create, [
            customer_id,
            status,
            type,
            file_name,
            publicUrl,
            created_at,
            updated_at,
            password,
          ]);

          let file_id = file.insertId;

          await updateTable(
            con,
            customer_id,
            type,
            tableField,
            file_id,
            type_id,
            function (err, result) {
              if (err || result == null) {
                return callback(err, null);
              } else {
                if (result.affectedRows != 0) {
                  response = {
                    status: 200,
                    message: 'Uploaded successfully',
                  };
                  return callback(null, response);
                } else {
                  response = {
                    status: 400,
                    message: 'Failed to upload',
                  };
                  return callback(null, response);
                }
              }
            },
          );
        }
      },
    );
  } else {
    response = {
      status: 400,
      message: 'Please upload file',
    };
    return callback(null, response);
  }
};

const deleteFile = async (req, callback) => {
  let response = null;
  const con = req.app.locals.connection;
  const bucket = req.app.locals.bucket;
  let customer_id = req.body.cust_id;
  let file_id = req.params.id;
  let type = req.body.type;
  let type_id = req.body.type_id;
  let tableField = null;
  let bucketFolder = null;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];

  let user_type,
    cust_id,
    user_id = null;
  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
    user_id = decoded.id;
  });

  let userTypeData = getUserType(type, user_type);
  bucketFolder = userTypeData.bucketFolder;
  tableField = userTypeData.tableField;

  if (
    customer_id.length == 0 ||
    type.length == 0 ||
    type_id.length == 0 ||
    file_id.length == 0
  ) {
    response = {
      status: 400,
      message:
        'One of the data is missing(type, type id, file id or customer id',
    };
    return callback(null, response);
  }
  if (user_type != 'admin') {
    if (customer_id != cust_id || type.includes('admin')) {
      response = {
        status: 401,
        message: 'Invalid Operation',
      };
      return callback(null, response);
    }
  }
  await checkFileExist(
    con,
    type,
    customer_id,
    tableField,
    type_id,
    async function (err, result) {
      if (result.status == 400) {
        response = {
          status: 400,
          message: 'No Query found',
        };
        return callback(null, response);
      } else if (result.status == 500) {
        response = {
          status: 404,
          message: 'File not found',
        };
        return callback(null, response);
      } else if (result.status == 200) {
        if (result.value != file_id) {
          response = {
            status: 400,
            message: 'Invalid operation',
          };
          return callback(null, response);
        } else {
          try {
            await deleteFromTable(
              con,
              bucket,
              customer_id,
              file_id,
              type,
              tableField,
              type_id,
              function (err, result) {
                if (err) {
                  return callback(err, null);
                } else {
                  return callback(null, result);
                }
              },
            );
          } catch (e) {
            return callback(e, null);
          }
        }
      }
    },
  );
};

const deleteFromTable = async (
  con,
  bucket,
  customer_id,
  file_id,
  type,
  tableField,
  type_id,
  callback,
) => {
  let file_name,
    response = null;

  let file = await mysql2Client.dbQuery(select.files.byCustomerIdAndId, [
    customer_id,
    file_id,
  ]);

  if (file.length != 0) {
    file_name = file[0].url.split('ryse_file_upload/')[1];
    const blob = bucket.file(file_name);
    blob
      .delete()
      .then(async () => {
        let file = await mysql2Client.dbQuery(remove.files.byIdAndCustomerId, [
          customer_id,
          file_id,
        ]);

        if (file.affectedRows != 0) {
          await updateTable(
            con,
            customer_id,
            type,
            tableField,
            null,
            type_id,
            function (err, result) {
              if (err || result == null) {
                return callback(err, null);
              } else {
                if (result.affectedRows != 0) {
                  response = {
                    status: 200,
                    message: 'Deleted successfully',
                  };
                  return callback(null, response);
                } else {
                  response = {
                    status: 400,
                    message: 'Failed to update',
                  };
                  return callback(null, response);
                }
              }
            },
          );
        } else {
          response = {
            status: 400,
            message: 'Failed to delete from DB',
          };
        }
      })
      .catch(() => {
        response = {
          status: 400,
          message: 'Failed to delete from GCP',
        };
        return callback(null, response);
      });
  }

  if (file.length == 0) {
    response = {
      status: 404,
      message: 'File not found',
    };
    return callback(null, response);
  }
};

const updateFile = async (req, callback) => {
  let response,
    file_name,
    updated_at = null;

  if (typeof req.file != 'undefined') {
    const con = req.app.locals.connection;
    const bucket = req.app.locals.bucket;
    let customer_id = req.body.cust_id;
    let file_id = req.params.id;
    let status = typeof req.body.status != 'undefined' ? req.body.status : 1;
    let type = req.body.type;
    let publicUrl = null;
    let bucketFolder = null;
    let datetime = new Date().toISOString();
    let authHeader = req.headers.authorization;
    let tableField = '';
    let password =
      req.body.password != undefined &&
      req.body.password != '' &&
      req.body.password != 'undefined'
        ? req.body.password
        : null;
    let userTypeData;

    if (authHeader == undefined) {
      res.status(401).send({ error: 'No token provided' });
    }
    if (typeof customer_id == 'undefined' || typeof file_id == 'undefined') {
      response = {
        status: 500,
        message: 'Please provide valid data',
      };
      return callback(null, response);
    }

    let token = authHeader.split(' ')[1];

    let user_type,
      cust_id,
      user_id = null;

    jwt.verify(token, 'secret', function (err, decoded) {
      user_type = decoded.user_type;
      cust_id = decoded.cust_id;
      user_id = decoded.id;
    });

    if (user_type != 'admin') {
      if (customer_id != cust_id) {
        response = {
          status: 500,
          message: 'Invalid Operation',
        };
        return callback(null, response);
      }
    }

    userTypeData = getUserType(type, user_type);
    bucketFolder = userTypeData.bucketFolder;
    tableField = userTypeData.tableField;
    updated_at = formattedTimestamp();
    const newFileName = datetime + '-' + req.file.originalname;
    let uploadFile = bucket.file(bucketFolder + '/' + newFileName);
    let upload = await uploadFile.save(req.file.buffer, function (error) {
      return error
        ? {
            message: 'File failed to upload !',
            status: 500,
          }
        : true;
    });
    file_name = req.file.originalname;
    publicUrl = `${req.app.locals.bucketLocation}/${uploadFile.name}`;
    let file = await mysql2Client.dbQuery(select.files.byCustomerIdAndId, [
      customer_id,
      file_id,
    ]);
    if (file.length != 0) {
      let file = await mysql2Client.dbQuery(
        update.files.updateByIdAndUserWithCustomerId,
        [
          customer_id,
          status,
          type,
          file_name,
          publicUrl,
          updated_at,
          password,
          customer_id,
          file_id,
        ],
      );

      if (file.affectedRows != 0) {
        response = {
          status: 200,
          message: 'Updated successfully',
        };
        return callback(null, response);
      } else {
        response = {
          status: 500,
          message: 'No matching row found',
        };
        return callback(null, response);
      }
    } else {
      response = {
        status: 500,
        message: 'No matching row found',
      };
      return callback(null, response);
    }
  } else {
    response = {
      status: 500,
      message: 'Please upload file',
    };
  }
  return callback(null, response);
};

const getUserType = (type, user_type) => {
  let tableField = '';
  let bucketFolder = '';
  let userTypeData = {};

  switch (type) {
    case 'admin_tires':
      tableField = 'quote_file_id';
      bucketFolder = 'admin_quotes';
      break;
    case 'customer_tires':
      tableField = 'user_file_id';
      bucketFolder = 'customer_quotes';
      break;
    case 'bluebox':
      bucketFolder = 'customer_quotes';
      break;
    case 'hsp':
      bucketFolder = '';
      break;
    case 'batteries':
      bucketFolder = '';
      break;
    case 'invoice':
      bucketFolder = 'admin_invoices';
      break;
    case 'admin_contract':
      tableField = 'admin_contract_file_id';
      bucketFolder = 'admin_contracts';
      break;
    case 'customer_contract':
      tableField = 'customer_contract_file_id';
      bucketFolder = 'customer_contracts';
      break;
    case 'electronics':
      bucketFolder = '';
  }
  userTypeData.tableField = tableField;
  userTypeData.bucketFolder = bucketFolder;
  return userTypeData;
};

const updateTable = async (
  con,
  cust_id,
  type,
  tableField,
  file_id,
  type_id,
  callback,
) => {
  tireString = 'tires';
  contractString = 'contract';
  if (type.includes(tireString)) {
    type = tireString;
  } else if (type.includes(contractString)) {
    type = contractString;
  }

  switch (type) {
    case 'tires':
      con.query(
        'UPDATE cust_quote_request SET ' +
          tableField +
          '=? WHERE cust_id=? AND id=?',
        [file_id, cust_id, type_id],
        (err, result, fields) => {
          if (err) {
            return callback(err, null);
          } else {
            return callback(null, result);
          }
        },
      );
      break;
    case 'bluebox':
      con.query(
        'UPDATE supply_data_bluebox SET user_file_id=? WHERE organization_id=? AND id=?',
        [file_id, cust_id, type_id],
        (err, result, fields) => {
          if (err) {
            return callback(err, null);
          } else {
            return callback(null, result);
          }
        },
      );
      break;
    case 'hsp':
      // code block
      break;
    case 'batteries':
      // code block
      break;
    case 'invoice':
      con.query(
        'UPDATE cust_invoice SET invoice_file_id=? WHERE cust_id=? AND id=?',
        [file_id, cust_id, type_id],
        (err, result, fields) => {
          if (err) {
            return callback(err, null);
          } else {
            return callback(null, result);
          }
        },
      );
      break;
    case 'contract':
      con.query(
        'UPDATE cust_contract SET ' +
          tableField +
          '=? WHERE cust_id=? AND id=?',
        [file_id, cust_id, type_id],
        (err, result, fields) => {
          if (err) {
            return callback(err, null);
          } else {
            return callback(null, result);
          }
        },
      );
      break;
    case 'electronics':
      break;
    default:
    // code block
  }
};
const checkFileExist = async (
  con,
  type,
  cust_id,
  tableField,
  type_id,
  callback,
) => {
  tireString = 'tires';
  contractString = 'contract';
  if (type.includes(tireString)) {
    type = tireString;
  } else if (type.includes(contractString)) {
    type = contractString;
  }

  switch (type) {
    case 'tires':
      con.query(
        'SELECT * FROM cust_quote_request WHERE cust_id=? AND id=?',
        [cust_id, type_id],
        (err, result, fields) => {
          if (err) {
            return callback(err, null);
          } else {
            if (result.length != 0) {
              if (
                result[0][tableField] != '' &&
                result[0][tableField] != null
              ) {
                response = {
                  status: 200,
                  message: 'file Exist',
                  value: result[0][tableField],
                };
                return callback(null, response);
              } else {
                response = {
                  status: 500,
                  message: 'file not Exist',
                };
                return callback(null, response);
              }
            } else {
              response = {
                status: 400,
                message: 'No Query found',
              };
              return callback(null, response);
            }
          }
        },
      );
      break;
    case 'bluebox':
      con.query(
        'SELECT * FROM supply_data_bluebox WHERE organization_id=? AND id=?',
        [cust_id, type_id],
        (err, result, fields) => {
          if (err) {
            return callback(err, null);
          } else {
            if (result.length != 0) {
              if (
                result[0].user_file_id != '' &&
                result[0].user_file_id != null
              ) {
                response = {
                  status: 200,
                  message: 'file Exist',
                  value: result[0].user_file_id,
                };
                return callback(null, response);
              } else {
                response = {
                  status: 500,
                  message: 'file not Exist',
                };
                return callback(null, response);
              }
            } else {
              response = {
                status: 400,
                message: 'No Query found',
              };
              return callback(null, response);
            }
          }
        },
      );
      break;
    case 'hsp':
      // code block
      break;
    case 'batteries':
      // code block
      break;
    case 'invoice':
      con.query(
        'SELECT * FROM cust_invoice WHERE cust_id=? AND id=?',
        [cust_id, type_id],
        (err, result, fields) => {
          if (err) {
            return callback(err, null);
          } else {
            if (result.length != 0) {
              if (
                result[0].invoice_file_id != '' &&
                result[0].invoice_file_id != null
              ) {
                response = {
                  status: 200,
                  message: 'file Exist',
                  value: result[0].invoice_file_id,
                };
                return callback(null, response);
              } else {
                response = {
                  status: 500,
                  message: 'file not Exist',
                };
                return callback(null, response);
              }
            } else {
              response = {
                status: 400,
                message: 'No Query found',
              };
              return callback(null, response);
            }
          }
        },
      );
      break;
    case 'contract':
      con.query(
        'SELECT * FROM cust_contract WHERE cust_id=? AND id=?',
        [cust_id, type_id],
        (err, result, fields) => {
          if (err) {
            return callback(err, null);
          } else {
            if (result.length != 0) {
              if (
                result[0][tableField] != '' &&
                result[0][tableField] != null
              ) {
                response = {
                  status: 200,
                  message: 'file Exist',
                  value: result[0][tableField],
                };
                return callback(null, response);
              } else {
                response = {
                  status: 500,
                  message: 'file not Exist',
                };
                return callback(null, response);
              }
            } else {
              response = {
                status: 400,
                message: 'No Query found',
              };
              return callback(null, response);
            }
          }
        },
      );
      break;
    case 'electronics':
      break;
    default:
    // code block
  }
};

module.exports = {
  createNewFile,
  deleteFile,
  updateFile,
};
