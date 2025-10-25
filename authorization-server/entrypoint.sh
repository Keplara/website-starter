#!/bin/sh
exec java \
  -Djavax.net.debug=all \
  -Djavax.net.ssl.trustStore=/certs/truststore.jks \
  -Djavax.net.ssl.trustStorePassword="$TRUST_STORE_PASSWORD" \
  -Djavax.net.ssl.keyStore=/certs/keystore.jks \
  -Djavax.net.ssl.keyStorePassword="$KEY_STORE_PASSWORD" \
  -jar app.jar