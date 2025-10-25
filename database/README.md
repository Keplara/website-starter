# Mongo (database) — README

This folder contains Docker configuration and helper commands for running MongoDB locally and building images for deployment. The container can optionally retrieve TLS certificates from AWS ACM/Secrets Manager when required.

## Requirements

- Docker and Docker Compose
- (For TLS/certs) AWS account with permissions to read ACM and/or Secrets Manager
- AWS CLI and jq (for scripts that parse JSON)

## Install the AWS CLI (optional)
See https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

Windows (MSI):

```powershell
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
aws --version
```

Linux / macOS: follow the AWS docs linked above.

## Getting started — local development

1. Create an env file (or export the variables in your shell). Example `.env` or script:

```bash
export MONGO_USER=Supervisor
export MONGO_PASSWORD=Supervisor
```

2. Start services with Docker Compose (example: only Mongo):

```bash
docker compose up -d mongo --build
```

3. To build the MongoDB image (example tag uses ECR style placeholder):

```bash
docker build --rm -f ./Dockerfile.dev -t <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/mysite/mongodb:dev .
```

4. Run the built image locally:

```bash
docker run -p 27018:27018 <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/mysite/mongodb:dev
```

5. Push to ECR (replace `<ACCOUNT>` and ensure you are authenticated):

```bash
aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com
docker push <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/mysite/mongodb:dev
```

Note: the original file referenced pushing `mysite/redis:staging`; ensure you push the correct repository/image name.

## AWS: assume a role and export temporary credentials

Use this snippet to assume an IAM role and set temporary environment variables in bash:

```bash
creds=$(aws sts assume-role \
  --role-arn arn:aws:iam::<ACCOUNT>:role/Developer_Role \
  --role-session-name DevSession)

export AWS_ACCESS_KEY_ID=$(echo "$creds" | jq -r .Credentials.AccessKeyId)
export AWS_SECRET_ACCESS_KEY=$(echo "$creds" | jq -r .Credentials.SecretAccessKey)
export AWS_SESSION_TOKEN=$(echo "$creds" | jq -r .Credentials.SessionToken)
```

Replace `<ACCOUNT>` with your AWS account ID. Keep these temporary credentials secure and do not commit them.

## Retrieve TLS certificate (Secrets Manager) — example

Only for authorized users (do not run unless you have permission):

```bash
export MONGOPEM=$(aws secretsmanager get-secret-value --secret-id mongodbpem --query SecretString --output text)
```

This assumes the secret contains the PEM bundle required by MongoDB and that your container/mounts will make it available at `/etc/ssl/mongodb/mongodb.pem`.

## Creating a MongoDB user (optional)

Connect to the database and run (example using the mongo shell):

```js
db.createUser({
  user: "Supervisor",
  pwd: passwordPrompt(),
  roles: [ { role: "readWrite", db: "development" } ]
});
```

## TLS configuration notes

Example MongoDB TLS options (in `mongod.conf` or equivalent):

```yaml
net:
  tls:
    mode: requireTLS
    certificateKeyFile: /etc/ssl/mongodb/mongodb.pem
    allowConnectionsWithoutCertificates: true
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 11d2686918dc941a486d373d79e85f7773e21255
    # Note: AllowInvalidCertificates is not a standard mongod option; avoid it in production.
```

Security note: enabling `allowConnectionsWithoutCertificates` or accepting invalid certificates weakens TLS security. Only use these options for development or when you fully understand the implications.

## Checksums and encryption examples

Create a SHA-256 checksum and encrypt a secret file with OpenSSL (example):

```bash
openssl sha256 -binary secretfile.txt | openssl base64 > checksum.sha256
openssl aes-256-cbc -in secretfile.txt -out secretfile.enc -pass pass:YOUR_PASSPHRASE
```

Replace `YOUR_PASSPHRASE` with a secure passphrase and manage it appropriately.

## Docker Compose — staging

Bring up the staging Mongo service (example):

