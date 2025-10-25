#!/bin/sh

# Minimal entrypoint: fetch only JKS files from certs/internal/redis/ in S3
# into /certs/redis. Requires awscli available in the image and the
# following env vars: AWS_S3_BUCKET (required), optional AWS_S3_ENDPOINT,
# and AWS credentials via env or role.

set -e

if [ -z "$AWS_S3_BUCKET" ]; then
	echo "AWS_S3_BUCKET not set — skipping redis cert fetch"
	exit 0
fi

mkdir -p /certs/redis
SRC_PREFIX="internal/redis/"

echo "Fetching JKS files from s3://$AWS_S3_BUCKET/$SRC_PREFIX -> /certs/redis/"
if [ -n "$AWS_S3_ENDPOINT" ]; then
	aws --endpoint-url "$AWS_S3_ENDPOINT" s3 cp "s3://$AWS_S3_BUCKET/$SRC_PREFIX" /certs/redis --recursive --exclude "*" --include "*.jks" || echo "No JKS found or failed to fetch"
else
	aws s3 cp "s3://$AWS_S3_BUCKET/$SRC_PREFIX" /certs/redis --recursive --exclude "*" --include "*.jks" || echo "No JKS found or failed to fetch"
fi

echo "Finished fetching redis JKS files. Contents of /certs/redis:"
ls -l /certs/redis || true

mkdir -p /certs/mongo
SRC_PREFIX="internal/mongo/"

echo "Fetching JKS files from s3://$AWS_S3_BUCKET/$SRC_PREFIX -> /certs/mongo/"
if [ -n "$AWS_S3_ENDPOINT" ]; then
	aws --endpoint-url "$AWS_S3_ENDPOINT" s3 cp "s3://$AWS_S3_BUCKET/$SRC_PREFIX" /certs/mongo --recursive --exclude "*" --include "*.jks" || echo "No JKS found or failed to fetch"
else
	aws s3 cp "s3://$AWS_S3_BUCKET/$SRC_PREFIX" /certs/mongo --recursive --exclude "*" --include "*.jks" || echo "No JKS found or failed to fetch"
fi

echo "Finished fetching mongo JKS files. Contents of /certs/mongo:"
ls -l /certs/mongo || true

mkdir -p /certs/webserver
SRC_PREFIX="internal/webserver/"

echo "Fetching JKS files from s3://$AWS_S3_BUCKET/$SRC_PREFIX -> /certs/webserver/"
if [ -n "$AWS_S3_ENDPOINT" ]; then
	aws --endpoint-url "$AWS_S3_ENDPOINT" s3 cp "s3://$AWS_S3_BUCKET/$SRC_PREFIX" /certs/webserver --recursive --exclude "*" --include "*.jks" || echo "No JKS found or failed to fetch"
else
	aws s3 cp "s3://$AWS_S3_BUCKET/$SRC_PREFIX" /certs/webserver --recursive --exclude "*" --include "*.jks" || echo "No JKS found or failed to fetch"
fi

echo "Finished fetching webserver JKS files. Contents of /certs/webserver:"
ls -l /certs/webserver || true

export MONGO_KEY_STORE_LOCATION="/certs/mongo/keystore.jks"
export MONGO_TRUST_STORE_LOCATION="/certs/mongo/truststore.jks"
if secret=$(aws secretsmanager get-secret-value --secret-id mongo_keystore_password --region "${AWS_REGION}" --query SecretString --output text 2>/dev/null); then
  export MONGO_KEY_STORE_PASSWORD="$secret"
else
  echo "Failed to retrieve secret 'mongo_keystore_password' — leaving MONGO_KEY_STORE_PASSWORD unset"
fi

if secret=$(aws secretsmanager get-secret-value --secret-id mongo_truststore_password --region "${AWS_REGION}" --query SecretString --output text 2>/dev/null); then
  export MONGO_TRUST_STORE_PASSWORD="$secret"
else
  echo "Failed to retrieve secret 'mongo_truststore_password' — leaving MONGO_TRUST_STORE_PASSWORD unset"
fi

export REDIS_KEY_STORE_LOCATION="/certs/redis/keystore.jks"
export REDIS_TRUST_STORE_LOCATION="/certs/redis/truststore.jks"
if secret=$(aws secretsmanager get-secret-value --secret-id redis_keystore_password --region "${AWS_REGION}" --query SecretString --output text 2>/dev/null); then
  export REDIS_KEY_STORE_PASSWORD="$secret"
else
  echo "Failed to retrieve secret 'redis_keystore_password' — leaving REDIS_KEY_STORE_PASSWORD unset"
fi

if secret=$(aws secretsmanager get-secret-value --secret-id redis_truststore_password --region "${AWS_REGION}" --query SecretString --output text 2>/dev/null); then
  export REDIS_TRUST_STORE_PASSWORD="$secret"
else
  echo "Failed to retrieve secret 'redis_truststore_password' — leaving REDIS_TRUST_STORE_PASSWORD unset"
fi

export WEBSERVER_KEY_STORE_LOCATION="/certs/webserver/keystore.jks"
export WEBSERVER_TRUST_STORE_LOCATION="/certs/webserver/truststore.jks"

if secret=$(aws secretsmanager get-secret-value --secret-id webserver_keystore_password --region "${AWS_REGION}" --query SecretString --output text 2>/dev/null); then
  export WEBSERVER_KEY_STORE_PASSWORD="$secret"
else
  echo "Failed to retrieve secret 'webserver_keystore_password' — leaving WEBSERVER_KEY_STORE_PASSWORD unset"
fi

if secret=$(aws secretsmanager get-secret-value --secret-id webserver_truststore_password --region "${AWS_REGION}" --query SecretString --output text 2>/dev/null); then
  export WEBSERVER_TRUST_STORE_PASSWORD="$secret"
else
  echo "Failed to retrieve secret 'webserver_truststore_password' — leaving WEBSERVER_TRUST_STORE_PASSWORD unset"
fi

# start server
exec java -jar app.jar --spring.profiles.active=prod