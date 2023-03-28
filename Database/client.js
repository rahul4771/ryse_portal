const util = require('util');
const mysql = require('mysql2');
const path = require('path');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
// TODO WHY does the promise-client fail???
// const mysql = require('mysql2/promise');

const client = new SecretManagerServiceClient();

let dbConfig;
let dbSecretPath = '';

switch (process.env.ENV) {
  case 'production':
    dbSecretPath = path.join(
      `${process.env.PROJECT_SECRETS_PATH}`,
      'DB_CREDENTIAL_PRODUCTION',
    );
    break;
  case 'development':
    dbSecretPath = path.join(
      `${process.env.PROJECT_SECRETS_PATH}`,
      'DB_CREDENTIAL_DEVELOPMENT',
    );
    break;
  case 'local-rob':
    dbConfig = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };
    break;
  case 'localhost':
    dbSecretPath = path.join(
      `${process.env.PROJECT_SECRETS_PATH}`,
      'DB_CREDENTIAL_LOCALHOST',
    );
    break;
  default:
    dbSecretPath = path.join(
      `${process.env.PROJECT_SECRETS_PATH}`,
      'DB_CREDENTIAL_LOCALHOST',
    );
    break;
}

if (dbSecretPath) {
  dbSecretPath = path.join(dbSecretPath, 'versions/latest');
}

const options = {
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

module.exports = {
  getConn: async function () {
    let config;

    if (
      process.env.ENV == 'production' ||
      process.env.ENV == 'development' ||
      process.env.ENV == 'localhost'
    ) {
      const [version] = await client.accessSecretVersion({
        name: dbSecretPath,
      });

      dbConfig = JSON.parse(version.payload.data.toString());
    }

    config = Object.assign(dbConfig, options);

    //console.info(`Creating connection with config ${util.inspect(config)}`);

    var con = mysql.createConnection(config);

    con.connect(function (err) {
      if (err) throw err;
    });

    return con;
  },
  validateEmail: function (email) {
    const re =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  },
  uniqueStr: function (length) {
    if (!length) {
      length = 128;
    }

    var s = [];
    var digits =
      '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';
    for (var i = 0; i < length; i++) {
      s[i] = digits.substr(Math.floor(Math.random() * digits.length - 1), 1);
    }

    var guid = s.join('');
    return guid;
  },
  dbQuery: async function (query, param) {
    //console.info(`Making query:\n ${util.inspect(query)}`);
    //console.info(`Requested params:\n ${util.inspect(param)}`);

    var con = await this.getConn();

    // var data = await con.promise().query(query, param);

    const [rows, fields] = await con.promise().query(query, param);
    //console.info(`Received data:\n ${util.inspect(rows)}`);
    con.end();

    return rows;
  },
  dbGetSingleRow: async function (query, param) {
    var data = await this.dbQuery(query, param);

    return data[0];
  },
  dbGetSingleValue: async function (query, param, defaultValue) {
    var data = await this.dbGetSingleRow(query, param);

    data = data ?? {};

    data = data.val ?? defaultValue;

    return data;
  },
  dbInsert: async function (query, param) {
    var con = await this.getConn();

    var data = await con.promise().query(query, param);

    con.end();

    return data[0].insertId;
  },
  resSend(res, data, status, errors) {
    data = data ?? {};
    status = status?.toString() ?? this.resStatuses.ok;
    errors = errors ?? [];
    if (!Array.isArray(errors)) errors = [errors];

    var rspJson = {};
    rspJson.status = status;
    rspJson.errors = errors;
    rspJson.data = data;

    res.send(JSON.stringify(rspJson));
  },
  resStatuses: Object.freeze({ ok: 'OK', error: 'Error' }),
};