```bash
docker compose up -d --build mongo-staging
```

## Troubleshooting & tips

- Make sure Docker has enough disk space for the `mongo-data/` directory.
- Do not commit environment files or secrets to version control.
- If you need to extract an ACM certificate you generally must use AWS CLI + ACM Private CA or export a certificate from Secrets Manager; ACM public certificates cannot be exported.

## Credits / License

This repository contains helper scripts and configuration for running MongoDB in Docker. Adapt as needed for your environment.

---
If you want, I can also: add a sample `.env.example`, validate `docker-compose.yml`, or add a short troubleshooting section tailored to errors you see. Tell me which you'd like next.

<<<<<<< HEAD


## Create TLS Cert

### Create key
openssl genrsa -out ca.key 4096

### Create ca.pem
openssl req -x509 -new -nodes -key ./ca.key -sha256 -days 365 -out ca.pem -subj "/C=US/ST=AZ/L=Phoenix/O=LocalTest/OU=Dev/CN=LocalTestCA"

### Create pem 
cat mongodb.key mongodb.crt > mongodb.pem

# Generate MongoDB private key
openssl genrsa -out mongodb.key 4096

# Generate a certificate signing request (CSR)
openssl req -new -key mongodb.key -out mongodb.csr -subj "/C=US/ST=State/L=City/O=LocalTest/OU=Dev/CN=localhost"

# Sign the MongoDB CSR with your CA
openssl x509 -req -in mongodb.csr -CA ca.pem -CAkey ca.key -CAcreateserial -out mongodb.crt -days 365 -sha256

# Combined pem
cat mongodb.key mongodb.crt > mongodb.pem
=======
<!-- server and client certs need to be figured out -->
## 1️⃣ Create CA
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key -sha256 -days 365 -out ca.pem -subj "/C=US/ST=AZ/L=Phoenix/O=LocalTest/OU=Dev/CN=LocalTestCA"

---

## 2️⃣ Create MongoDB server certificate
# Generate server private key
openssl genrsa -out mongodb.key 4096

# Generate server CSR
openssl req -new -key mongodb.key -out mongodb.csr -subj "/C=US/ST=AZ/L=Phoenix/O=LocalTest/OU=Dev/CN=localhost"

# Sign server CSR with CA
openssl x509 -req -in mongodb.csr -CA ca.pem -CAkey ca.key -CAcreateserial -out mongodb.crt -days 365 -sha256

# Combine server key + cert for Mongo
cat mongodb.key mongodb.crt > mongodb.pem

## 3️⃣ Create Client certificate for your Spring Boot app
# Generate client private key
openssl genrsa -out client.key 4096

# Generate client CSR
openssl req -new -key client.key -out client.csr -subj "/C=US/ST=AZ/L=Phoenix/O=LocalTest/OU=Dev/CN=mongo-client"

# Sign client CSR with the same CA
openssl x509 -req -in client.csr -CA ca.pem -CAkey ca.key -CAcreateserial -out client.crt -days 365 -sha256

# Optional: combine client cert + key for PKCS12
openssl pkcs12 -export \
  -in client.crt \
  -inkey client.key \
  -certfile ca.pem \
  -out keystore.p12 \
  -name mongo-client \
  -password pass:testpassword123

# Convert to JKS (if needed)
keytool -importkeystore \
  -destkeystore keystore.jks \
  -deststorepass testpassword123 \
  -srckeystore keystore.p12 \
  -srcstoretype PKCS12 \
  -srcstorepass testpassword123 \
  -alias mongo-client

## 4️⃣ Create Truststore for verifying Mongo server
keytool -importcert \
  -file ca.pem \
  -alias mongoCA \
  -keystore truststore.jks \
  -storepass testpassword123 \
  -noprompt
=======
    AllowInvalidCertificates: true
>>>>>>> 047533d2310d240cda3111ee3bf9fefc34944842
>>>>>>> 11d2686918dc941a486d373d79e85f7773e21255
