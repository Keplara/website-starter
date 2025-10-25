#!/bin/bash
set -e

echo "Starting MongoDB with TLS enabled..."
echo "MONGO_USER: $MONGO_USER"
echo "MONGO_PASSWORD: $MONGO_PASSWORD"

# Ensure the mongo-init.js file is present at the right location
if [ ! -f /docker-entrypoint-initdb.d/mongo-init.js ]; then
  echo "Error: /docker-entrypoint-initdb.d/mongo-init.js not found!"
  exit 1
fi

# Now call Mongo's default entrypoint
exec docker-entrypoint.sh "$@"