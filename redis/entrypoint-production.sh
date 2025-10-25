#!/bin/bash
set -e

# Use a default region or override with an env var
REGION="${AWS_REGION:-us-east-1}"

# Get Redis credentials from AWS Secrets Manager
REDIS_USER="${REDIS_USER:-$(aws secretsmanager get-secret-value --secret-id redis-secrets --region $REGION --query SecretString --output text | jq -r .username)}"
REDIS_PASSWORD="${REDIS_PASSWORD:-$(aws secretsmanager get-secret-value --secret-id redis-secrets --region $REGION --query SecretString --output text | jq -r .password)}"
mkdir -p /usr/local/etc/redis

echo "requirepass ${REDIS_USER}" &&
echo "user ${REDIS_USER} on >${REDIS_PASSWORD} ~* +@all" >> /usr/local/etc/redis/redis.conf &&
echo "user default off nopass nocommands" >> /usr/local/etc/redis/redis.conf

exec redis-server /usr/local/etc/redis/redis.conf