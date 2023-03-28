# Ryse Portal
## _The Open API documentation is available in_ 
...
## Local Development
In order to access the Cloud SQL database while running the app locally via 'npm start' simply change the environment to 'localhost' after setting up cloud_sql_proxy (https://cloud.google.com/sql/docs/mysql/connect-admin-proxy#macos-64-bit or using the gcloud component) and creating the connection via 'cloud_sql_proxy -instances=ryse-portal:northamerica-northeast2:upryse-dev=tcp:3306'.

You will also need to create a new JSON key from the app-engine service-account and add it to your $PATH via export GOOGLE_APPLICATION_CREDENTIALS= (see https://cloud.google.com/docs/authentication/getting-started for further info)

## Development Environment
Please add **service: dev-upryse** in the development app.yaml file when deploy the code to GCP 
