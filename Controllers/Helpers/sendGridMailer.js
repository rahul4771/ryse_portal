const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const nodemailerSendgrid = require('nodemailer-sendgrid');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const path = require('path');

const client = new SecretManagerServiceClient();

// point to the template folder
const handlebarOptions = {
  viewEngine: {
    partialsDir: path.resolve('./notifications/'),
    defaultLayout: false,
  },
  viewPath: path.resolve('./notifications/'),
  extName: '.html',
};

let transporter;
let SENDGRID_API_KEY = '';
let sendGridSecretPath = path.posix.join(
  `${process.env.PROJECT_SECRETS_PATH}`,
  'SENDGRID_API_KEY',
);

sendGridSecretPath = path.posix.join(sendGridSecretPath, 'versions/latest');
let payload = '';

async function getSendGridSecret() {
  const [version] = await client.accessSecretVersion({
    name: sendGridSecretPath,
  });

  payload = version.payload.data.toString();

  switch (process.env.ENV) {
    case 'local-rob':
      transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        auth: {
          user: process.env.MAIL_USERNAME,
          pass: process.env.MAIL_PASSWORD,
        },
      });
      break;
    default:
      transporter = nodemailer.createTransport(
        nodemailerSendgrid({
          apiKey: payload,
        }),
      );
      break;
  }

  // use a template file with nodemailer
  transporter.use('compile', hbs(handlebarOptions));
}

getSendGridSecret();

const sendMail = (mailOptions, callback) => {
  transporter.sendMail(mailOptions, function (err, result) {
    if (err) {
      return callback(err, null);
    } else {
      return callback(null, result);
    }
  });
};
module.exports = {
  sendMail,
};
