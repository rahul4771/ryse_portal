// Imports the Secret Manager library
const path = require('path');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

async function accessSecretVersion(secretKey, callback) {
  let name = path.join(
    `${process.env.PROJECT_SECRETS_PATH}`,
    `${secretKey}/versions/latest`,
  );
  const [version] = await client.accessSecretVersion({
    name: name,
  });
  const payload = version.payload.data.toString();
  return callback(null, payload);
}

module.exports = {
  accessSecretVersion,
};
