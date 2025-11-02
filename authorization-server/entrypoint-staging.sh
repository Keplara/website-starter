#!/bin/sh
set -e

REQUIRED_ENVS="CLIENT_REGISTRATION_SECRET PORT AWS_S3_BUCKET AWS_S3_ENDPOINT AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY JWT_KEY JWT_PAYLOAD_KEY REDIS_HOST REDIS_USERNAME REDIS_PASSWORD REDIS_PORT MONGO_DATABASE MONGO_PORT MONGO_HOST MONGO_USERNAME MONGO_PASSWORD TRUSTSTORE_PASSWORD"

for var in $REQUIRED_ENVS; do
  if [ -z "$(eval echo \$$var)" ]; then
    echo "Error: Environment variable $var is required"
    exit 1
  fi
done

# Continue with your normal startup here, e.g.
# exec java -jar app.jar


TRUSTSTORE_PATH="/tmp/app-truststore.jks"
TRUSTSTORE_PASSWORD="${TRUSTSTORE_PASSWORD:-changeit}"

# echo "Fetching MongoDB CA certificate from SSM..."
# aws ssm get-parameter \
#   --name "$SSM_CA_PARAM" \
#   --with-decryption \
#   --query "Parameter.Value" \
#   --output text > "$CA_PEM_PATH"

echo "Converting CA PEM to JKS truststore..."

# check if cert file exists
if [ ! -f "/certs/mongo-ca.pem" ]; then
  echo "ERROR: CA certificate file '/certs/mongo-ca.pem' not found."
  exit 1
fi


# Import CA into truststore (creates if missing, appends if exists)
if keytool -list -keystore "$TRUSTSTORE_PATH" -storepass "$TRUSTSTORE_PASSWORD" -alias mongoCA >/dev/null 2>&1; then
  echo "Certificate 'MongoCA' already exists in truststore."
else
  echo "Importing CA certificate into truststore..."
  keytool -importcert \
    -file "/certs/mongo-ca.pem" \
    -alias MongoCA \
    -keystore "$TRUSTSTORE_PATH" \
    -storepass "$TRUSTSTORE_PASSWORD" \
    -noprompt
fi

if [ ! -f "$TRUSTSTORE_PATH" ]; then
  echo "ERROR: Trust Store not found '$TRUSTSTORE_PATH' not found."
  exit 1
fi

export TRUSTSTORE_PATH="$TRUSTSTORE_PATH"
export TRUSTSTORE_PASSWORD="$TRUSTSTORE_PASSWORD"

echo "Starting Spring Boot application..."
exec java \
  -Djavax.net.ssl.trustStore="$TRUSTSTORE_PATH" \
  -Djavax.net.ssl.trustStorePassword="$TRUSTSTORE_PASSWORD" \
  -jar app.jar --spring.profiles.active=staging