#!/bin/bash
set -e

# --- Validate required environment variables ---
if [[ -z "$REDIS_USER" ]]; then
  echo "❌ ERROR: REDIS_USER is not set. Exiting."
  exit 1
fi

if [[ -z "$REDIS_PASSWORD" ]]; then
  echo "❌ ERROR: REDIS_PASSWORD is not set. Exiting."
  exit 1
fi

echo "✅ Starting Redis with user: ${REDIS_USER}"
echo "✅ Starting Redis with password: [HIDDEN]"

CONF_FILE="/usr/local/etc/redis/redis.conf"
mkdir -p "$(dirname "$CONF_FILE")"

# Ensure requirepass line exists and matches current REDIS_USER
if ! grep -q "^requirepass " "$CONF_FILE" 2>/dev/null; then
  echo "requirepass ${REDIS_USER}" >> "$CONF_FILE"
else
  sed -i "s/^requirepass .*/requirepass ${REDIS_USER}/" "$CONF_FILE"
fi

# needs to reflect "requirepass ${REDIS_USER}" && echo "user ${REDIS_USER} on >${REDIS_PASSWORD} ~* +@all"

# Add user definition only if missing
if ! grep -q "user ${REDIS_USER} " "$CONF_FILE" 2>/dev/null; then
  echo "user ${REDIS_USER} on >${REDIS_PASSWORD} ~* +@all" >> "$CONF_FILE"
fi

# Add default user restriction if missing
if ! grep -q "^user default " "$CONF_FILE" 2>/dev/null; then
  echo "user default off nopass nocommands" >> "$CONF_FILE"
fi

exec redis-server "$CONF_FILE"
