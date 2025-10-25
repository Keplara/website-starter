Start


### VSCode


## Add Tasks .vscode/tasks.json
```json
{
	"version": "2.0.0",
	"tasks": [
		{
            "label": "gradle: bootRun",
            "type": "shell",
            "command": "./gradlew bootRun --args='--spring.profiles.active=dev'",
            "options": {
                "env": {
                     "AWS_ACCESS_KEY_ID": "",
                     "AWS_SECRET_ACCESS_KEY": "",
                     "AWS_SESSION_TOKEN": "",    
                     "AWS_S3_BUCKET": "certificates" 
                       }
                },
            "group": {
                "kind": "build",
                "isDefault": true
              }
        },
        {
            "label": "gradle: bootRunProduction",
            "type": "shell",
            "command": "./gradlew bootRun --args='--spring.profiles.active=prod'",
            "options": {
                "env": {
                     "AWS_ACCESS_KEY_ID": "",
                     "AWS_SECRET_ACCESS_KEY": "",
                     "AWS_SESSION_TOKEN": "",    
                     "AWS_S3_BUCKET": "certificates" 
                       }
                },
            "group": {
                "kind": "build",
                "isDefault": true
              }
        }
	]
}
```

## Add Settings .vscode/settings.json
```json
{
  "java.debug.settings.onBuildFailureProceed": true,
  "java.debug.settings.enableRunDebugCodeLens": true,
  "gradle.debug":true,
  "java.jdt.ls.java.home": "C:\\Program Files\\Java\\jdk-17",
  "java.configuration.updateBuildConfiguration": "automatic",
  "java.compile.nullAnalysis.mode": "automatic",
  "java.import.gradle.java.home": "C:\\Program Files\\Java\\jdk-17"
}
```

## Add Launch .vscode/launch.json

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "java",
      "name": "Gradle SpringBoot BootDevRun",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "projectName": "auth-service",
      "mainClass": "com.mysite.auth_service.AuthApplication",
      "preLaunchTask": "gradle: bootRun"
    },
    {
      "type": "java",
      "name": "Gradle SpringBoot BootRun",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "projectName": "auth-service",
      "mainClass": "com.mysite.auth_service.AuthApplication",
      "preLaunchTask": "gradle: bootRun"
    },
    {
      "type": "java",
      "name": "Debug (Gradle) SpringBoot BootTestRun",
      "request": "attach",
      "hostName": "localhost",
      "port": 5005,
      "projectName": "auth-service",
      "preLaunchTask": "gradle: bootTestRun"
    }
  ]
}
```

## Developer Role 
```bash
aws configure

aws sts assume-role --role-arn arn:aws:iam::[id]:role/Developer_Role --role-session-name client-test          
```


```bash
export REDIS_USER=Supervisor \
export REDIS_PASSWORD=Supervisor \
export JWT_KEY=Test \
export JWT_PAYLOAD_KEY=Test \
export PORT=8084

```

# Generate TrustStore
```shell
  keytool -importcert \
  -file certs/ca.pem \
  -alias mongoCA \
  -keystore certs/truststore.jks \
  -storepass testpassword123 \
  -noprompt

  openssl pkcs12 -export \
  -in certs/fullchain.pem \
  -out certs/keystore.p12 \
  -name mongo-client \
  -password pass:testpassword123

  keytool -importkeystore \
  -destkeystore certs/keystore.jks \
  -deststorepass testpassword123 \
  -srckeystore certs/keystore.p12 \
  -srcstoretype PKCS12 \
  -srcstorepass testpassword123 \
  -alias mongo-client
```

1) Inspect the keystore / truststore

List entries (replace <storepass> with your store password):

```bash
keytool -list -v -keystore certs/keystore.jks -storepass <storepass>
keytool -list -v -keystore certs/truststore.jks -storepass <storepass>
```

This shows aliases (for example `mongo-client`, `mongoCA`) and fingerprints so you can identify which alias to export.

2) Quick conversion & extraction (parameterized)

If you need to convert a JKS keystore to PKCS#12 and extract certificate/key materials, the steps below use placeholders — replace `testpassword123`, `mongo-client` and file names with your values.

```bash
# convert JKS -> PKCS12
keytool -importkeystore \
  -srckeystore certs/keystore.jks \
  -srcstorepass <storepass> \
  -srcstoretype JKS \
  -destkeystore certs/keystore.p12 \
  -deststoretype PKCS12 \
  -deststorepass <storepass> \
  -alias <alias>

# extract client cert (PEM)
openssl pkcs12 -in certs/keystore.p12 -clcerts -nokeys \
  -out certs/cert.pem -passin pass:<storepass>

# extract private key (PEM) — note: -nodes writes an unencrypted key
openssl pkcs12 -in certs/keystore.p12 -nocerts -nodes \
  -out certs/key.pem -passin pass:<storepass>

# extract CA certs (if present)
openssl pkcs12 -in certs/keystore.p12 -cacerts -nokeys \
  -out certs/ca-from-p12.pem -passin pass:<storepass>

# or export CA from a JKS truststore and convert DER -> PEM
keytool -exportcert -alias <ca-alias> \
  -keystore certs/truststore.jks -storepass <storepass> \
  -file certs/ca.der
openssl x509 -inform der -in certs/ca.der -out certs/ca.pem

# (optional) concatenate into a single combined PEM: cert, key, CA
cat certs/cert.pem certs/key.pem certs/ca.pem > certs/fullchain.pem
chmod 600 certs/fullchain.pem
```

Notes:
- Replace all placeholder values (`<storepass>`, `<alias>`, `<ca-alias>`) before running.
- Avoid writing unencrypted private keys when possible. If you omit `-nodes` OpenSSL will prompt for a passphrase.
- Protect private key files (e.g. `chmod 600`).
