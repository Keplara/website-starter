#!/bin/bash
set -e

echo "Starting Redis with user: $REDIS_USER"
echo "Starting Redis with password: $REDIS_PASSWORD"

mkdir -p /usr/local/etc/redis

echo "requirepass ${REDIS_USER}" &&
echo "user ${REDIS_USER} on >${REDIS_PASSWORD} ~* +@all" >> /usr/local/etc/redis/redis.conf &&
echo "user default off nopass nocommands" >> /usr/local/etc/redis/redis.conf

exec redis-server /usr/local/etc/redis/redis.conf