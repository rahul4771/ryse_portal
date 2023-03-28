const express = require('express');
const logger = require('morgan');
const mysql = require('mysql');
const helmet = require('helmet');
const cors = require('cors');
const URL = require('url').URL;

require('dotenv').config();
const config = require('config');

const path = require('path');

const mainRouter = require('./Routes/main.routes');
const usersRouter = require('./Routes/users.routes');
const adminRouter = require('./Routes/admin.routes');
const customerRouter = require('./Routes/customer.routes');
const quoteLineRouter = require('./Routes/quoteLine.routes');
const quotesRouter = require('./Routes/quotes.routes');
const contractRouter = require('./Routes/contract.routes');
const invoiceRouter = require('./Routes/invoice.routes');
const customerSupplyRouter = require('./Routes/customerSupply.routes');
const filesRouter = require('./Routes/file.routes');

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { Storage } = require('@google-cloud/storage');

const app = express();
const client = new SecretManagerServiceClient();

//Global Variables
app.locals.senderEmail = process.env.SENDER_EMAIL;
app.locals.contactEmail = process.env.CONTACT_EMAIL;

//Middlewares
app.use(helmet());
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Config Vars
let dbConfig;
let dbSecretPath;
let bucketCredential;
let payload;

// instantiate path for stored DATABASE secrets
// TODO integrate with node-config
console.info(`ENV is ${process.env.ENV}`);
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

let cloudStorageSecretPath;

//Set Google Secret Paths
if (
  process.env.ENV == 'production' ||
  process.env.ENV == 'development' ||
  process.env.ENV == 'localhost'
) {
  // 'cause we always want the latest here
  dbSecretPath = path.join(dbSecretPath, 'versions/latest');
}

// instantiate path for stored STORAGE secrets
cloudStorageSecretPath = path.posix.join(
  `${process.env.PROJECT_SECRETS_PATH}`,
  'BUCKET_CREDENTIAL',
);

// ...and 'cause we always want the latest here, but you can't chain path.join method calls... ugh
cloudStorageSecretPath = path.posix.join(
  cloudStorageSecretPath,
  'versions/latest',
);

(async () => {
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

  const con = mysql.createConnection(dbConfig);
  con.connect((err) => {
    if (err) throw err;
    console.info(
      `Connected to database ${con.config.host}:${con.config.port}/${con.config.database}`,
    );
  });

  app.locals.connection = con;
})();

(async () => {
  let version;
  let payload;

  // TODO BEGIN improve this
  if (
    process.env.ENV == 'production' ||
    process.env.ENV == 'development' ||
    process.env.ENV == 'localhost' ||
    process.env.ENV == 'local-rob'
  ) {
    [version] = await client.accessSecretVersion({
      name: cloudStorageSecretPath,
    });
    payload = JSON.stringify(version.payload.data.toString());
  }
  // END TODO improve this

  const storage = new Storage(payload);

  console.info('Created Google Cloud Storage object.');
  // TODO bucket name is already inside the environment...
  app.locals.bucket = storage.bucket(process.env.BUCKET_NAME);

  // for creating various link endpoints, DRY'ly
  // TODO clean up URL's inserted into db; ensure filenames are sanitized (and limit formats?)
  app.locals.bucketLocation = new URL(
    `/${process.env.BUCKET_NAME}`,
    process.env.GOOGLE_STORAGE_API_URL,
  ).href;

  console.info(`bucketLocation is ${app.locals.bucketLocation}`);
})();

app.use('/', mainRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);
app.use('/customers', customerRouter);
app.use('/quotes', quotesRouter);
app.use('/quote-line', quoteLineRouter);
app.use('/contracts', contractRouter);
app.use('/invoices', invoiceRouter);
app.use('/supplies', customerSupplyRouter);
app.use('/files', filesRouter);

// catch 404 and forward to error handler
// app.use(function(err, req, res, next) {
//   res.status(err.status || 404).json({
//     message: "No such route exists"
//   })
// });

// error handler
// app.use(function(err, req, res, next) {
//   res.status(err.status || 500).json({
//     message: "Error Message"
//   })
// });

module.exports = app;

const PORT = process.env.PORT || 8080;
app.listen(PORT);
