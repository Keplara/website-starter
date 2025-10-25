#!/bin/sh

set -e
# start server
exec java -Djavax.net.debug=all -jar app.jar --spring.profiles.active=dev